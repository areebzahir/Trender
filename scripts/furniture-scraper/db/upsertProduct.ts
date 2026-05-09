/**
 * Upsert a normalized product into Supabase.
 * Delegates to the shared ingestion layer.
 */
export { upsertProduct } from '../../../src/lib/ingestion/upsertProduct';
export type { UpsertProductResult } from '../../../src/lib/ingestion/upsertProduct';
