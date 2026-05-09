/**
 * Ingestion Orchestrator
 *
 * Coordinates the full ingestion pipeline:
 *   1. Create scrape job record
 *   2. Mark job as running
 *   3. Upsert store for each product
 *   4. Upsert product + dimensions + attributes + embedding placeholder
 *   5. Record per-item status
 *   6. Mark job completed or failed
 *
 * Backend only — uses service role client.
 */

import { createScrapeJob, startScrapeJob, completeScrapeJob, failScrapeJob, recordScrapeJobItem } from './createScrapeJob';
import { upsertStore } from './upsertStore';
import { upsertProduct } from './upsertProduct';
import type { NormalizedFurnitureProduct, ScrapeJobInput } from './types';

export interface IngestionOptions {
  products:     NormalizedFurnitureProduct[];
  source_type:  ScrapeJobInput['source_type'];
  source_name?: string;
  target_url?:  string;
  raw_config?:  Record<string, unknown>;
}

export interface IngestionResult {
  job_id:    string;
  found:     number;
  inserted:  number;
  updated:   number;
  failed:    number;
  errors:    Array<{ title: string; error: string }>;
}

export async function runIngestion(options: IngestionOptions): Promise<IngestionResult> {
  const { products, source_type, source_name, target_url, raw_config } = options;

  // 1. Create job record
  const jobId = await createScrapeJob({ source_type, source_name, target_url, raw_config });

  // 2. Mark running
  await startScrapeJob(jobId);

  const counts = { found: products.length, inserted: 0, updated: 0, failed: 0 };
  const errors: Array<{ title: string; error: string }> = [];

  // 3. Process each product
  for (const product of products) {
    try {
      // Upsert store
      const { store_id } = await upsertStore(product.store);

      // Upsert product
      const result = await upsertProduct(product, store_id, jobId);

      if (result.status === 'inserted') {
        counts.inserted++;
        await recordScrapeJobItem(jobId, {
          product_url: product.product_url,
          status:      'inserted',
          raw_payload: product.raw_payload,
        });
      } else if (result.status === 'updated') {
        counts.updated++;
        await recordScrapeJobItem(jobId, {
          product_url: product.product_url,
          status:      'updated',
          raw_payload: product.raw_payload,
        });
      } else if (result.status === 'failed') {
        counts.failed++;
        errors.push({ title: product.title, error: result.error });
        await recordScrapeJobItem(jobId, {
          product_url:   product.product_url,
          status:        'failed',
          error_message: result.error,
          raw_payload:   product.raw_payload,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      counts.failed++;
      errors.push({ title: product.title, error: msg });
      await recordScrapeJobItem(jobId, {
        product_url:   product.product_url,
        status:        'failed',
        error_message: msg,
      });
    }
  }

  // 4. Mark job complete
  if (counts.failed === counts.found && counts.found > 0) {
    await failScrapeJob(jobId, `All ${counts.found} items failed`);
  } else {
    await completeScrapeJob(jobId, counts);
  }

  return { job_id: jobId, ...counts, errors };
}
