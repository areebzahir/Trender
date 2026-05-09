#!/usr/bin/env node
/**
 * Diagnose what's actually in the database
 */

const SUPABASE_URL = 'https://hbehelmqrzrnlmnhryfu.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZWhlbG1xcnpybmxtbmhyeWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTM4NzksImV4cCI6MjA5MzQyOTg3OX0.7SdCVqg88_wVhft-6-xfLEU8tXRve5_SvpUZEXzqL3E';

console.log('🔍 DIAGNOSING DATABASE...\n');

async function checkTable(tableName) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=count&limit=0`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    
    if (res.ok) {
      const count = res.headers.get('content-range')?.split('/')[1] || '0';
      return { exists: true, count: parseInt(count), error: null };
    } else {
      const error = await res.text();
      return { exists: false, count: 0, error: error };
    }
  } catch (err) {
    return { exists: false, count: 0, error: err.message };
  }
}

async function main() {
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
  
  console.log('Checking each table...\n');
  
  let existCount = 0;
  let totalRows = 0;
  
  for (const table of tables) {
    const result = await checkTable(table);
    
    if (result.exists) {
      console.log(`✅ ${table} - ${result.count} rows`);
      existCount++;
      totalRows += result.count;
    } else {
      console.log(`❌ ${table} - DOES NOT EXIST`);
      if (result.error) {
        console.log(`   Error: ${result.error.substring(0, 100)}`);
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Tables found: ${existCount}/${tables.length}`);
  console.log(`   Total rows: ${totalRows}\n`);
  
  if (existCount === 0) {
    console.log('❌ NO TABLES EXIST!\n');
    console.log('You MUST run the migration SQL manually:');
    console.log('1. Open: https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/sql/new');
    console.log('2. Copy ALL of: supabase/migrations/20240001_furniture_catalog.sql');
    console.log('3. Paste and click RUN\n');
  } else if (existCount === tables.length && totalRows === 0) {
    console.log('✅ All tables exist but are EMPTY\n');
    console.log('Run seed data:');
    console.log('1. Open: https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/sql/new');
    console.log('2. Copy ALL of: supabase/seed/mock_ontario_furniture.sql');
    console.log('3. Paste and click RUN\n');
  } else if (existCount === tables.length && totalRows > 0) {
    console.log('✅ ALL DONE! Tables exist with data!\n');
    console.log('View them at:');
    console.log('https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/editor/public/stores\n');
  } else {
    console.log('⚠️  Partial setup - some tables missing\n');
  }
}

main().catch(console.error);
