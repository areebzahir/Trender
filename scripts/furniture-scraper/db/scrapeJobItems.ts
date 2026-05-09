/**
 * Log individual scrape job items.
 * Thin wrapper around recordScrapeJobItem for clarity.
 */
import { recordScrapeJobItem } from '../../../src/lib/ingestion/createScrapeJob';

export type ItemStatus = 'inserted' | 'updated' | 'skipped' | 'failed';

export async function logJobItem(
  jobId: string,
  opts: {
    externalId?: string;
    productUrl?: string;
    status: ItemStatus;
    errorMessage?: string;
    rawPayload?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await recordScrapeJobItem(jobId, {
      external_id:   opts.externalId,
      product_url:   opts.productUrl,
      status:        opts.status,
      error_message: opts.errorMessage,
      raw_payload:   opts.rawPayload ?? {},
    });
  } catch {
    // Never let logging failures crash the scraper
  }
}
