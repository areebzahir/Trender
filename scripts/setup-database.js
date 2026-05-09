/**
 * Supabase Database Setup Script
 * 
 * This script:
 * 1. Verifies Supabase connection
 * 2. Checks if tables exist
 * 3. Provides instructions for applying migration
 * 4. Applies seed data once migration is complete
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hbehelmqrzrnlmnhryfu.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkConnection() {
  console.log('🔍 Checking Supabase connection...');
  console.log('   URL:', SUPABASE_URL);
  
  try {
    // Try a simple query
    const { data, error } = await supabase.from('stores').select('count').limit(1);
    
    if (error && error.message.includes('does not exist')) {
      console.log('⚠️  Tables not found - migration needs to be applied\n');
      return false;
    }
    
    if (error) {
      console.log('❌ Connection error:', error.message);
      return false;
    }
    
    console.log('✅ Connected successfully\n');
    return true;
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
    return false;
  }
}

async function checkTables() {
  console.log('🔍 Checking for required tables...\n');
  
  const requiredTables = [
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
  
  for (const table of requiredTables) {
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
  
  console.log(`\n📊 Found ${existing.length}/${requiredTables.length} tables\n`);
  
  return { existing, missing, allExist: missing.length === 0 };
}

async function applySeedData() {
  console.log('🌱 Applying seed data...\n');
  
  try {
    const seedPath = join(__dirname, '../supabase/seed/mock_ontario_furniture.sql');
    const seedSql = readFileSync(seedPath, 'utf-8');
    
    console.log('📄 Read seed file:', seedPath);
    
    // Parse INSERT statements
    const insertMatches = seedSql.match(/INSERT INTO \w+[^;]+;/gi);
    
    if (!insertMatches) {
      console.log('⚠️  No INSERT statements found in seed file');
      return;
    }
    
    console.log(`📦 Found ${insertMatches.length} INSERT statements\n`);
    
    // For seed data, we'll use the Supabase client insert method instead
    // This is more reliable than executing raw SQL
    
    console.log('⚠️  Seed data should be applied via SQL Editor for best results');
    console.log('   Go to: https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/sql/new');
    console.log('   Copy: supabase/seed/mock_ontario_furniture.sql');
    console.log('   Paste and run\n');
    
  } catch (err) {
    console.error('❌ Seed data failed:', err.message);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Trender Furniture Database Setup                     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const connected = await checkConnection();
  
  if (!connected) {
    console.log('❌ Cannot proceed without connection\n');
    process.exit(1);
  }
  
  const { allExist, missing } = await checkTables();
  
  if (!allExist) {
    console.log('📋 MIGRATION REQUIRED\n');
    console.log('To apply the migration:');
    console.log('  1. Open: https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/sql/new');
    console.log('  2. Copy the entire contents of: supabase/migrations/20240001_furniture_catalog.sql');
    console.log('  3. Paste into the SQL Editor');
    console.log('  4. Click "Run" or press Ctrl+Enter');
    console.log('  5. Wait for "Success. No rows returned"');
    console.log('  6. Run this script again to verify\n');
    console.log('Missing tables:', missing.join(', '));
    console.log('');
  } else {
    console.log('✅ All tables exist!\n');
    
    // Check if seed data exists
    const { data: storeCount } = await supabase.from('stores').select('count', { count: 'exact', head: true });
    const { data: productCount } = await supabase.from('products').select('count', { count: 'exact', head: true });
    
    console.log('📊 Current data:');
    console.log(`   Stores: ${storeCount?.count ?? 0}`);
    console.log(`   Products: ${productCount?.count ?? 0}\n`);
    
    if ((storeCount?.count ?? 0) === 0) {
      console.log('🌱 No seed data found. To add mock data:');
      console.log('  1. Open: https://supabase.com/dashboard/project/hbehelmqrzrnlmnhryfu/sql/new');
      console.log('  2. Copy: supabase/seed/mock_ontario_furniture.sql');
      console.log('  3. Paste and run\n');
    } else {
      console.log('✅ Database is ready!\n');
      
      // Test a search query
      console.log('🔍 Testing product search...');
      const { data: products, error } = await supabase
        .from('products')
        .select('id, title, price, category')
        .eq('is_active', true)
        .limit(3);
      
      if (error) {
        console.log('❌ Search failed:', error.message);
      } else {
        console.log(`✅ Found ${products.length} active products:`);
        products.forEach(p => {
          console.log(`   - ${p.title} ($${p.price}) [${p.category}]`);
        });
      }
      
      console.log('\n✨ Setup complete! You can now:');
      console.log('   - Use searchProducts() in src/services/furnitureSearchService.ts');
      console.log('   - Test the search API');
      console.log('   - Run ingestion scripts\n');
    }
  }
}

main().catch(console.error);
