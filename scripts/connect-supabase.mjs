#!/usr/bin/env node
/**
 * Connect to Supabase and verify setup
 * Uses the anon key to check public access
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hbehelmqrzrnlmnhryfu.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZWhlbG1xcnpybmxtbmhyeWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTM4NzksImV4cCI6MjA5MzQyOTg3OX0.7SdCVqg88_wVhft-6-xfLEU8tXRve5_SvpUZEXzqL3E';

console.log('🔧 Connecting to Supabase with anon key...');
console.log('   URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkTables() {
  console.log('\n🔍 Checking tables...\n');
  
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
  
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          results[table] = { exists: false, count: 0, error: 'Table does not exist' };
          console.log(`  ❌ ${table} - does not exist`);
        } else {
          results[table] = { exists: false, count: 0, error: error.message };
          console.log(`  ⚠️  ${table} - error: ${error.message}`);
        }
      } else {
        results[table] = { exists: true, count: data?.count ?? 0 };
        console.log(`  ✅ ${table} - ${data?.count ?? 0} rows`);
      }
    } catch (err) {
      results[table] = { exists: false, count: 0, error: err.message };
      console.log(`  ❌ ${table} - ${err.message}`);
    }
  }
  
  return results;
}

async function testProductSearch() {
  console.log('\n🔍 Testing product search...\n');
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, price, category')
      .eq('is_active', true)
      .limit(3);
    
    if (error) {
      console.log('❌ Search failed:', error.message);
      console.log('   Code:', error.code);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️  No products found (table may be empty)');
      return true;  // Table exists but empty
    }
    
    console.log(`✅ Found ${data.length} products:\n`);
    data.forEach(p => {
      console.log(`   - ${p.title} ($${p.price}) [${p.category}]`);
    });
    
    return true;
  } catch (err) {
    console.log('❌ Error:', err.message);
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Trender Supabase Connection Test                     ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  const results = await checkTables();
  
  const existing = Object.entries(results).filter(([_, v]) => v.exists);
  const missing = Object.entries(results).filter(([_, v]) => !v.exists);
  
  console.log(`\n📊 Summary: ${existing.length}/10 tables exist\n`);
  
  if (missing.length > 0) {
    console.log('⚠️  MIGRATION REQUIRED\n');
    console.log('Missing tables:', missing.map(([k]) => k).join(', '));
    console.log('\n📋 To apply migration:');
    console.log('   1. Open: https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/sql/new');
    console.log('   2. Copy entire contents of: supabase/migrations/20240001_furniture_catalog.sql');
    console.log('   3. Paste into SQL Editor');
    console.log('   4. Click "Run" or press Ctrl+Enter');
    console.log('   5. Wait for "Success. No rows returned"');
    console.log('   6. Run this script again to verify\n');
  } else {
    console.log('✅ All tables exist!\n');
    
    const totalRows = existing.reduce((sum, [_, v]) => sum + v.count, 0);
    
    if (totalRows === 0) {
      console.log('⚠️  Tables are empty. To add seed data:');
      console.log('   1. Open: https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/sql/new');
      console.log('   2. Copy: supabase/seed/mock_ontario_furniture.sql');
      console.log('   3. Paste and run\n');
    } else {
      await testProductSearch();
      
      console.log('\n✨ Database is ready!');
      console.log('\nYou can now:');
      console.log('  - Use searchProducts() in your app');
      console.log('  - Test: import { searchProducts } from "@/services/furnitureSearchService"');
      console.log('  - Deploy Edge Functions: supabase functions deploy\n');
    }
  }
}

main().catch(console.error);
