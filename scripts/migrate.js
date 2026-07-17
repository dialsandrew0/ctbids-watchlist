#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing environment variables");
  console.error("Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigrations() {
  console.log("🔄 Running database migrations...\n");

  const migrationsDir = path.join(__dirname, "..", "migrations");
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    try {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`📝 Running ${file}...`);
      console.log(`   ⚠️  Manual execution needed. Copy the SQL from migrations/${file} to your Supabase SQL editor.`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  console.log("\n✅ Migration process complete!");
  console.log("💡 Tip: Paste the SQL files directly into Supabase SQL editor");
}

runMigrations().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
