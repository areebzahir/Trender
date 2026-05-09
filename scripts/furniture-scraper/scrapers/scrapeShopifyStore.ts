/**
 * Shopify Store Scraper
 *
 * Uses the public /products.json endpoint available on all Shopify stores.
 * No authentication required — this is a public API Shopify exposes.
 *
 * Endpoint: GET {store_url}/products.json?limit=250&page={n}
 */
import { config } from '../config';
import { logger } from '../logger';
import { upsertStoreFromSource } from '../db/upsertStore';
import { upsertProduct } from '../db/upsertProduct';
import { logJobItem } from '../db/scrapeJobItems';
import { createScrapeJob, startScrapeJob, completeScrapeJob, failScrapeJob } from '../db/scrapeJobs';
import { normalizeScrapedProduct } from '../normalize/normalizeProduct';
import { validateProduct } from '../utils/validateProduct';
import { sleep } from '../utils/sleep';
import { cleanText } from '../utils/cleanText';
import { normalizePrice } from '../utils/normalizePrice';
import { absoluteUrl } from '../utils/absoluteUrl';
import type { StoreSource } from '../sources';
import type { StoreInput } from '../../../src/lib/ingestion/types';

// ── Shopify API types ──────────────────────────────────────────────────────────

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
  sku: string;
  option1?: string;
  option2?: string;
  option3?: string;
}

interface ShopifyImage {
  src: string;
  alt?: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  tags: string[];
  body_html: string;
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  options: Array<{ name: string; values: string[] }>;
  published_at: string;
}

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

// ── Scraper ────────────────────────────────────────────────────────────────────

export async function scrapeShopifyStore(
  source: StoreSource,
  opts: { dryRun?: boolean; maxProducts?: number } = {}
): Promise<void> {
  const dryRun = opts.dryRun ?? false;
  const maxProducts = opts.maxProducts ?? config.scraper.maxProductsPerSource;

  logger.section(`Shopify: ${source.name}`);
  logger.info(`URL: ${source.website}`);
  logger.info(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);

  // Ensure store exists
  const { store_id } = await upsertStoreFromSource(source);
  logger.success(`Store ID: ${store_id}`);

  // Create scrape job
  const jobId = await createScrapeJob({
    source_type: 'custom_crawler',
    source_name: `shopify:${source.domain}`,
    target_url:  source.website,
    raw_config:  { strategy: 'shopify_products_json', dry_run: dryRun },
  });
  await startScrapeJob(jobId);

  const stats = { found: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 };

  try {
    const allProducts = await fetchAllShopifyProducts(source.website, maxProducts);
    stats.found = allProducts.length;
    logger.info(`Fetched ${allProducts.length} products`);

    if (dryRun) {
      logger.info('[DRY RUN] First 5 products:');
      allProducts.slice(0, 5).forEach((p, i) => {
        const price = p.variants[0]?.price ?? '?';
        logger.info(`  [${i + 1}] ${p.title} — $${price}`);
      });
      await completeScrapeJob(jobId, stats);
      return;
    }

    const storeInput: StoreInput = {
      name:       source.name,
      website:    source.website,
      domain:     source.domain,
      country:    source.country,
      province:   source.province ?? undefined,
      store_type: source.storeType,
    };

    for (const product of allProducts) {
      try {
        const raw = mapShopifyProduct(product, storeInput, source.website);
        const validationError = validateProduct(raw);

        if (validationError) {
          logger.debug(`Skipped [${product.handle}]: ${validationError}`);
          stats.skipped++;
          await logJobItem(jobId, {
            externalId: String(product.id),
            productUrl: raw.product_url,
            status: 'skipped',
            errorMessage: validationError,
          });
          continue;
        }

        const normalized = normalizeScrapedProduct(raw);
        const result = await upsertProduct(normalized, store_id, jobId);

        if (result.status === 'inserted') {
          stats.inserted++;
          logger.debug(`Inserted: ${product.title}`);
          await logJobItem(jobId, { externalId: String(product.id), productUrl: raw.product_url, status: 'inserted' });
        } else if (result.status === 'updated') {
          stats.updated++;
          await logJobItem(jobId, { externalId: String(product.id), productUrl: raw.product_url, status: 'updated' });
        } else if (result.status === 'skipped') {
          stats.skipped++;
          await logJobItem(jobId, { externalId: String(product.id), productUrl: raw.product_url, status: 'skipped', errorMessage: result.reason });
        } else {
          stats.failed++;
          logger.warn(`Failed [${product.handle}]: ${result.error}`);
          await logJobItem(jobId, { externalId: String(product.id), productUrl: raw.product_url, status: 'failed', errorMessage: result.error });
        }

        await sleep(50); // small delay between inserts
      } catch (err) {
        stats.failed++;
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`Error [${product.handle}]: ${msg}`);
        await logJobItem(jobId, { externalId: String(product.id), status: 'failed', errorMessage: msg });
      }
    }

    await completeScrapeJob(jobId, stats);
    logger.summary({
      'Store':    source.name,
      'Found':    stats.found,
      'Inserted': stats.inserted,
      'Updated':  stats.updated,
      'Skipped':  stats.skipped,
      'Failed':   stats.failed,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Shopify scraper failed for ${source.name}: ${msg}`);
    await failScrapeJob(jobId, msg);
  }
}

// ── Fetch all pages ────────────────────────────────────────────────────────────

async function fetchAllShopifyProducts(
  baseUrl: string,
  maxProducts: number
): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  let page = 1;
  const limit = 250; // Shopify max per page
  let consecutiveFailures = 0;

  while (all.length < maxProducts) {
    const url = `${baseUrl.replace(/\/$/, '')}/products.json?limit=${limit}&page=${page}`;
    logger.debug(`Fetching page ${page}: ${url}`);

    try {
      const res = await fetchWithRetry(url);
      if (!res.ok) {
        logger.warn(`Page ${page} returned ${res.status} — stopping pagination`);
        break;
      }

      const data = await res.json() as ShopifyProductsResponse;
      const products = data.products ?? [];

      if (products.length === 0) break; // no more pages

      all.push(...products);
      logger.debug(`Page ${page}: ${products.length} products (total: ${all.length})`);

      if (products.length < limit) break; // last page
      page++;
      consecutiveFailures = 0;
      await sleep(config.scraper.delayMs);

    } catch (err) {
      consecutiveFailures++;
      logger.warn(`Page ${page} failed: ${err}. Attempt ${consecutiveFailures}/3`);
      if (consecutiveFailures >= 3) {
        logger.error(`Too many failures — stopping pagination for ${baseUrl}`);
        break;
      }
      await sleep(config.scraper.retryDelayMs);
    }
  }

  return all.slice(0, maxProducts);
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': config.scraper.userAgent,
          'Accept': 'application/json',
        },
      });
      if (res.status === 429) {
        // Rate limited — wait and retry
        const retryAfter = parseInt(res.headers.get('Retry-After') ?? '5') * 1000;
        logger.warn(`Rate limited. Waiting ${retryAfter}ms...`);
        await sleep(retryAfter);
        continue;
      }
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(config.scraper.retryDelayMs * attempt);
    }
  }
  throw new Error(`Failed after ${retries} retries: ${url}`);
}

// ── Map Shopify product to raw format ──────────────────────────────────────────

function mapShopifyProduct(
  product: ShopifyProduct,
  store: StoreInput,
  baseUrl: string
) {
  const baseClean = baseUrl.replace(/\/$/, '');

  // Price: use first available variant
  const firstVariant = product.variants[0];
  const price = normalizePrice(firstVariant?.price);
  const compareAtPrice = normalizePrice(firstVariant?.compare_at_price);

  // Availability: any variant available = in_stock
  const anyAvailable = product.variants.some(v => v.available);

  // Images
  const images = product.images.map(img => absoluteUrl(img.src, baseClean));
  const imageUrl = images[0] ?? '';
  const imageUrls = images;

  // Product URL
  const productUrl = `${baseClean}/products/${product.handle}`;

  // Options (colors, materials, sizes)
  const optionValues = product.options.flatMap(o => o.values);

  // Description
  const description = cleanText(product.body_html);

  return {
    title:           product.title,
    description,
    product_url:     productUrl,
    image_url:       imageUrl,
    image_urls:      imageUrls,
    price,
    compare_at_price: compareAtPrice && price && compareAtPrice > price ? compareAtPrice : undefined,
    currency:        'CAD',
    brand:           product.vendor || store.name,
    sku:             firstVariant?.sku || undefined,
    external_id:     String(product.id),
    category:        product.product_type || undefined,
    tags:            product.tags,
    options:         optionValues,
    availability:    anyAvailable ? 'in_stock' : 'out_of_stock',
    source_platform: 'custom_crawler' as const,
    store,
    raw_payload:     product as unknown as Record<string, unknown>,
    base_url:        baseClean,
  };
}

// ── CLI entry point ────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  import('../sources').then(async ({ SHOPIFY_STORES }) => {
    const dryRun = process.argv.includes('--dry-run');
    const storeName = process.argv.find(a => a.startsWith('--store='))?.split('=')[1];
    const stores = storeName
      ? SHOPIFY_STORES.filter(s => s.name.toLowerCase().includes(storeName.toLowerCase()))
      : SHOPIFY_STORES;

    if (stores.length === 0) {
      logger.error(`No Shopify stores found matching: ${storeName}`);
      process.exit(1);
    }

    for (const store of stores) {
      await scrapeShopifyStore(store, { dryRun });
      await sleep(config.scraper.delayMs * 2);
    }
    process.exit(0);
  });
}
