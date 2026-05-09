/**
 * IKEA Canada scraper using Apify.
 *
 * Requires:
 *   APIFY_TOKEN (or APIFY_API_TOKEN) in .env
 *   APIFY_IKEA_ACTOR_ID in .env
 *
 * The Apify IKEA actor collects product data from IKEA.com.
 * Recommended actor: "dtrungtin/ikea-scraper" or similar.
 * Set APIFY_IKEA_ACTOR_ID to the actor's full ID (e.g. "dtrungtin/ikea-scraper").
 */
import { ApifyClient } from 'apify-client';
import { config } from '../config';
import { logger } from '../logger';
import { supabase } from '../supabase';
import { upsertStoreFromSource } from '../db/upsertStore';
import { upsertProduct } from '../db/upsertProduct';
import { logJobItem } from '../db/scrapeJobItems';
import { createScrapeJob, startScrapeJob, completeScrapeJob, failScrapeJob } from '../db/scrapeJobs';
import { normalizeScrapedProduct } from '../normalize/normalizeProduct';
import { validateProduct } from '../utils/validateProduct';
import { sleep } from '../utils/sleep';
import { chunk } from '../utils/chunk';
import { IKEA_STORES } from '../sources';
import type { StoreInput } from '../../../src/lib/ingestion/types';

interface ApifyIkeaItem {
  itemNo?: string;
  id?: string;
  name?: string;
  title?: string;
  price?: number | string;
  priceNumeral?: number;
  regularPrice?: number;
  currency?: string;
  url?: string;
  link?: string;
  imageUrl?: string;
  image?: string;
  images?: string[];
  description?: string;
  typeName?: string;
  category?: string;
  colors?: string[];
  materials?: string[];
  measurements?: string;
  availability?: string;
  inStock?: boolean;
}

export async function scrapeIkeaApify(dryRun = false): Promise<void> {
  const source = IKEA_STORES[0];
  if (!source) {
    logger.error('No IKEA store source defined');
    return;
  }

  // Validate Apify config
  if (!config.apify.token) {
    logger.error(
      'Missing APIFY_TOKEN (or APIFY_API_TOKEN) in .env\n' +
      '  Get your token at: https://console.apify.com/account/integrations'
    );
    return;
  }
  if (!config.apify.ikeaActorId) {
    logger.error(
      'Missing APIFY_IKEA_ACTOR_ID in .env\n' +
      '  Find an IKEA actor at: https://apify.com/store?search=ikea\n' +
      '  Recommended: "dtrungtin/ikea-scraper"\n' +
      '  Set APIFY_IKEA_ACTOR_ID=dtrungtin/ikea-scraper in your .env'
    );
    return;
  }

  logger.section(`IKEA Canada — Apify Scraper`);
  logger.info(`Actor: ${config.apify.ikeaActorId}`);
  logger.info(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);

  // Ensure store exists
  const { store_id } = await upsertStoreFromSource(source);
  logger.success(`Store ID: ${store_id}`);

  // Create scrape job
  const jobId = await createScrapeJob({
    source_type: 'apify',
    source_name: `apify:${config.apify.ikeaActorId}`,
    target_url:  source.website,
    raw_config:  { actor_id: config.apify.ikeaActorId, country: 'CA', dry_run: dryRun },
  });
  await startScrapeJob(jobId);
  logger.info(`Scrape job: ${jobId}`);

  const stats = { found: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 };

  try {
    const client = new ApifyClient({ token: config.apify.token });

    logger.info('Starting Apify actor run...');
    const run = await client.actor(config.apify.ikeaActorId).call({
      country: 'CA',
      language: 'en',
      maxItems: config.scraper.maxProductsPerSource,
    });

    logger.success(`Actor run complete. Run ID: ${run.id}`);
    logger.info('Fetching dataset items...');

    const { items } = await client.dataset(run.defaultDatasetId).listItems({
      limit: config.scraper.maxProductsPerSource,
    });

    stats.found = items.length;
    logger.info(`Found ${items.length} products`);

    if (dryRun) {
      logger.info('[DRY RUN] Showing first 5 items:');
      items.slice(0, 5).forEach((item: any, i: number) => {
        logger.info(`  [${i + 1}] ${item.name ?? item.title ?? 'Unknown'} — $${item.price ?? item.priceNumeral ?? '?'}`);
      });
      await completeScrapeJob(jobId, stats);
      return;
    }

    const storeInput: StoreInput = {
      name:    source.name,
      website: source.website,
      domain:  source.domain,
      country: source.country,
      province: source.province ?? undefined,
      store_type: source.storeType,
    };

    // Process in batches
    const batches = chunk(items as ApifyIkeaItem[], config.scraper.batchSize);
    for (const batch of batches) {
      for (const item of batch) {
        try {
          const raw = mapApifyItem(item, storeInput);
          const validationError = validateProduct(raw);
          if (validationError) {
            logger.debug(`Skipped: ${validationError} — ${raw.title}`);
            stats.skipped++;
            await logJobItem(jobId, {
              externalId: item.itemNo ?? item.id,
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
            await logJobItem(jobId, { externalId: item.itemNo, productUrl: raw.product_url, status: 'inserted' });
          } else if (result.status === 'updated') {
            stats.updated++;
            await logJobItem(jobId, { externalId: item.itemNo, productUrl: raw.product_url, status: 'updated' });
          } else if (result.status === 'skipped') {
            stats.skipped++;
            await logJobItem(jobId, { externalId: item.itemNo, productUrl: raw.product_url, status: 'skipped', errorMessage: result.reason });
          } else {
            stats.failed++;
            logger.warn(`Failed: ${result.error}`);
            await logJobItem(jobId, { externalId: item.itemNo, productUrl: raw.product_url, status: 'failed', errorMessage: result.error });
          }
        } catch (err) {
          stats.failed++;
          const msg = err instanceof Error ? err.message : String(err);
          logger.error(`Error processing item: ${msg}`);
          await logJobItem(jobId, { status: 'failed', errorMessage: msg });
        }
      }
      await sleep(config.scraper.delayMs);
    }

    await completeScrapeJob(jobId, stats);
    logger.summary({
      'Store':     source.name,
      'Found':     stats.found,
      'Inserted':  stats.inserted,
      'Updated':   stats.updated,
      'Skipped':   stats.skipped,
      'Failed':    stats.failed,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`IKEA Apify scraper failed: ${msg}`);
    await failScrapeJob(jobId, msg);
    stats.failed = stats.found;
  }
}

function mapApifyItem(item: ApifyIkeaItem, store: StoreInput) {
  const title = item.name ?? item.title ?? '';
  const productUrl = item.url ?? item.link ?? '';
  const imageUrl = item.imageUrl ?? item.image ?? (item.images?.[0]) ?? '';
  const imageUrls = item.images ?? (imageUrl ? [imageUrl] : []);
  const price = item.priceNumeral ?? item.price;
  const comparePrice = item.regularPrice;

  return {
    title,
    description: item.description,
    product_url: productUrl,
    image_url: imageUrl,
    image_urls: imageUrls,
    price,
    compare_at_price: comparePrice && comparePrice > (Number(price) || 0) ? comparePrice : undefined,
    currency: item.currency ?? 'CAD',
    brand: 'IKEA',
    sku: item.itemNo ?? item.id,
    external_id: item.itemNo ?? item.id,
    tags: item.typeName ? [item.typeName] : [],
    options: item.colors ?? [],
    dimensions_text: item.measurements,
    availability: item.inStock === true ? 'in_stock' : item.availability,
    source_platform: 'apify' as const,
    store,
    raw_payload: item as Record<string, unknown>,
    base_url: 'https://www.ikea.com',
  };
}

// ── CLI entry point ────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = process.argv.includes('--dry-run');
  scrapeIkeaApify(dryRun)
    .then(() => process.exit(0))
    .catch(err => {
      logger.error(String(err));
      process.exit(1);
    });
}
