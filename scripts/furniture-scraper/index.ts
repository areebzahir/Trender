#!/usr/bin/env tsx
/**
 * Furniture Scraper — Main Orchestrator
 *
 * Loads all active stores from Supabase, routes each to the correct
 * scraper strategy, and runs them sequentially to avoid rate limits.
 *
 * Usage:
 *   npm run scrape:furniture
 *   npm run scrape:furniture -- --dry-run
 *   npm run scrape:furniture -- --strategy=shopify_products_json
 *   npm run scrape:furniture -- --store="Article"
 */
import 'dotenv/config';
import { logger } from './logger';
import { sleep } from './utils/sleep';
import { STORE_SOURCES, type ScrapeStrategy } from './sources';
import { scrapeIkeaApify } from './scrapers/scrapeIkeaApify';
import { scrapeShopifyStore } from './scrapers/scrapeShopifyStore';
import { scrapeCustomCheerio } from './scrapers/scrapeCustomCheerio';
import { scrapeCustomPlaywright } from './scrapers/scrapeCustomPlaywright';
import { countPendingEmbeddings } from './db/enqueueEmbeddings';

// ── CLI args ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun       = args.includes('--dry-run');
const strategyFilter = args.find(a => a.startsWith('--strategy='))?.split('=')[1] as ScrapeStrategy | undefined;
const storeFilter  = args.find(a => a.startsWith('--store='))?.split('=')[1]?.toLowerCase();
const maxProducts  = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] ?? '1000');

// ── Main ───────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  logger.section('🛋️  Trender Furniture Scraper');
  logger.info(`Mode:     ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  logger.info(`Strategy: ${strategyFilter ?? 'all'}`);
  logger.info(`Store:    ${storeFilter ?? 'all'}`);
  logger.info(`Max/src:  ${maxProducts}`);

  // Filter stores
  let stores = STORE_SOURCES.filter(s => s.isActive);
  if (strategyFilter) {
    stores = stores.filter(s => s.scrapeStrategy === strategyFilter);
  }
  if (storeFilter) {
    stores = stores.filter(s => s.name.toLowerCase().includes(storeFilter));
  }

  if (stores.length === 0) {
    logger.warn('No stores matched the filters. Check --strategy and --store flags.');
    process.exit(0);
  }

  logger.info(`Running ${stores.length} store(s)...`);

  const globalStats = {
    stores_processed: 0,
    stores_failed: 0,
    total_found: 0,
    total_inserted: 0,
    total_updated: 0,
    total_skipped: 0,
    total_failed: 0,
  };

  for (const store of stores) {
    logger.info(`\n▶ ${store.name} [${store.scrapeStrategy}]`);

    try {
      switch (store.scrapeStrategy) {
        case 'ikea_apify':
          await scrapeIkeaApify(dryRun);
          break;

        case 'shopify_products_json':
          await scrapeShopifyStore(store, { dryRun, maxProducts });
          break;

        case 'custom_cheerio':
          await scrapeCustomCheerio(store, { dryRun, maxProducts });
          break;

        case 'custom_playwright':
          await scrapeCustomPlaywright(store, { dryRun, maxProducts });
          break;

        case 'manual':
          logger.info(`${store.name} is marked as manual — skipping`);
          break;

        default:
          logger.warn(`Unknown strategy "${store.scrapeStrategy}" for ${store.name} — skipping`);
      }

      globalStats.stores_processed++;
    } catch (err) {
      globalStats.stores_failed++;
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Store ${store.name} failed: ${msg}`);
      // Continue with next store — don't crash the whole run
    }

    // Polite delay between stores
    await sleep(3000);
  }

  // Check pending embeddings
  const pendingEmbeddings = await countPendingEmbeddings();

  logger.summary({
    'Stores processed':   globalStats.stores_processed,
    'Stores failed':      globalStats.stores_failed,
    'Pending embeddings': pendingEmbeddings,
    'Mode':               dryRun ? 'DRY RUN (nothing saved)' : 'LIVE',
  });

  if (pendingEmbeddings > 0) {
    logger.info(`\n💡 ${pendingEmbeddings} products are awaiting embeddings.`);
    logger.info('   Run the embedding generation script when ready.');
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    logger.error(`Fatal error: ${err}`);
    process.exit(1);
  });
