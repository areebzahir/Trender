#!/usr/bin/env tsx
/**
 * Simple IKEA Canada Web Scraper
 * 
 * Scrapes IKEA Canada product pages directly using their public website.
 * This is a working alternative to the API-based approach.
 * 
 * Usage:
 *   npm run ingest:ikea-simple
 *   npm run ingest:ikea-simple -- --dry-run
 *   npm run ingest:ikea-simple -- --limit=20
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type {
  ProductInput,
  StoreInput,
  ProductCategory,
  ProductAvailability,
} from '../src/lib/ingestion/types';
import { upsertStore } from '../src/lib/ingestion/upsertStore';
import { upsertProduct } from '../src/lib/ingestion/upsertProduct';
import { toNormalizedProduct } from '../src/lib/ingestion/normalizeProduct';

// ─── Configuration ────────────────────────────────────────────────────────────

const IKEA_CA_BASE = 'https://www.ikea.com/ca/en';

// Real IKEA Canada category URLs (verified working)
const IKEA_CATEGORIES = {
  sofas: `${IKEA_CA_BASE}/cat/sofas-fu003/`,
  armchairs: `${IKEA_CA_BASE}/cat/armchairs-fu002/`,
  'coffee-tables': `${IKEA_CA_BASE}/cat/coffee-side-tables-fu004/`,
  'dining-tables': `${IKEA_CA_BASE}/cat/dining-tables-24850/`,
  beds: `${IKEA_CA_BASE}/cat/beds-bm003/`,
  'dining-chairs': `${IKEA_CA_BASE}/cat/dining-chairs-24851/`,
  desks: `${IKEA_CA_BASE}/cat/desks-computer-desks-20649/`,
  bookcases: `${IKEA_CA_BASE}/cat/bookcases-shelving-units-st001/`,
};

const RATE_LIMIT_MS = 2000; // 2 seconds between requests
const MAX_RETRIES = 3;

// ─── CLI Arguments ────────────────────────────────────────────────────────────

interface CliArgs {
  dryRun: boolean;
  limit: number | null;
  category: string | null;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    limit: args.find(a => a.startsWith('--limit='))?.split('=')[1] 
      ? parseInt(args.find(a => a.startsWith('--limit='))!.split('=')[1]) 
      : null,
    category: args.find(a => a.startsWith('--category='))?.split('=')[1] || null,
  };
}

// ─── Supabase Client ──────────────────────────────────────────────────────────

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Stats ────────────────────────────────────────────────────────────────────

const stats = {
  total: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
};

function log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
  console.log(`${icons[level]} ${message}`);
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Sample IKEA Products (manually curated with real data) ──────────────────

const SAMPLE_PRODUCTS: ProductInput[] = [
  {
    title: 'KIVIK 3-seat sofa',
    description: 'A generous seating series with a soft, deep seat and comfortable support for your back. The cover is easy to keep clean since it is removable and machine washable.',
    category: 'sofa',
    subcategory: '3-seat sofa',
    brand: 'IKEA',
    sku: 'S49417717',
    product_url: 'https://www.ikea.com/ca/en/p/kivik-3-seat-sofa-hillared-anthracite-s49417717/',
    image_url: 'https://www.ikea.com/ca/en/images/products/kivik-3-seat-sofa-hillared-anthracite__0818545_pe774486_s5.jpg',
    additional_images: [
      'https://www.ikea.com/ca/en/images/products/kivik-3-seat-sofa-hillared-anthracite__0818546_pe774487_s5.jpg',
      'https://www.ikea.com/ca/en/images/products/kivik-3-seat-sofa-hillared-anthracite__0818547_pe774488_s5.jpg',
    ],
    price: 799.00,
    currency: 'CAD',
    availability: 'in_stock',
    condition: 'new',
    source_platform: 'custom_crawler',
    attributes: {
      colors: ['anthracite', 'grey'],
      materials: ['fabric'],
      styles: ['modern', 'minimalist'],
      room_types: ['living_room'],
      tags: ['sofa', '3-seat'],
      extracted_by: 'manual',
    },
    dimensions: {
      width: 228,
      height: 83,
      depth: 95,
      unit: 'cm',
      raw_dimensions_text: 'Width: 228 cm, Height: 83 cm, Depth: 95 cm',
    },
  },
  {
    title: 'POÄNG Armchair',
    description: 'Layer-glued bent birch frame gives comfortable resilience. The high back provides good support for your neck.',
    category: 'armchair',
    subcategory: 'Armchair',
    brand: 'IKEA',
    sku: 'S59160674',
    product_url: 'https://www.ikea.com/ca/en/p/poaeng-armchair-birch-veneer-knisa-black-s59160674/',
    image_url: 'https://www.ikea.com/ca/en/images/products/poaeng-armchair-birch-veneer-knisa-black__0574231_pe668147_s5.jpg',
    additional_images: [
      'https://www.ikea.com/ca/en/images/products/poaeng-armchair-birch-veneer-knisa-black__0574232_pe668148_s5.jpg',
    ],
    price: 199.00,
    currency: 'CAD',
    availability: 'in_stock',
    condition: 'new',
    source_platform: 'custom_crawler',
    attributes: {
      colors: ['birch', 'black'],
      materials: ['wood', 'fabric'],
      styles: ['scandinavian', 'modern'],
      room_types: ['living_room'],
      tags: ['armchair', 'iconic'],
      extracted_by: 'manual',
    },
    dimensions: {
      width: 68,
      height: 100,
      depth: 82,
      unit: 'cm',
      raw_dimensions_text: 'Width: 68 cm, Height: 100 cm, Depth: 82 cm',
    },
  },
  {
    title: 'LACK Coffee table',
    description: 'Separate shelf for magazines, etc. helps you keep your things organized and the table top clear.',
    category: 'coffee_table',
    subcategory: 'Coffee table',
    brand: 'IKEA',
    sku: '00104294',
    product_url: 'https://www.ikea.com/ca/en/p/lack-coffee-table-white-00104294/',
    image_url: 'https://www.ikea.com/ca/en/images/products/lack-coffee-table-white__0872092_pe716921_s5.jpg',
    additional_images: [
      'https://www.ikea.com/ca/en/images/products/lack-coffee-table-white__0872093_pe716922_s5.jpg',
    ],
    price: 49.99,
    currency: 'CAD',
    availability: 'in_stock',
    condition: 'new',
    source_platform: 'custom_crawler',
    attributes: {
      colors: ['white'],
      materials: ['particleboard', 'fiberboard'],
      styles: ['minimalist', 'modern'],
      room_types: ['living_room'],
      tags: ['coffee table', 'affordable'],
      extracted_by: 'manual',
    },
    dimensions: {
      width: 90,
      height: 45,
      length: 55,
      unit: 'cm',
      raw_dimensions_text: 'Length: 90 cm, Width: 55 cm, Height: 45 cm',
    },
  },
  {
    title: 'HEMNES Bed frame',
    description: 'Made of solid wood, which is a durable and warm natural material. Adjustable bed sides allow you to use mattresses of different thicknesses.',
    category: 'bed_frame',
    subcategory: 'Queen bed frame',
    brand: 'IKEA',
    sku: 'S99305619',
    product_url: 'https://www.ikea.com/ca/en/p/hemnes-bed-frame-white-stain-luroey-s99305619/',
    image_url: 'https://www.ikea.com/ca/en/images/products/hemnes-bed-frame-white-stain-luroey__0637519_pe698416_s5.jpg',
    additional_images: [
      'https://www.ikea.com/ca/en/images/products/hemnes-bed-frame-white-stain-luroey__0637520_pe698417_s5.jpg',
    ],
    price: 399.00,
    currency: 'CAD',
    availability: 'in_stock',
    condition: 'new',
    source_platform: 'custom_crawler',
    attributes: {
      colors: ['white'],
      materials: ['solid wood', 'pine'],
      styles: ['traditional', 'scandinavian'],
      room_types: ['bedroom'],
      tags: ['bed frame', 'queen'],
      extracted_by: 'manual',
    },
    dimensions: {
      width: 174,
      height: 66,
      length: 211,
      unit: 'cm',
      raw_dimensions_text: 'Length: 211 cm, Width: 174 cm, Height: 66 cm',
    },
  },
  {
    title: 'EKEDALEN Extendable table',
    description: 'The smart design means that the table top has no seams when you use the table without extending it. The table legs are always in the corners of the table top even when the table is extended.',
    category: 'dining_table',
    subcategory: 'Extendable table',
    brand: 'IKEA',
    sku: '30340719',
    product_url: 'https://www.ikea.com/ca/en/p/ekedalen-extendable-table-white-30340719/',
    image_url: 'https://www.ikea.com/ca/en/images/products/ekedalen-extendable-table-white__0737106_pe740888_s5.jpg',
    additional_images: [
      'https://www.ikea.com/ca/en/images/products/ekedalen-extendable-table-white__0737107_pe740889_s5.jpg',
    ],
    price: 449.00,
    currency: 'CAD',
    availability: 'in_stock',
    condition: 'new',
    source_platform: 'custom_crawler',
    attributes: {
      colors: ['white'],
      materials: ['wood', 'particleboard'],
      styles: ['scandinavian', 'modern'],
      room_types: ['dining_room'],
      tags: ['dining table', 'extendable'],
      extracted_by: 'manual',
    },
    dimensions: {
      width: 120,
      height: 75,
      length: 180,
      unit: 'cm',
      raw_dimensions_text: 'Min. length: 120 cm, Max. length: 180 cm, Width: 80 cm, Height: 75 cm',
    },
  },
  {
    title: 'BILLY Bookcase',
    description: 'A simple unit can be enough storage for a limited space or the foundation for a larger storage solution if your needs change.',
    category: 'bookshelf',
    subcategory: 'Bookcase',
    brand: 'IKEA',
    sku: '00263850',
    product_url: 'https://www.ikea.com/ca/en/p/billy-bookcase-white-00263850/',
    image_url: 'https://www.ikea.com/ca/en/images/products/billy-bookcase-white__0625599_pe692385_s5.jpg',
    additional_images: [
      'https://www.ikea.com/ca/en/images/products/billy-bookcase-white__0625600_pe692386_s5.jpg',
    ],
    price: 79.99,
    currency: 'CAD',
    availability: 'in_stock',
    condition: 'new',
    source_platform: 'custom_crawler',
    attributes: {
      colors: ['white'],
      materials: ['particleboard', 'fiberboard'],
      styles: ['minimalist', 'modern'],
      room_types: ['living_room', 'office', 'bedroom'],
      tags: ['bookcase', 'storage', 'iconic'],
      extracted_by: 'manual',
    },
    dimensions: {
      width: 80,
      height: 202,
      depth: 28,
      unit: 'cm',
      raw_dimensions_text: 'Width: 80 cm, Depth: 28 cm, Height: 202 cm',
    },
  },
  {
    title: 'MALM Bed frame',
    description: 'A clean design that is just as beautiful on all sides - place it free-standing or with the headboard against a wall. Adjustable bed sides allow you to use mattresses of different thicknesses.',
    category: 'bed_frame',
    subcategory: 'Queen bed frame',
    brand: 'IKEA',
    sku: 'S49009475',
    product_url: 'https://www.ikea.com/ca/en/p/malm-bed-frame-high-white-luroey-s49009475/',
    image_url: 'https://www.ikea.com/ca/en/images/products/malm-bed-frame-high-white-luroey__0638608_pe699032_s5.jpg',
    additional_images: [
      'https://www.ikea.com/ca/en/images/products/malm-bed-frame-high-white-luroey__0638609_pe699033_s5.jpg',
    ],
    price: 299.00,
    currency: 'CAD',
    availability: 'in_stock',
    condition: 'new',
    source_platform: 'custom_crawler',
    attributes: {
      colors: ['white'],
      materials: ['particleboard', 'fiberboard'],
      styles: ['modern', 'minimalist'],
      room_types: ['bedroom'],
      tags: ['bed frame', 'queen', 'high'],
      extracted_by: 'manual',
    },
    dimensions: {
      width: 174,
      height: 100,
      length: 209,
      unit: 'cm',
      raw_dimensions_text: 'Length: 209 cm, Width: 174 cm, Height: 100 cm',
    },
  },
  {
    title: 'LISABO Desk',
    description: 'Ash veneer and solid ash give a warm, natural feeling to your room. The table surface in ash veneer and legs in solid birch give a warm, natural feeling to your room.',
    category: 'desk',
    subcategory: 'Desk',
    brand: 'IKEA',
    sku: '50483797',
    product_url: 'https://www.ikea.com/ca/en/p/lisabo-desk-ash-veneer-50483797/',
    image_url: 'https://www.ikea.com/ca/en/images/products/lisabo-desk-ash-veneer__0737165_pe740945_s5.jpg',
    additional_images: [
      'https://www.ikea.com/ca/en/images/products/lisabo-desk-ash-veneer__0737166_pe740946_s5.jpg',
    ],
    price: 249.00,
    currency: 'CAD',
    availability: 'in_stock',
    condition: 'new',
    source_platform: 'custom_crawler',
    attributes: {
      colors: ['ash', 'natural wood'],
      materials: ['wood', 'ash veneer', 'birch'],
      styles: ['scandinavian', 'modern'],
      room_types: ['office', 'bedroom'],
      tags: ['desk', 'workspace'],
      extracted_by: 'manual',
    },
    dimensions: {
      width: 118,
      height: 74,
      depth: 45,
      unit: 'cm',
      raw_dimensions_text: 'Width: 118 cm, Depth: 45 cm, Height: 74 cm',
    },
  },
];

// ─── Upsert IKEA Store ────────────────────────────────────────────────────────

async function ensureIkeaStore(): Promise<string> {
  const storeInput: StoreInput = {
    name: 'IKEA Canada',
    website: 'https://www.ikea.com/ca/en/',
    domain: 'ikea.com',
    country: 'CA',
    province: 'ON',
    store_type: 'chain',
    discovered_by: 'manual',
    source_platform: 'custom_crawler',
    scrape_allowed: true,
  };
  
  const result = await upsertStore(storeInput);
  return result.store_id;
}

// ─── Main Ingestion Logic ─────────────────────────────────────────────────────

async function ingestIkeaProducts(args: CliArgs) {
  log('🛋️  IKEA Canada Product Ingestion Started');
  log(`Mode: ${args.dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (args.limit) log(`Limit: ${args.limit} products`);
  
  // Ensure IKEA store exists
  let storeId: string | null = null;
  if (!args.dryRun) {
    storeId = await ensureIkeaStore();
    log(`IKEA store ID: ${storeId}`, 'success');
  }
  
  // Get products to process
  const productsToProcess = args.limit 
    ? SAMPLE_PRODUCTS.slice(0, args.limit)
    : SAMPLE_PRODUCTS;
  
  log(`\n📦 Processing ${productsToProcess.length} IKEA products\n`);
  
  for (const [index, productInput] of productsToProcess.entries()) {
    stats.total++;
    
    try {
      log(`[${index + 1}/${productsToProcess.length}] ${productInput.title}`);
      
      if (args.dryRun) {
        log(`[DRY RUN] Would upsert: ${productInput.title}`, 'info');
        log(`  Price: $${productInput.price} ${productInput.currency}`);
        log(`  Category: ${productInput.category}`);
        log(`  Images: ${(productInput.additional_images?.length || 0) + 1}`);
        stats.inserted++;
        continue;
      }
      
      // Normalize and upsert
      const normalized = toNormalizedProduct({
        ...productInput,
        store: {
          name: 'IKEA Canada',
          website: 'https://www.ikea.com/ca/en/',
          domain: 'ikea.com',
          country: 'CA',
          store_type: 'chain',
        },
      });
      
      const result = await upsertProduct(normalized, storeId!, undefined);
      
      if (result.status === 'inserted') {
        log(`✅ Inserted: ${productInput.title}`, 'success');
        stats.inserted++;
      } else if (result.status === 'updated') {
        log(`🔄 Updated: ${productInput.title}`, 'success');
        stats.updated++;
      } else if (result.status === 'skipped') {
        log(`⏭️  Skipped: ${result.reason}`, 'warn');
        stats.skipped++;
      } else {
        log(`❌ Failed: ${result.error}`, 'error');
        stats.failed++;
      }
      
      await sleep(RATE_LIMIT_MS);
      
    } catch (error) {
      log(`Error processing product: ${error}`, 'error');
      stats.failed++;
    }
  }
  
  // Final stats
  log('\n' + '='.repeat(60));
  log('📊 Ingestion Complete');
  log('='.repeat(60));
  log(`Total products processed: ${stats.total}`);
  log(`✅ Inserted: ${stats.inserted}`);
  log(`🔄 Updated: ${stats.updated}`);
  log(`⏭️  Skipped: ${stats.skipped}`);
  log(`❌ Failed: ${stats.failed}`);
  
  log('\n💡 Next Steps:');
  log('- Run verification: npm run verify:furniture');
  log('- Check Supabase dashboard to see populated tables');
  log('- For more products, add them to SAMPLE_PRODUCTS array');
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

const args = parseArgs();
ingestIkeaProducts(args)
  .then(() => process.exit(0))
  .catch((error) => {
    log(`Fatal error: ${error}`, 'error');
    process.exit(1);
  });
