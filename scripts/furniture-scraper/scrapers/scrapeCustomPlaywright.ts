/**
 * Custom Playwright Scraper — for JavaScript-heavy product pages.
 *
 * Used for stores that require a real browser to render content
 * (Wayfair, The Brick, Leon's, Canadian Tire, etc.)
 *
 * NOTE: Playwright must be installed: npm install playwright
 * Then: npx playwright install chromium
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
import { absoluteUrl } from '../utils/absoluteUrl';
import { normalizePrice } from '../utils/normalizePrice';
import type { StoreSource } from '../sources';
import type { StoreInput } from '../../../src/lib/ingestion/types';

// ── Playwright selector config per domain ──────────────────────────────────────

interface PlaywrightConfig {
  categoryUrls: string[];
  productLinkSelector: string;
  titleSelector: string;
  priceSelector: string;
  imageSelector: string;
  descriptionSelector: string;
  availabilitySelector?: string;
  waitForSelector?: string;       // wait for this element before scraping
  scrollToLoad?: boolean;         // scroll to trigger lazy loading
}

const PLAYWRIGHT_CONFIGS: Record<string, PlaywrightConfig> = {
  'wayfair.ca': {
    categoryUrls: [
      'https://www.wayfair.ca/furniture/cat/sofas-c413892.html',
      'https://www.wayfair.ca/furniture/cat/accent-chairs-c413893.html',
      'https://www.wayfair.ca/furniture/cat/coffee-tables-c413894.html',
    ],
    productLinkSelector: 'a[data-hb-id="ProductCard"], a.ProductCard',
    titleSelector: 'h1[data-hb-id="ProductDetailTitle"], h1.ProductDetailTitle',
    priceSelector: '[data-hb-id="PriceBlock"] .BasePriceBlock, .PriceBlock',
    imageSelector: '.MediaGallery img, .ProductDetailImageCarousel img',
    descriptionSelector: '.ProductDetailDescription, [data-hb-id="ProductDescription"]',
    waitForSelector: 'h1',
    scrollToLoad: true,
  },
  'thebrick.com': {
    categoryUrls: [
      'https://www.thebrick.com/collections/sofas',
      'https://www.thebrick.com/collections/chairs',
      'https://www.thebrick.com/collections/coffee-tables',
    ],
    productLinkSelector: 'a.product-item__title, .product-card a',
    titleSelector: 'h1.product__title, h1.product-title',
    priceSelector: '.price__current, .product__price',
    imageSelector: '.product__media img, .product-single__photo',
    descriptionSelector: '.product__description, .product-description',
    waitForSelector: 'h1',
  },
  'leons.ca': {
    categoryUrls: [
      'https://www.leons.ca/collections/sofas',
      'https://www.leons.ca/collections/chairs',
      'https://www.leons.ca/collections/coffee-tables',
    ],
    productLinkSelector: 'a.product-item__title, .product-card a',
    titleSelector: 'h1.product__title',
    priceSelector: '.price__current, .product__price',
    imageSelector: '.product__media img',
    descriptionSelector: '.product__description',
    waitForSelector: 'h1',
  },
  'canadiantire.ca': {
    categoryUrls: [
      'https://www.canadiantire.ca/en/living/furniture/sofas-sectionals.html',
      'https://www.canadiantire.ca/en/living/furniture/chairs.html',
    ],
    productLinkSelector: 'a.product-link, .product-tile a',
    titleSelector: 'h1.product-title, .pdp-title',
    priceSelector: '.price-display, .pdp-price',
    imageSelector: '.product-image img, .pdp-image img',
    descriptionSelector: '.product-description, .pdp-description',
    waitForSelector: '.product-title',
    scrollToLoad: true,
  },
  'walmart.ca': {
    categoryUrls: [
      'https://www.walmart.ca/en/furniture/sofas-couches/N-4852',
      'https://www.walmart.ca/en/furniture/chairs/N-4853',
    ],
    productLinkSelector: 'a[link-identifier="linkText"], .product-title-link',
    titleSelector: 'h1.prod-ProductTitle, [itemprop="name"]',
    priceSelector: '.price-characteristic, [itemprop="price"]',
    imageSelector: '.prod-hero-image img, .product-image-photo',
    descriptionSelector: '.about-product-description, [itemprop="description"]',
    waitForSelector: 'h1',
    scrollToLoad: true,
  },
};

// ── Scraper ────────────────────────────────────────────────────────────────────

export async function scrapeCustomPlaywright(
  source: StoreSource,
  opts: { dryRun?: boolean; maxProducts?: number } = {}
): Promise<void> {
  const dryRun = opts.dryRun ?? false;
  const maxProducts = opts.maxProducts ?? Math.min(config.scraper.maxProductsPerSource, 200); // lower limit for Playwright

  const pwConfig = PLAYWRIGHT_CONFIGS[source.domain];
  if (!pwConfig) {
    logger.warn(`No Playwright config for ${source.domain} — skipping`);
    logger.warn(`To add support, add an entry to PLAYWRIGHT_CONFIGS in scrapeCustomPlaywright.ts`);
    return;
  }

  // Check if playwright is available
  let playwright: typeof import('playwright');
  try {
    playwright = await import('playwright');
  } catch {
    logger.error(
      `Playwright not installed. Run:\n` +
      `  npm install playwright\n` +
      `  npx playwright install chromium`
    );
    return;
  }

  logger.section(`Playwright: ${source.name}`);
  logger.info(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);

  const { store_id } = await upsertStoreFromSource(source);
  const jobId = await createScrapeJob({
    source_type: 'custom_crawler',
    source_name: `playwright:${source.domain}`,
    target_url:  source.website,
    raw_config:  { strategy: 'custom_playwright', dry_run: dryRun },
  });
  await startScrapeJob(jobId);

  const stats = { found: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 };

  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: config.scraper.userAgent,
    locale: 'en-CA',
  });

  try {
    const page = await context.newPage();
    const productUrls = new Set<string>();

    // Collect product URLs from category pages
    for (const catUrl of pwConfig.categoryUrls) {
      try {
        await page.goto(catUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (pwConfig.scrollToLoad) {
          await autoScroll(page);
        }
        const links = await page.$$eval(
          pwConfig.productLinkSelector,
          (els, base) => els.map(el => {
            const href = (el as HTMLAnchorElement).href;
            return href.startsWith('http') ? href : `${base}${href}`;
          }),
          source.website.replace(/\/$/, '')
        );
        links.forEach(l => productUrls.add(l));
        logger.debug(`${catUrl}: ${links.length} product links`);
        await sleep(config.scraper.delayMs * 2);
      } catch (err) {
        logger.warn(`Failed category ${catUrl}: ${err}`);
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
        await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (pwConfig.waitForSelector) {
          await page.waitForSelector(pwConfig.waitForSelector, { timeout: 10000 }).catch(() => {});
        }

        const raw = await extractProductData(page, productUrl, pwConfig, storeInput);
        if (!raw) { stats.skipped++; continue; }

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

        await sleep(config.scraper.delayMs * 2); // be polite with Playwright
      } catch (err) {
        stats.failed++;
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`Error [${productUrl}]: ${msg}`);
        await logJobItem(jobId, { productUrl, status: 'failed', errorMessage: msg });
      }
    }

    await completeScrapeJob(jobId, stats);
    logger.summary({ 'Store': source.name, 'Found': stats.found, 'Inserted': stats.inserted, 'Updated': stats.updated, 'Skipped': stats.skipped, 'Failed': stats.failed });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Playwright scraper failed for ${source.name}: ${msg}`);
    await failScrapeJob(jobId, msg);
  } finally {
    await browser.close();
  }
}

async function extractProductData(
  page: import('playwright').Page,
  url: string,
  cfg: PlaywrightConfig,
  store: StoreInput
) {
  const title = cleanText(await page.$eval(cfg.titleSelector, el => el.textContent ?? '').catch(() => ''));
  if (!title) return null;

  const priceText = await page.$eval(cfg.priceSelector, el => el.textContent ?? '').catch(() => '');
  const price = normalizePrice(priceText);

  const imageUrl = await page.$eval(
    cfg.imageSelector,
    el => (el as HTMLImageElement).src ?? (el as HTMLImageElement).dataset.src ?? ''
  ).catch(() => '');

  const description = cleanText(
    await page.$eval(cfg.descriptionSelector, el => el.textContent ?? '').catch(() => '')
  );

  return {
    title,
    description,
    product_url: url,
    image_url: imageUrl,
    image_urls: [imageUrl].filter(Boolean),
    price,
    currency: 'CAD',
    availability: 'unknown',
    source_platform: 'custom_crawler' as const,
    store,
    raw_payload: { url, scraped_at: new Date().toISOString() },
    base_url: store.website ?? '',
  };
}

async function autoScroll(page: import('playwright').Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>(resolve => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
  await sleep(1000);
}
