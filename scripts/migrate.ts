/**
 * Run once to create Better-Auth tables in Supabase.
 * Usage:  npx tsx scripts/migrate.ts
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });

import { Pool } from "pg";
import { getMigrations } from "better-auth/db/migration";
import { auth } from "../api/_lib/auth.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log("Fetching Better-Auth migrations…");
const { toBeCreated, runMigrations } = await getMigrations(auth.options);

if (toBeCreated.length === 0) {
  console.log("✅ Nothing to migrate — all tables already exist.");
} else {
  console.log(`Creating ${toBeCreated.length} table(s): ${toBeCreated.map((t: { table: string }) => t.table).join(", ")}`);
  await runMigrations();
  console.log("✅ Migration complete.");
}

await pool.end();
