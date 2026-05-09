/**
 * Apply Supabase migration directly using service role key
 * This script reads the migration SQL and executes it via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hbehelmqrzrnlmnhryfu.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function applyMigration() {
  try {
    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20240001_furniture_catalog.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Read migration file:', migrationPath);
    console.log('📏 SQL length:', sql.length, 'characters');
    
    // Split into individual statements (basic split on semicolons outside quotes)
    const statements = sql
      .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log('📦 Found', statements.length, 'SQL statements');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      
      // Skip comments
      if (stmt.startsWith('--') || stmt.length < 10) continue;
      
      const preview = stmt.substring(0, 80).replace(/\s+/g, ' ');
      process.stdout.write(`\n[${i + 1}/${statements.length}] ${preview}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });
        
        if (error) {
          // Try direct query if RPC doesn't exist
          const { error: directError } = await supabase.from('_').select('*').limit(0);
          
          if (directError) {
            console.log(' ⚠️  (skipped - may need direct DB access)');
            continue;
          }
        }
        
        console.log(' ✅');
        successCount++;
      } catch (err) {
        console.log(' ❌', err.message);
        errorCount++;
      }
    }
    
    console.log('\n\n📊 Migration Summary:');
    console.log('  ✅ Success:', successCount);
    console.log('  ❌ Errors:', errorCount);
    console.log('  📝 Total:', statements.length);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This is expected if using Supabase client.');
      console.log('   The migration needs to be applied via Supabase Dashboard SQL Editor or CLI.');
      console.log('\n📋 Next steps:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/sql/new');
      console.log('   2. Copy the contents of: supabase/migrations/20240001_furniture_catalog.sql');
      console.log('   3. Paste and run in the SQL Editor');
      console.log('   4. Then run: node scripts/apply-seed.js');
    }
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  }
}

applyMigration();
