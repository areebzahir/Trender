#!/usr/bin/env tsx
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking all Supabase tables...\n');
  
  // Check stores
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('id, name, domain, city, province');
  
  console.log('📍 STORES TABLE:');
  console.log(`   Total: ${stores?.length || 0}`);
  if (stores && stores.length > 0) {
    stores.forEach(s => console.log(`   - ${s.name} (${s.domain})`));
  }
  console.log('');
  
  // Check products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, category, price, currency');
  
  console.log('🛋️  PRODUCTS TABLE:');
  console.log(`   Total: ${products?.length || 0}`);
  if (products && products.length > 0) {
    console.log(`   Categories: ${[...new Set(products.map(p => p.category))].join(', ')}`);
    console.log(`   Price range: $${Math.min(...products.map(p => p.price || 0))} - $${Math.max(...products.map(p => p.price || 0))} ${products[0]?.currency}`);
  }
  console.log('');
  
  // Check product_dimensions
  const { data: dimensions } = await supabase
    .from('product_dimensions')
    .select('id');
  
  console.log('📏 PRODUCT_DIMENSIONS TABLE:');
  console.log(`   Total: ${dimensions?.length || 0}`);
  console.log('');
  
  // Check product_attributes
  const { data: attributes } = await supabase
    .from('product_attributes')
    .select('id, colors, materials, styles');
  
  console.log('🎨 PRODUCT_ATTRIBUTES TABLE:');
  console.log(`   Total: ${attributes?.length || 0}`);
  if (attributes && attributes.length > 0) {
    const allColors = attributes.flatMap(a => a.colors || []);
    const uniqueColors = [...new Set(allColors)];
    console.log(`   Unique colors: ${uniqueColors.slice(0, 10).join(', ')}${uniqueColors.length > 10 ? '...' : ''}`);
  }
  console.log('');
  
  // Check scrape_jobs
  const { data: jobs } = await supabase
    .from('scrape_jobs')
    .select('id, source_type, status, total_inserted, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('📊 SCRAPE_JOBS TABLE:');
  console.log(`   Total: ${jobs?.length || 0}`);
  if (jobs && jobs.length > 0) {
    jobs.forEach(j => {
      console.log(`   - ${j.source_type}: ${j.status} (${j.total_inserted} inserted)`);
    });
  }
  console.log('');
  
  // Check room_photos
  const { data: photos } = await supabase
    .from('room_photos')
    .select('id');
  
  console.log('📸 ROOM_PHOTOS TABLE:');
  console.log(`   Total: ${photos?.length || 0}`);
  console.log('');
  
  // Check furniture_request_logs
  const { data: requests } = await supabase
    .from('furniture_request_logs')
    .select('id');
  
  console.log('📝 FURNITURE_REQUEST_LOGS TABLE:');
  console.log(`   Total: ${requests?.length || 0}`);
  console.log('');
  
  console.log('✅ All tables checked!');
  console.log('\n💡 Summary:');
  console.log(`   - ${stores?.length || 0} stores`);
  console.log(`   - ${products?.length || 0} products`);
  console.log(`   - ${dimensions?.length || 0} product dimensions`);
  console.log(`   - ${attributes?.length || 0} product attributes`);
  console.log(`   - ${jobs?.length || 0} scrape jobs`);
  console.log(`   - ${photos?.length || 0} room photos`);
  console.log(`   - ${requests?.length || 0} furniture requests`);
}

checkTables().catch(console.error);
