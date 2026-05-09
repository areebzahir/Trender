#!/usr/bin/env tsx
/**
 * Seed all Canadian/Ontario furniture stores into the existing `stores` table.
 *
 * Usage:
 *   npm run seed:furniture-stores
 *
 * This is safe to run multiple times — it upserts by normalized domain.
 */
import 'dotenv/config';
import { upsertStoreFromSource } from './db/upsertStore';
import { STORE_SOURCES } from './sources';
import { logger } from './logger';
import { sleep } from './utils/sleep';

async function seedStores(): Promise<void> {
  logger.section('Seeding Furniture Stores');
  logger.info(`Seeding ${STORE_SOURCES.length} stores into Supabase...`);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const source of STORE_SOURCES) {
    try {
      const result = await upsertStoreFromSource(source);
      if (result.created) {
        logger.success(`Created: ${source.name} (${source.domain})`);
        created++;
      } else {
        logger.info(`Updated: ${source.name} (${source.domain})`);
        updated++;
      }
      await sleep(100); // small delay to avoid hammering Supabase
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to seed ${source.name}: ${msg}`);
    }
  }

  logger.summary({
    'Total stores':  STORE_SOURCES.length,
    'Created':       created,
    'Updated':       updated,
    'Failed':        failed,
  });

  if (failed > 0) {
    logger.warn(`${failed} stores failed to seed. Check errors above.`);
    process.exit(1);
  }

  logger.success('All stores seeded successfully!');
  logger.info('Run "npm run scrape:furniture" to start scraping products.');
}

seedStores()
  .then(() => process.exit(0))
  .catch(err => {
    logger.error(`Fatal: ${err}`);
    process.exit(1);
  });
