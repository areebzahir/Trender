/**
 * Scrape job lifecycle management.
 * Backend only — uses service role client.
 */
import { supabaseAdmin } from './supabaseAdmin';
import type { ScrapeJobInput, ScrapeJobStatus } from './types';

export async function createScrapeJob(input: ScrapeJobInput): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('scrape_jobs')
    .insert({
      source_type:  input.source_type,
      source_name:  input.source_name,
      target_url:   input.target_url,
      raw_config:   input.raw_config ?? {},
      status:       'queued',
    })
    .select('id')
    .single();

  if (error) throw new Error(`createScrapeJob failed: ${error.message}`);
  return data.id;
}

export async function startScrapeJob(jobId: string): Promise<void> {
  await supabaseAdmin
    .from('scrape_jobs')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', jobId);
}

export async function completeScrapeJob(
  jobId: string,
  counts: { found: number; inserted: number; updated: number; failed: number }
): Promise<void> {
  await supabaseAdmin
    .from('scrape_jobs')
    .update({
      status:         'completed',
      finished_at:    new Date().toISOString(),
      total_found:    counts.found,
      total_inserted: counts.inserted,
      total_updated:  counts.updated,
      total_failed:   counts.failed,
    })
    .eq('id', jobId);
}

export async function failScrapeJob(jobId: string, errorMessage: string): Promise<void> {
  await supabaseAdmin
    .from('scrape_jobs')
    .update({
      status:        'failed',
      finished_at:   new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq('id', jobId);
}

export async function recordScrapeJobItem(
  jobId: string,
  item: {
    external_id?: string;
    product_url?: string;
    status: 'inserted' | 'updated' | 'skipped' | 'failed';
    error_message?: string;
    raw_payload?: Record<string, unknown>;
  }
): Promise<void> {
  await supabaseAdmin.from('scrape_job_items').insert({
    job_id:        jobId,
    external_id:   item.external_id,
    product_url:   item.product_url,
    status:        item.status,
    error_message: item.error_message,
    raw_payload:   item.raw_payload ?? {},
  });
}
