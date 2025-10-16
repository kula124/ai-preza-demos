import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/repo/schema";

type DatabaseInstance = NodePgDatabase<typeof schema>;

// Global singleton instance
declare global {
	// biome-ignore lint/style/noVar: Required for global declaration
	var __db: DatabaseInstance | undefined;
}

export const getDb = (): DatabaseInstance => {
	// Return empty object during build time to prevent connection attempts
	if (process.env.BUILD === "true") {
		return {} as DatabaseInstance;
	}

	// Reuse existing instance
	if (globalThis.__db) {
		return globalThis.__db;
	}

	// Validate environment
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL environment variable is not set");
	}

	// Create new instance
	const pool = new Pool({
		connectionString: process.env.DATABASE_URL,
	});

	const dbInstance = drizzle(pool, { schema });

	// Cache globally
	globalThis.__db = dbInstance;

	return dbInstance;
};
