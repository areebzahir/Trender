/**
 * Custom Cheerio Scraper — for static/server-rendered product pages.
 *
 * Used for stores that don't have a Shopify /products.json endpoint
 * and don't require JavaScript rendering.
 *
 * Configurable selectors per store domain.
 */
import * as cheerio from 'cheerio';
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
import { absoluteUrl } from '../utils/absoluteUrl';
import { normalizePrice } from '../utils/normalizePrice';
import type { StoreSource } from '../sources';
import type { StoreInput } from '../../../src/lib/ingestion/types';

// ── Selector config per domain ─────────────────────────────────────────────────

interface SelectorConfig {
  productListSelector: string;   // CSS selector for product links on category pages
  categoryUrls: string[];        // Category/listing page URLs to crawl
  titleSelector: string;
  priceSelector: string;
  imageSelector: string;
  descriptionSelector: string;
  availabilitySelector?: string;
  skuSelector?: string;
}

const STORE_SELECTORS: Record<string, SelectorConfig> = {
  'decorium.com': {
    categoryUrls: [
      'https://www.decorium.com/sofas',
      'https://www.decorium.com/chairs',
      'https://www.decorium.com/tables',
      'https://www.decorium.com/beds',
    ],
    productListSelector: 'a.product-item-link, a[href*="/product/"]',
    titleSelector: 'h1.page-title, h1.product-name',
    priceSelector: '.price, .product-price',
    imageSelector: '.gallery-placeholder img, .product-image-photo',
    descriptionSelector: '.product.attribute.description, .product-description',
    skuSelector: '.product.attribute.sku .value',
  },
  'jysk.ca': {
    categoryUrls: [
      'https://www.jysk.ca/furniture/sofas-sectionals',
      'https://www.jysk.ca/furniture/chairs',
      'https://www.jysk.ca/furniture/tables',
      'https://www.jysk.ca/furniture/beds',
    ],
    productListSelector: 'a.product-link, .product-tile a',
    titleSelector: 'h1.product-title, h1[itemprop="name"]',
    priceSelector: '.price-current, [itemprop="price"]',
    imageSelector: '.product-image img, [itemprop="image"]',
    descriptionSelector: '.product-description, [itemprop="description"]',
  },
  'shelterfurniture.ca': {
    categoryUrls: [
      'https://www.shelterfurniture.ca/sofas',
      'https://www.shelterfurniture.ca/chairs',
      'https://www.shelterfurniture.ca/tables',
    ],
    productListSelector: 'a.product-link, .product-card a',
    titleSelector: 'h1, .product-title',
    priceSelector: '.price, .product-price',
    imageSelector: '.product-image img',
    descriptionSelector: '.product-description, .description',
  },
  'cornerstonefurniture.ca': {
    categoryUrls: [
      'https://www.cornerstonefurniture.ca/living-room',
      'https://www.cornerstonefurniture.ca/bedroom',
      'https://www.cornerstonefurniture.ca/dining-room',
    ],
    productListSelector: 'a[href*="/product"], .product a',
    titleSelector: 'h1, .product-name',
    priceSelector: '.price, .product-price',
    imageSelector: '.product-image img, .wp-post-image',
    descriptionSelector: '.product-description, .entry-content',
  },
};

// ── Scraper ────────────────────────────────────────────────────────────────────

export async function scrapeCustomCheerio(
  source: StoreSource,
  opts: { dryRun?: boolean; maxProducts?: number } = {}
): Promise<void> {
  const dryRun = opts.dryRun ?? false;
  const maxProducts = opts.maxProducts ?? config.scraper.maxProductsPerSource;

  const selectors = STORE_SELECTORS[source.domain];
  if (!selectors) {
    logger.warn(`No Cheerio selectors configured for ${source.domain} — skipping`);
    logger.warn(`To add support, add an entry to STORE_SELECTORS in scrapeCustomCheerio.ts`);
    return;
  }

  logger.section(`Cheerio: ${source.name}`);
  logger.info(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);

  const { store_id } = await upsertStoreFromSource(source);
  const jobId = await createScrapeJob({
    source_type: 'custom_crawler',
    source_name: `cheerio:${source.domain}`,
    target_url:  source.website,
    raw_config:  { strategy: 'custom_cheerio', dry_run: dryRun },
  });
  await startScrapeJob(jobId);

  const stats = { found: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 };

  try {
    // Collect product URLs from category pages
    const productUrls = new Set<string>();
    for (const catUrl of selectors.categoryUrls) {
      try {
        const links = await extractProductLinks(catUrl, selectors, source.website);
        links.forEach(l => productUrls.add(l));
        logger.debug(`${catUrl}: found ${links.length} product links`);
        await sleep(config.scraper.delayMs);
      } catch (err) {
        logger.warn(`Failed to fetch category ${catUrl}: ${err}`);
      }
    }

    const urls = Array.from(productUrls).slice(0, maxProducts);
    stats.found = urls.length;
    logger.info(`Found ${urls.length} product URLs`);

    if (dryRun) {
      logger.info('[DRY RUN] First 5 URLs:');
      urls.slice(0, 5).forEach((u, i) => logger.info(`  [${i + 1}] ${u}`));
      await completeScrapeJob(jobId, stats);
      return;
    }

    const storeInput: StoreInput = {
      name: source.name, website: source.website, domain: source.domain,
      country: source.country, province: source.province ?? undefined,
      store_type: source.storeType,
    };

    for (const productUrl of urls) {
      try {
        const raw = await scrapeProductPage(productUrl, selectors, storeInput);
        if (!raw) {
          stats.skipped++;
          continue;
        }

        const validationError = validateProduct(raw);
        if (validationError) {
          stats.skipped++;
          await logJobItem(jobId, { productUrl, status: 'skipped', errorMessage: validationError });
          continue;
        }

        const normalized = normalizeScrapedProduct(raw);
        const result = await upsertProduct(normalized, store_id, jobId);

        if (result.status === 'inserted') { stats.inserted++; await logJobItem(jobId, { productUrl, status: 'inserted' }); }
        else if (result.status === 'updated') { stats.updated++; await logJobItem(jobId, { productUrl, status: 'updated' }); }
        else if (result.status === 'skipped') { stats.skipped++; await logJobItem(jobId, { productUrl, status: 'skipped', errorMessage: result.reason }); }
        else { stats.failed++; await logJobItem(jobId, { productUrl, status: 'failed', errorMessage: result.error }); }

        await sleep(config.scraper.delayMs);
      } catch (err) {
        stats.failed++;
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`Error scraping ${productUrl}: ${msg}`);
        await logJobItem(jobId, { productUrl, status: 'failed', errorMessage: msg });
      }
    }

    await completeScrapeJob(jobId, stats);
    logger.summary({ 'Store': source.name, 'Found': stats.found, 'Inserted': stats.inserted, 'Updated': stats.updated, 'Skipped': stats.skipped, 'Failed': stats.failed });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Cheerio scraper failed for ${source.name}: ${msg}`);
    await failScrapeJob(jobId, msg);
  }
}

async function extractProductLinks(
  url: string,
  selectors: SelectorConfig,
  baseUrl: string
): Promise<string[]> {
  const res = await fetch(url, { headers: { 'User-Agent': config.scraper.userAgent } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const links: string[] = [];
  $(selectors.productListSelector).each((_, el) => {
    const href = $(el).attr('href');
    if (href) links.push(absoluteUrl(href, baseUrl));
  });
  return [...new Set(links)];
}

async function scrapeProductPage(
  url: string,
  selectors: SelectorConfig,
  store: StoreInput
) {
  const res = await fetch(url, { headers: { 'User-Agent': config.scraper.userAgent } });
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);

  const title = cleanText($(selectors.titleSelector).first().text());
  if (!title) return null;

  const priceText = $(selectors.priceSelector).first().text();
  const price = normalizePrice(priceText);

  const imageEl = $(selectors.imageSelector).first();
  const imageUrl = absoluteUrl(
    imageEl.attr('src') ?? imageEl.attr('data-src') ?? imageEl.attr('data-lazy-src') ?? '',
    store.website ?? ''
  );

  const description = cleanText($(selectors.descriptionSelector).first().text());
  const sku = selectors.skuSelector ? cleanText($(selectors.skuSelector).first().text()) : undefined;

  return {
    title,
    description,
    product_url: url,
    image_url: imageUrl,
    image_urls: [imageUrl].filter(Boolean),
    price,
    currency: 'CAD',
    sku,
    availability: 'unknown',
    source_platform: 'custom_crawler' as const,
    store,
    raw_payload: { url, scraped_at: new Date().toISOString() },
    base_url: store.website ?? '',
  };
}
