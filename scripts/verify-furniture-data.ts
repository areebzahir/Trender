#!/usr/bin/env tsx
/**
 * Furniture Data Verification Script
 * 
 * Verifies the quality and completeness of furniture data in Supabase.
 * Checks for missing images, prices, duplicates, and data quality issues.
 * 
 * Usage:
 *   npm run verify:furniture
 *   npm run verify:furniture -- --source=ikea_ca
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// ─── Configuration ────────────────────────────────────────────────────────────

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── CLI Arguments ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const sourceFilter = args.find(a => a.startsWith('--source='))?.split('=')[1];

// ─── Verification Functions ───────────────────────────────────────────────────

async function getTotalProducts(source?: string) {
  let query = supabase
    .from('products')
    .select('id', { count: 'exact', head: true });
  
  if (source) {
    query = query.eq('source_platform', source);
  }
  
  const { count, error } = await query;
  
  if (error) throw error;
  return count || 0;
}

async function getProductsMissingImages(source?: string) {
  let query = supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .or('image_url.is.null,image_url.eq.');
  
  if (source) {
    query = query.eq('source_platform', source);
  }
  
  const { count, error } = await query;
  
  if (error) throw error;
  return count || 0;
}

async function getProductsMissingPrices(source?: string) {
  let query = supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .is('price', null);
  
  if (source) {
    query = query.eq('source_platform', source);
  }
  
  const { count, error } = await query;
  
  if (error) throw error;
  return count || 0;
}

async function getDuplicateProductUrls(source?: string) {
  let query = supabase
    .from('products')
    .select('product_url');
  
  if (source) {
    query = query.eq('source_platform', source);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  const urlCounts = new Map<string, number>();
  data?.forEach(p => {
    if (p.product_url) {
      urlCounts.set(p.product_url, (urlCounts.get(p.product_url) || 0) + 1);
    }
  });
  
  return Array.from(urlCounts.entries())
    .filter(([_, count]) => count > 1)
    .length;
}

async function getDuplicateImageUrls(source?: string) {
  let query = supabase
    .from('products')
    .select('image_url');
  
  if (source) {
    query = query.eq('source_platform', source);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  const imageCounts = new Map<string, number>();
  data?.forEach(p => {
    if (p.image_url) {
      imageCounts.set(p.image_url, (imageCounts.get(p.image_url) || 0) + 1);
    }
  });
  
  return Array.from(imageCounts.entries())
    .filter(([_, count]) => count > 1)
    .length;
}

async function getSampleProducts(source?: string, limit = 10) {
  let query = supabase
    .from('products')
    .select(`
      id,
      title,
      price,
      currency,
      image_url,
      product_url,
      category,
      stores:store_id (name)
    `)
    .limit(limit);
  
  if (source) {
    query = query.eq('source_platform', source);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

async function getProductsByStore(source?: string) {
  let query = supabase
    .from('products')
    .select(`
      store_id,
      stores:store_id (name)
    `);
  
  if (source) {
    query = query.eq('source_platform', source);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  const storeCounts = new Map<string, number>();
  data?.forEach(p => {
    const storeName = (p.stores as any)?.name || 'Unknown';
    storeCounts.set(storeName, (storeCounts.get(storeName) || 0) + 1);
  });
  
  return Array.from(storeCounts.entries())
    .sort((a, b) => b[1] - a[1]);
}

async function getProductsByCategory(source?: string) {
  let query = supabase
    .from('products')
    .select('category');
  
  if (source) {
    query = query.eq('source_platform', source);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  const categoryCounts = new Map<string, number>();
  data?.forEach(p => {
    categoryCounts.set(p.category, (categoryCounts.get(p.category) || 0) + 1);
  });
  
  return Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1]);
}

// ─── Main Verification ────────────────────────────────────────────────────────

async function verifyFurnitureData() {
  console.log('🔍 Furniture Data Verification\n');
  console.log('='.repeat(60));
  
  if (sourceFilter) {
    console.log(`📊 Filtering by source: ${sourceFilter}\n`);
  }
  
  try {
    // Total products
    const total = await getTotalProducts(sourceFilter);
    console.log(`✅ Total products: ${total}`);
    
    // Missing data
    const missingImages = await getProductsMissingImages(sourceFilter);
    const missingPrices = await getProductsMissingPrices(sourceFilter);
    console.log(`⚠️  Products missing images: ${missingImages} (${((missingImages / total) * 100).toFixed(1)}%)`);
    console.log(`⚠️  Products missing prices: ${missingPrices} (${((missingPrices / total) * 100).toFixed(1)}%)`);
    
    // Duplicates
    const duplicateUrls = await getDuplicateProductUrls(sourceFilter);
    const duplicateImages = await getDuplicateImageUrls(sourceFilter);
    console.log(`🔄 Duplicate product URLs: ${duplicateUrls}`);
    console.log(`🔄 Duplicate image URLs: ${duplicateImages}`);
    
    // By store
    console.log('\n📦 Products by Store:');
    const byStore = await getProductsByStore(sourceFilter);
    byStore.forEach(([store, count]) => {
      console.log(`  ${store}: ${count}`);
    });
    
    // By category
    console.log('\n🏷️  Products by Category:');
    const byCategory = await getProductsByCategory(sourceFilter);
    byCategory.forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
    
    // Sample products
    console.log('\n📋 Sample Products (10 random):');
    console.log('='.repeat(60));
    const samples = await getSampleProducts(sourceFilter, 10);
    samples.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.title}`);
      console.log(`   Store: ${(p.stores as any)?.name || 'Unknown'}`);
      console.log(`   Category: ${p.category}`);
      console.log(`   Price: ${p.price ? `${p.price} ${p.currency}` : 'N/A'}`);
      console.log(`   Image: ${p.image_url ? '✅' : '❌'}`);
      console.log(`   URL: ${p.product_url || 'N/A'}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Verification Complete\n');
    
    // Quality score
    const imageScore = ((total - missingImages) / total) * 100;
    const priceScore = ((total - missingPrices) / total) * 100;
    const overallScore = (imageScore + priceScore) / 2;
    
    console.log(`📊 Data Quality Score: ${overallScore.toFixed(1)}%`);
    console.log(`   Image completeness: ${imageScore.toFixed(1)}%`);
    console.log(`   Price completeness: ${priceScore.toFixed(1)}%`);
    
    if (overallScore >= 90) {
      console.log('\n🎉 Excellent data quality!');
    } else if (overallScore >= 75) {
      console.log('\n👍 Good data quality');
    } else if (overallScore >= 50) {
      console.log('\n⚠️  Fair data quality - consider improving');
    } else {
      console.log('\n❌ Poor data quality - needs attention');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

verifyFurnitureData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
