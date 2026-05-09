/**
 * The existing upsertProduct already inserts a placeholder row in product_embeddings
 * with embedding = NULL and model = 'pending'.
 *
 * This file provides a utility to check how many products are awaiting embeddings,
 * useful for monitoring.
 */
import { supabase } from '../supabase';
import { logger } from '../logger';

export async function countPendingEmbeddings(): Promise<number> {
  const { count, error } = await supabase
    .from('product_embeddings')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null);

  if (error) {
    logger.warn(`Could not count pending embeddings: ${error.message}`);
    return 0;
  }
  return count ?? 0;
}
