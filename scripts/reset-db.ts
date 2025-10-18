import { getDb } from "../src/lib/db";
import { sql } from "drizzle-orm";
import pg from "pg";

async function resetDatabase() {
	console.log("🔍 Inspecting database for tables...");

	const pool = new pg.Pool({
		connectionString: process.env.DATABASE_URL,
	});

	try {
		// Get all tables in the public schema (excluding system tables)
		const result = await pool.query(`
			SELECT tablename
			FROM pg_tables
			WHERE schemaname = 'public'
			AND tablename NOT LIKE 'pg_%'
			AND tablename NOT LIKE 'sql_%'
			ORDER BY tablename;
		`);

		const tables = result.rows.map((row) => row.tablename);

		console.log(`\n📋 Found ${tables.length} tables:`);
		tables.forEach((table) => console.log(`   - ${table}`));

		if (tables.length === 0) {
			console.log("\n✅ No tables to truncate!");
			await pool.end();
			process.exit(0);
		}

		console.log("\n🗑️  Truncating all tables...");

		// Truncate all tables with CASCADE to handle foreign keys
		for (const table of tables) {
			console.log(`   Truncating ${table}...`);
			await pool.query(`TRUNCATE TABLE "${table}" CASCADE;`);
		}

		console.log("\n✅ All tables truncated successfully!");
		console.log(
			"\n📝 Next steps:\n   1. Tables still exist with schema intact\n   2. Run: npm run seed-positions\n   3. Run: npm run embed-applications (if needed)",
		);

		await pool.end();
	} catch (error) {
		console.error("❌ Error resetting database:", error);
		await pool.end();
		throw error;
	}

	process.exit(0);
}

resetDatabase();
