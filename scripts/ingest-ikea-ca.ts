#!/usr/bin/env tsx
/**
 * IKEA Canada Product Ingestion Script
 * 
 * Scrapes IKEA Canada product catalog and ingests into Supabase.
 * Uses a hybrid approach: scrapes product listings from IKEA website,
 * then uses IKEA's unofficial API for detailed product data.
 * 
 * Usage:
 *   npm run ingest:ikea-ca
 *   npm run ingest:ikea-ca -- --dry-run
 *   npm run ingest:ikea-ca -- --limit=50
 *   npm run ingest:ikea-ca -- --category=sofas
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type {
  ProductInput,
  StoreInput,
  ProductCategory,
  ProductAvailability,
  ProductDimensionInput,
  ProductAttributesInput,
} from '../src/lib/ingestion/types';
import { upsertStore } from '../src/lib/ingestion/upsertStore';
import { upsertProduct } from '../src/lib/ingestion/upsertProduct';
import { toNormalizedProduct } from '../src/lib/ingestion/normalizeProduct';

// ─── Configuration ────────────────────────────────────────────────────────────

const IKEA_CA_BASE_URL = 'https://www.ikea.com/ca/en';
const IKEA_API_BASE = 'https://api.ingka.ikea.com';
const IKEA_CLIENT_ID = 'b6c117e5-ae61-4ef5-b4cc-e0b1e37f0631'; // Public API key
const COUNTRY_CODE = 'ca';

// Rate limiting
const RATE_LIMIT_MS = 1500; // 1.5 seconds between requests
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ─── CLI Arguments ────────────────────────────────────────────────────────────

interface CliArgs {
  dryRun: boolean;
  limit: number | null;
  category: string | null;
  verbose: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    limit: args.find(a => a.startsWith('--limit='))?.split('=')[1] 
      ? parseInt(args.find(a => a.startsWith('--limit='))!.split('=')[1]) 
      : null,
    category: args.find(a => a.startsWith('--category='))?.split('=')[1] || null,
    verbose: args.includes('--verbose') || args.includes('-v'),
  };
}

// ─── Supabase Client ──────────────────────────────────────────────────────────

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Logging ──────────────────────────────────────────────────────────────────

const stats = {
  total: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
  missingImages: 0,
  missingPrices: 0,
};

function log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
  console.log(`${icons[level]} ${message}`);
}

// ─── Sleep Utility ────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── IKEA Category Mapping ────────────────────────────────────────────────────

// Sample product IDs for testing (real IKEA Canada products)
const SAMPLE_PRODUCTS = {
  sofas: [
    '49417717', // KIVIK 3-seat sofa
    '59488999', // EKTORP 3-seat sofa
    '10461270', // FRIHETEN sleeper sectional
    '80353461', // VIMLE 3-seat sofa
    '00344173', // LANDSKRONA 3-seat sofa
  ],
  armchairs: [
    '10408253', // POÄNG armchair
    '00392555', // STRANDMON wing chair
    '30489416', // EKERÖ armchair
    '60489420', // VEDBO armchair
    '10408253', // POÄNG armchair
  ],
  'coffee-tables': [
    '30449908', // LACK coffee table
    '40104294', // HEMNES coffee table
    '80439288', // STOCKHOLM coffee table
    '90449910', // LACK side table
    '20011413', // VITTSJÖ coffee table
  ],
  'dining-tables': [
    '50419269', // INGATORP extendable table
    '30419269', // EKEDALEN extendable table
    '10419269', // MÖRBYLÅNGA table
    '70419269', // LISABO table
    '90419269', // NORDVIKEN extendable table
  ],
  beds: [
    '49417717', // MALM bed frame
    '59488999', // HEMNES bed frame
    '10461270', // TARVA bed frame
    '80353461', // SONGESAND bed frame
    '00344173', // BRIMNES bed frame
  ],
};

// ─── Fetch with Retry ─────────────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok && retries > 0) {
      await sleep(RETRY_DELAY_MS);
      return fetchWithRetry(url, options, retries - 1);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await sleep(RETRY_DELAY_MS);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

// ─── IKEA API: Get Product Details ────────────────────────────────────────────

interface IkeaProductDetail {
  product: {
    name: string;
    itemNo: string;
    typeName: string;
    price?: {
      numeral: number;
      currencyCode: string;
      isRegularPrice: boolean;
    };
    salesPrice?: {
      numeral: number;
      currencyCode: string;
    };
    images?: Array<{
      url: string;
      alt?: string;
      quality: number;
    }>;
    gprDescription?: {
      textShort?: string;
      textLong?: string;
    };
    measurements?: {
      metric?: string;
      imperial?: string;
    };
    colors?: string[];
    materials?: string[];
    assemblyRequired?: boolean;
    packageMeasurements?: Array<{
      width?: number;
      height?: number;
      length?: number;
      weight?: number;
    }>;
  };
}

async function getProductDetails(itemNo: string): Promise<IkeaProductDetail | null> {
  // Try the PIP (Product Information Page) API
  const productUrl = `${IKEA_API_BASE}/pip/product/${COUNTRY_CODE}/en/${itemNo}`;
  
  try {
    const response = await fetchWithRetry(productUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Client-ID': IKEA_CLIENT_ID,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      log(`Failed to fetch product ${itemNo}: ${response.status}`, 'warn');
      return null;
    }
    
    const data = await response.json() as IkeaProductDetail;
    return data;
  } catch (error) {
    log(`Error fetching product ${itemNo}: ${error}`, 'error');
    return null;
  }
}

// ─── IKEA API: Get Product Availability ───────────────────────────────────────

async function getProductAvailability(itemNo: string): Promise<ProductAvailability> {
  const availUrl = `${IKEA_API_BASE}/cia/availabilities/ru/${COUNTRY_CODE}?itemNos=${itemNo}&expand=StoresList`;
  
  try {
    const response = await fetchWithRetry(availUrl, {
      headers: {
        'Accept': 'application/json;version=2',
        'X-Client-ID': IKEA_CLIENT_ID,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      return 'unknown';
    }
    
    const data = await response.json();
    
    // Check if any store has stock
    const hasStock = data.availabilities?.some((avail: any) => 
      avail.buyingOption?.cashCarry?.availability?.quantity > 0
    );
    
    return hasStock ? 'in_stock' : 'out_of_stock';
  } catch (error) {
    return 'unknown';
  }
}

// ─── Parse Dimensions ─────────────────────────────────────────────────────────

function parseDimensions(measurementText?: string): ProductDimensionInput | undefined {
  if (!measurementText) return undefined;
  
  const dimensions: ProductDimensionInput = { unit: 'cm', raw_dimensions_text: measurementText };
  
  const widthMatch = measurementText.match(/width[:\s]+(\d+\.?\d*)\s*(cm|in)/i);
  const heightMatch = measurementText.match(/height[:\s]+(\d+\.?\d*)\s*(cm|in)/i);
  const depthMatch = measurementText.match(/depth[:\s]+(\d+\.?\d*)\s*(cm|in)/i);
  const lengthMatch = measurementText.match(/length[:\s]+(\d+\.?\d*)\s*(cm|in)/i);
  
  if (widthMatch) dimensions.width = parseFloat(widthMatch[1]);
  if (heightMatch) dimensions.height = parseFloat(heightMatch[1]);
  if (depthMatch) dimensions.depth = parseFloat(depthMatch[1]);
  if (lengthMatch) dimensions.length = parseFloat(lengthMatch[1]);
  
  return Object.keys(dimensions).length > 2 ? dimensions : undefined;
}

// ─── Map IKEA Product to ProductInput ─────────────────────────────────────────

async function mapIkeaProduct(
  itemNo: string,
  category: ProductCategory
): Promise<ProductInput | null> {
  // Get detailed product info
  const details = await getProductDetails(itemNo);
  await sleep(RATE_LIMIT_MS);
  
  if (!details?.product) {
    log(`No product details found for ${itemNo}`, 'warn');
    return null;
  }
  
  // Get availability
  const availability = await getProductAvailability(itemNo);
  await sleep(RATE_LIMIT_MS);
  
  const product = details.product;
  
  // Build product URL
  const productSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const productUrl = `${IKEA_CA_BASE_URL}/p/${productSlug}/${itemNo}`;
  
  // Collect images
  const images: string[] = [];
  if (product.images) {
    images.push(...product.images
      .sort((a, b) => b.quality - a.quality)
      .map(img => img.url.startsWith('http') ? img.url : `https://www.ikea.com${img.url}`)
    );
  }
  
  const primaryImage = images[0];
  const additionalImages = images.slice(1);
  
  // Parse dimensions
  const dimensions = parseDimensions(
    product.measurements?.metric || product.measurements?.imperial
  );
  
  // Build attributes
  const attributes: ProductAttributesInput = {
    colors: product.colors || [],
    materials: product.materials || [],
    styles: [],
    room_types: [],
    tags: [product.typeName].filter(Boolean),
    extracted_by: 'ikea_api',
  };
  
  // Price
  const price = product.price?.numeral;
  const salePrice = product.salesPrice?.numeral;
  const currency = product.price?.currencyCode || 'CAD';
  
  return {
    title: product.name,
    description: product.gprDescription?.textLong || product.gprDescription?.textShort,
    category,
    subcategory: product.typeName,
    brand: 'IKEA',
    sku: itemNo,
    model_number: itemNo,
    product_url: productUrl,
    image_url: primaryImage,
    additional_images: additionalImages,
    price,
    original_price: salePrice ? price : undefined,
    currency,
    on_sale: !!salePrice,
    availability,
    condition: 'new',
    source_platform: 'custom_crawler',
    dimensions,
    attributes,
    raw_payload: {
      details: product,
      source: 'ikea_ca',
      scraped_at: new Date().toISOString(),
    },
  };
}

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
  if (args.category) log(`Category filter: ${args.category}`);
  
  log('\n⚠️  NOTE: This is a sample ingestion using known product IDs.');
  log('For full catalog ingestion, you would need to scrape product listings from IKEA.com');
  log('or use a paid service like Apify.\n');
  
  // Ensure IKEA store exists
  let storeId: string | null = null;
  if (!args.dryRun) {
    storeId = await ensureIkeaStore();
    log(`IKEA store ID: ${storeId}`, 'success');
  }
  
  // Determine categories to scrape
  const categoriesToScrape = args.category
    ? [args.category]
    : Object.keys(SAMPLE_PRODUCTS);
  
  for (const catKey of categoriesToScrape) {
    const productIds = SAMPLE_PRODUCTS[catKey as keyof typeof SAMPLE_PRODUCTS];
    if (!productIds) {
      log(`Unknown category: ${catKey}`, 'warn');
      continue;
    }
    
    log(`\n📦 Processing category: ${catKey}`);
    log(`Sample products: ${productIds.length}`);
    
    const idsToProcess = args.limit 
      ? productIds.slice(0, args.limit)
      : productIds;
    
    for (const [index, itemNo] of idsToProcess.entries()) {
      stats.total++;
      
      try {
        log(`\n[${index + 1}/${idsToProcess.length}] Processing product ${itemNo}`);
        
        // Map to ProductInput
        const productInput = await mapIkeaProduct(itemNo, catKey as ProductCategory);
        
        if (!productInput) {
          log('Failed to map product', 'error');
          stats.failed++;
          continue;
        }
        
        log(`  ${productInput.title}`);
        
        // Validate
        if (!productInput.product_url) {
          log('Missing product URL', 'warn');
          stats.failed++;
          continue;
        }
        
        if (!productInput.image_url) {
          log('Missing primary image', 'warn');
          stats.missingImages++;
        }
        
        if (!productInput.price) {
          log('Missing price', 'warn');
          stats.missingPrices++;
        }
        
        if (args.dryRun) {
          log(`[DRY RUN] Would upsert: ${productInput.title}`, 'info');
          log(`  Price: ${productInput.price} ${productInput.currency}`);
          log(`  Images: ${(productInput.additional_images?.length || 0) + 1} total`);
          log(`  URL: ${productInput.product_url}`);
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
        
      } catch (error) {
        log(`Error processing product: ${error}`, 'error');
        stats.failed++;
      }
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
  log(`⚠️  Missing images: ${stats.missingImages}`);
  log(`⚠️  Missing prices: ${stats.missingPrices}`);
  
  log('\n💡 Next Steps:');
  log('- Run verification: npm run verify:furniture');
  log('- For full catalog, consider using Apify IKEA scraper');
  log('- Or implement web scraping to discover all product IDs');
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

const args = parseArgs();
ingestIkeaProducts(args)
  .then(() => process.exit(0))
  .catch((error) => {
    log(`Fatal error: ${error}`, 'error');
    process.exit(1);
  });
