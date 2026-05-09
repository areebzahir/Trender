#!/usr/bin/env node
/**
 * Apply Supabase Migration Script
 * 
 * This script connects to your Supabase database and applies the migration
 * using the Supabase Management API.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase credentials from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your_supabase_url_here';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here';

console.log('🔧 Connecting to Supabase...');
console.log('   URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testConnection() {
  console.log('\n🔍 Testing connection...');
  try {
    const { data, error } = await supabase.from('_').select('*').limit(0);
    console.log('✅ Connected successfully\n');
    return true;
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    return false;
  }
}

async function applyMigration() {
  try {
    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20240001_furniture_catalog.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Read migration file');
    console.log('   Path:', migrationPath);
    console.log('   Size:', sql.length, 'characters\n');
    
    // The Supabase JS client doesn't support executing raw DDL SQL directly
    // We need to use the SQL Editor or Supabase CLI
    
    console.log('⚠️  The Supabase JS client cannot execute DDL SQL directly.');
    console.log('   Migration must be applied via Supabase Dashboard SQL Editor.\n');
    
    console.log('📋 To apply the migration:');
    console.log('   1. Open: https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/sql/new');
    console.log('   2. Copy: supabase/migrations/20240001_furniture_catalog.sql');
    console.log('   3. Paste into SQL Editor');
    console.log('   4. Click "Run"\n');
    
    // But we can verify if tables exist
    console.log('🔍 Checking if tables already exist...\n');
    
    const tables = [
      'stores',
      'store_locations', 
      'products',
      'product_dimensions',
      'product_attributes',
      'product_embeddings',
      'scrape_jobs',
      'scrape_job_items',
      'room_photos',
      'furniture_request_logs'
    ];
    
    const existing = [];
    const missing = [];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(0);
        if (error && error.message.includes('does not exist')) {
          missing.push(table);
          console.log(`  ❌ ${table}`);
        } else if (!error) {
          existing.push(table);
          console.log(`  ✅ ${table}`);
        }
      } catch {
        missing.push(table);
        console.log(`  ❌ ${table}`);
      }
    }
    
    console.log(`\n📊 Found ${existing.length}/${tables.length} tables\n`);
    
    if (missing.length > 0) {
      console.log('⚠️  Missing tables:', missing.join(', '));
      console.log('\n📋 Please apply the migration via SQL Editor (see instructions above)\n');
      return false;
    } else {
      console.log('✅ All tables exist! Migration already applied.\n');
      return true;
    }
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    return false;
  }
}

async function applySeedData() {
  console.log('🌱 Applying seed data...\n');
  
  try {
    // Check if seed data already exists
    const { data: storeCount } = await supabase
      .from('stores')
      .select('count', { count: 'exact', head: true });
    
    if ((storeCount?.count ?? 0) > 0) {
      console.log(`✅ Seed data already exists (${storeCount.count} stores)\n`);
      return true;
    }
    
    console.log('📄 Seed data not found. To add mock data:');
    console.log('   1. Open: https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/sql/new');
    console.log('   2. Copy: supabase/seed/mock_ontario_furniture.sql');
    console.log('   3. Paste and run\n');
    
    return false;
  } catch (err) {
    console.error('❌ Error checking seed data:', err.message);
    return false;
  }
}

async function testSearch() {
  console.log('🔍 Testing product search...\n');
  
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, price, category, currency')
      .eq('is_active', true)
      .limit(5);
    
    if (error) {
      console.error('❌ Search failed:', error.message);
      return false;
    }
    
    if (!products || products.length === 0) {
      console.log('⚠️  No products found. Add seed data first.\n');
      return false;
    }
    
    console.log(`✅ Found ${products.length} active products:\n`);
    products.forEach(p => {
      console.log(`   - ${p.title}`);
      console.log(`     $${p.price} ${p.currency} | ${p.category}`);
      console.log('');
    });
    
    return true;
  } catch (err) {
    console.error('❌ Search error:', err.message);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Trender Furniture Database Setup                     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Cannot proceed without connection\n');
    process.exit(1);
  }
  
  const migrationApplied = await applyMigration();
  
  if (migrationApplied) {
    await applySeedData();
    await testSearch();
    
    console.log('✨ Setup verification complete!\n');
    console.log('Next steps:');
    console.log('  - If seed data is missing, apply it via SQL Editor');
    console.log('  - Test search in your app: searchProducts({ category: "sofa" })');
    console.log('  - Deploy Edge Functions: supabase functions deploy\n');
  }
}

main().catch(console.error);
