# DuckDB vs ClickHouse vs Postgres for Analytics

## TL;DR

Three answers to "I need to do analytics." Most teams pick the wrong one — usually ClickHouse, because it sounds impressive. **In 2026, the right default for new analytical workloads is roughly: Postgres if you already have one and the data fits, DuckDB if you don't, ClickHouse only if you've measured and proven you need it.** If your data fits on one disk in 2026, you probably don't need a cluster.

## The three engines at a glance

| Axis | Postgres | DuckDB | ClickHouse |
|------|----------|--------|------------|
| **Shape** | Row-oriented OLTP, OLAP-capable | Columnar OLAP, embedded | Columnar OLAP, distributed |
| **Deployment** | Server | Library inside your process | Server cluster |
| **Concurrency** | Many writers, many readers | One writer, many readers | Many writers, many readers |
| **Scale ceiling** | ~10s of TB on big iron | ~1 TB single machine | PB across cluster |
| **Ingest rate** | 10s of k/s | 100s of k/s | Millions/s |
| **Query latency** | 10–500 ms | sub-ms to seconds (no network) | 10–100 ms (network hop) |
| **Ops complexity** | Familiar | None (it's a library) | Real (Keeper, replicas, sharding) |
| **License** | PostgreSQL | MIT | Apache 2.0 |
| **Sweet spot** | Transactional + moderate analytics | Embedded analytics, ETL, ad-hoc | High-volume event streams, observability |

## Postgres for analytics — more often than you think

Most Postgres-already-deployed projects don't need anything else. Things people don't realize Postgres can handle:

- **Hundreds of millions of rows** for most queries, if you use BRIN indexes on time-series and partitioning on hot tables
- **Materialized views** for pre-aggregated rollups (refresh nightly or on-demand)
- **Logical replication** to a read-replica dedicated to analytics, so analytics doesn't fight OLTP
- **Extensions** for the gnarly cases: [`pg_stat_statements`](https://www.postgresql.org/docs/current/pgstatstatements.html), [`pg_partman`](https://github.com/pgpartman/pg_partman), [`timescaledb`](https://github.com/timescale/timescaledb) (real time-series), [`citus`](https://github.com/citusdata/citus) (sharding when you genuinely need it)

If you're already running Postgres and someone asks for an "analytics dashboard," **try Postgres first** with a materialized view and BRIN index. You may be one CTE away from done.

### When Postgres stops being enough
- You're scanning >10–50 GB per query routinely (columnar wins big here)
- You're ingesting > ~50k rows/s sustained
- Your queries are mostly aggregates over wide tables → row-oriented storage costs you 10–100× on I/O
- Mixed OLTP + heavy analytics on the same table is causing lock/vacuum pressure

## DuckDB — the embedded analytics dark horse

DuckDB is "SQLite for analytics." Single file on disk, runs inside your application process, no server, no port, no replication. Columnar storage, vectorized execution, full SQL.

### Where DuckDB wins
- **Embedded analytics in apps** — your Go/Python/TS service does its own dashboards locally; no separate data warehouse to deploy and pay for
- **ETL and ad-hoc data work** — query Parquet/CSV/JSON files directly from disk or S3 without loading them first
- **Single-machine, single-user analytical tools** — admin panels, internal reporting, scraped data analysis
- **Notebooks and analyst workflows** — pandas/Polars folks reach for DuckDB because it's just SQL on dataframes with no infra
- **Edge analytics** — runs in WASM, can sit in a Cloudflare Worker or a desktop app

### Killer features
- Query Parquet/CSV directly: `SELECT * FROM 'data.parquet' WHERE …` — no load step
- Reads partitioned Hive layouts from S3 with pruning
- Bundles with your app (single binary deploy)
- Sub-millisecond latency because there's no network hop

### When DuckDB stops being enough
- More than one process needs to *write* concurrently (it's single-writer)
- You need replication/HA for the analytical store itself
- You're past ~1 TB on a single machine
- You need real-time multi-user concurrent reads at high QPS

## ClickHouse — when you actually have the data

ClickHouse is real-time analytical infrastructure. Designed for "we ingest a billion events a day and want sub-second queries over arbitrary slices of last week."

### Where ClickHouse wins
- **Observability and log aggregation** — replacing Elastic for traces/metrics/logs
- **Web analytics** — its original use case at Yandex
- **Event streams / clickstreams** — millions of inserts per second, materialized views aggregating in real time
- **Multi-tenant SaaS analytics** — when many tenants query a shared big table
- **Sharded scale** — horizontal scaling on commodity hardware

### Killer features
- `MergeTree` engine family for write-optimized columnar storage
- Async inserts that batch on the server side (so you can write naïvely from many clients)
- Materialized views that refresh incrementally on insert
- `ReplicatedMergeTree` for HA via Keeper/ZooKeeper
- `Distributed` table engine for transparent sharding

### What ClickHouse costs you
- An operational footprint: Keeper, replicas, sharding strategy, schema migrations, version upgrades
- Eventual consistency between replicas (small window, but it's there)
- Update/delete is expensive — designed append-mostly
- Joins are weaker than Postgres — you denormalize and live with it
- Schema design is a real skill (sort key, partition key, codec choice all matter for perf)

## The decision tree

```
Do you already run Postgres?
├── Yes
│   └── Does the analytics query you need run in <2s on it
│       with one materialized view + a BRIN index?
│       ├── Yes → 🟢 Stay on Postgres. Done.
│       └── No  → continue ↓
│
└── Are you building a single-process app/tool/dashboard?
    ├── Yes → 🟢 DuckDB. Single file, no infra, ship the binary.
    │
    └── Are you ingesting >100k rows/s OR data >1TB
        OR many concurrent writers OR multi-tenant analytics?
        ├── Yes → 🟢 ClickHouse. You're now in its territory.
        │
        └── No → 🟢 DuckDB still, or a Postgres read-replica.
```

## Concrete sizing examples

| Scenario | Right answer |
|----------|--------------|
| 200 MB property dataset, admin tool, single user | **DuckDB** |
| 50M rows of user events/day, real-time dashboards | **ClickHouse** |
| 100k rows/day audit log, queried weekly | **Postgres** — materialized view, done |
| 5 GB CSV from a vendor, one-off analysis | **DuckDB** — query the CSV directly |
| Multi-tenant SaaS, each tenant has 1B events | **ClickHouse** |
| Internal BI dashboard over your Postgres OLTP DB | **Postgres read-replica**, maybe + dbt |
| Vercel-hosted Next.js app needing embedded analytics | **DuckDB** (also runs in serverless) |
| Replacing Elastic for log search at scale | **ClickHouse** |

## A real-world case study

I have a project ("katastar" — a Croatian cadastre admin tool) that uses DuckDB. ~157 MB of property data, single-user, bind-mounted file inside a Go binary, deployed as one container.

ClickHouse would have been overkill on every axis:
- **Ops**: a cluster (or even a single ClickHouse server with Keeper) for what fits in 157 MB
- **Latency**: localhost network hop vs no hop at all
- **Build**: separate service, separate Dockerfile, separate deploy lifecycle
- **Concurrency**: one user — single-writer DuckDB is fine

Postgres would have been *fine* but redundant — there's nothing else in the app that needs OLTP, and DuckDB queries the same data with better analytical performance and zero extra infrastructure.

If the project grew to (a) hundreds of concurrent users querying live, (b) live data updates at high QPS, or (c) cross-table joins on billions of rows, **then** we'd revisit. None of those are true.

## ⚠️ The common mistakes

### 🚫 ClickHouse because "we'll have lots of data eventually"

The most expensive mistake. You're building infrastructure for a load you don't have, paying ops cost forever for hypothetical scale. Build for today + 6 months. Re-architect when you measure the need.

### 🚫 Postgres past its breaking point because "we already have it"

The opposite mistake. You bolt analytics onto your OLTP database, your nightly aggregation takes 4 hours, your dashboard query locks your `users` table, and you've now made *both* products slower. Move analytics to a read-replica or to DuckDB/ClickHouse when the symptoms appear.

### 🚫 DuckDB shoved into a multi-user web app

It's a library, not a database server. If two processes need to write the same DuckDB file, you'll hit lock errors. Use it for embedded analytics, ETL, single-user tools — not as the backing store for a multi-tenant SaaS.

### 🚫 Reaching for Snowflake/BigQuery on day one

For a brand-new project: a managed warehouse adds latency, costs more per query than self-hosting at small scale, and locks you in. They're great at scale; they're wasteful at prototype size.

## ✅ Picker checklist

Before reaching for ClickHouse, can you say "yes" to most of these?

- [ ] You've measured the actual data size, not the rumored future size
- [ ] You've measured the actual ingest rate, not the marketing-hoped one
- [ ] You've tried the workload on Postgres with at least one materialized view
- [ ] You have at least one team member who's run ClickHouse in prod before
- [ ] You're prepared to design `MergeTree` sort keys / partition keys deliberately
- [ ] You've budgeted for Keeper/replica ops, not just the server itself

If you're answering "no" to most of these, **DuckDB or Postgres**, not ClickHouse.

## Related

- [When to use RAG (and when not to)](./when-rag-when-not.md) — same shape of decision, different domain
- [Context Windows & Tokens](../concepts/context-windows-and-tokens.md) — "scale-first" mistakes recur across AI infra too
- *(coming) When to reach for managed warehouses (Snowflake / BigQuery / Redshift)*
