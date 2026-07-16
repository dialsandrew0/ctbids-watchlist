#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    try {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`📝 Running ${file}...`);

      const { error } = await supabase.rpc('exec', { sql_query: sql }).catch(async () => {
        // Fallback: execute directly via admin API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ query: sql }),
        });
        return { error: !response.ok ? new Error('Migration failed') : null };
      });

      if (error) {
        console.log(`   ⚠️  Manual execution needed. Copy the SQL from migrations/${file} to your Supabase SQL editor.`);
      } else {
        console.log(`   ✅ Migration completed`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      console.log(`   📋 Please execute migrations/${file} manually in Supabase SQL editor`);
    }
  }

  console.log('\n✅ Migration process complete!');
  console.log('💡 Tip: If some migrations failed, paste the SQL files directly into Supabase SQL editor');
}

runMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
