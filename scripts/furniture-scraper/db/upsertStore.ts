/**
 * Upsert a store into the existing `stores` table.
 * Re-exports from the shared ingestion layer with a scraper-friendly wrapper.
 */
import { upsertStore as _upsertStore } from '../../../src/lib/ingestion/upsertStore';
import type { StoreSource } from '../sources';
import type { StoreInput } from '../../../src/lib/ingestion/types';

export interface UpsertStoreResult {
  store_id: string;
  created: boolean;
}

export async function upsertStoreFromSource(source: StoreSource): Promise<UpsertStoreResult> {
  const input: StoreInput = {
    name:            source.name,
    website:         source.website,
    domain:          source.domain,
    country:         source.country,
    province:        source.province ?? undefined,
    city:            source.city ?? undefined,
    store_type:      source.storeType,
    source_platform: mapStrategy(source.scrapeStrategy),
    scrape_allowed:  true,
    discovered_by:   'manual',
  };

  return _upsertStore(input);
}

function mapStrategy(strategy: string): 'apify' | 'custom_crawler' | 'manual' {
  if (strategy === 'ikea_apify' || strategy === 'apify') return 'apify';
  if (strategy === 'manual') return 'manual';
  return 'custom_crawler';
}
