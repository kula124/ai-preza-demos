import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL environment variable is required");
}

export default defineConfig({
	out: "./drizzle",
	schema: "./src/repo/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
	verbose: true,
	strict: true,
});
