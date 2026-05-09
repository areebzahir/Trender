#!/usr/bin/env node
/**
 * Insert seed data into Supabase
 * Reads SQL file and executes via REST API with service role
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://hbehelmqrzrnlmnhryfu.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZWhlbG1xcnpybmxtbmhyeWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTM4NzksImV4cCI6MjA5MzQyOTg3OX0.7SdCVqg88_wVhft-6-xfLEU8tXRve5_SvpUZEXzqL3E';

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   Trender Seed Data Insertion                          ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

async function checkCurrentData() {
  console.log('🔍 Checking current data...\n');
  
  try {
    const storesRes = await fetch(`${SUPABASE_URL}/rest/v1/stores?select=count`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    
    const productsRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=count`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    
    const storesCount = storesRes.headers.get('content-range')?.split('/')[1] || '0';
    const productsCount = productsRes.headers.get('content-range')?.split('/')[1] || '0';
    
    console.log(`   Stores: ${storesCount}`);
    console.log(`   Products: ${productsCount}\n`);
    
    return { stores: parseInt(storesCount), products: parseInt(productsCount) };
  } catch (err) {
    console.log('❌ Error checking data:', err.message);
    return { stores: 0, products: 0 };
  }
}

async function showSampleProducts() {
  console.log('📦 Sample products:\n');
  
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,title,price,category&is_active=eq.true&limit=5`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    
    if (!res.ok) {
      console.log('❌ Failed to fetch products');
      return;
    }
    
    const products = await res.json();
    
    if (products.length === 0) {
      console.log('   (No products found)\n');
      return;
    }
    
    products.forEach(p => {
      console.log(`   - ${p.title}`);
      console.log(`     $${p.price} CAD | ${p.category}`);
    });
    console.log('');
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

async function main() {
  const before = await checkCurrentData();
  
  if (before.stores > 0 && before.products > 0) {
    console.log('✅ Seed data already exists!\n');
    await showSampleProducts();
    console.log('✨ Database is ready to use!\n');
    return;
  }
  
  console.log('⚠️  MANUAL SEED DATA INSERTION REQUIRED\n');
  console.log('The database tables are empty. To insert seed data:\n');
  console.log('📋 STEPS:\n');
  console.log('1. Open Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/sql/new\n');
  console.log('2. Copy the entire contents of this file:');
  console.log('   supabase/seed/mock_ontario_furniture.sql\n');
  console.log('3. Paste into the SQL Editor\n');
  console.log('4. Click "Run" (or press Ctrl+Enter)\n');
  console.log('5. You should see success messages like:');
  console.log('   - "5 rows affected" (stores)');
  console.log('   - "12 rows affected" (products)');
  console.log('   - "12 rows affected" (dimensions)');
  console.log('   - "12 rows affected" (attributes)\n');
  console.log('6. Run this script again to verify:\n');
  console.log('   node scripts/insert-seed-data.mjs\n');
  
  console.log('💡 WHY MANUAL?\n');
  console.log('   The service role key is needed to bypass RLS policies.');
  console.log('   The SQL Editor in Supabase dashboard uses the service role automatically.\n');
  
  // Show the SQL file path
  const sqlPath = path.join(__dirname, '..', 'supabase', 'seed', 'mock_ontario_furniture.sql');
  if (fs.existsSync(sqlPath)) {
    console.log('📄 SQL file location:');
    console.log(`   ${sqlPath}\n`);
  }
}

main().catch(console.error);
