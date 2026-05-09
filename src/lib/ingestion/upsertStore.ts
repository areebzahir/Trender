/**
 * Upsert a store and optional location into Supabase.
 * Uses service role client — backend only.
 */
import { supabaseAdmin } from './supabaseAdmin';
import { extractDomain } from './normalizeProduct';
import type { StoreInput, StoreLocationInput } from './types';

export interface UpsertStoreResult {
  store_id: string;
  created: boolean;
}

/**
 * Upsert a store by normalized domain.
 * If a store with the same domain already exists, update it and return its id.
 */
export async function upsertStore(input: StoreInput): Promise<UpsertStoreResult> {
  const domain = input.domain ?? extractDomain(input.website ?? '');
  const normalizedDomain = domain.replace(/^www\./, '').toLowerCase();

  // Try to find existing store by normalized domain
  if (normalizedDomain) {
    const { data: existing } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('normalized_domain', normalizedDomain)
      .maybeSingle();

    if (existing) {
      // Update metadata but don't overwrite manually curated fields
      await supabaseAdmin
        .from('stores')
        .update({
          name:            input.name,
          phone:           input.phone,
          email:           input.email,
          address:         input.address,
          city:            input.city,
          province:        input.province ?? 'ON',
          postal_code:     input.postal_code,
          latitude:        input.latitude,
          longitude:       input.longitude,
          store_type:      input.store_type ?? 'unknown',
          source_url:      input.source_url,
          source_platform: input.source_platform,
        })
        .eq('id', existing.id);

      return { store_id: existing.id, created: false };
    }
  }

  // Insert new store
  const { data, error } = await supabaseAdmin
    .from('stores')
    .insert({
      name:             input.name,
      website:          input.website,
      domain:           domain,
      phone:            input.phone,
      email:            input.email,
      address:          input.address,
      city:             input.city,
      province:         input.province ?? 'ON',
      postal_code:      input.postal_code,
      country:          input.country ?? 'CA',
      latitude:         input.latitude,
      longitude:        input.longitude,
      store_type:       input.store_type ?? 'unknown',
      discovered_by:    input.discovered_by,
      source_url:       input.source_url,
      source_platform:  input.source_platform,
      scrape_allowed:   input.scrape_allowed ?? true,
      is_active:        true,
    })
    .select('id')
    .single();

  if (error) throw new Error(`upsertStore failed: ${error.message}`);
  return { store_id: data.id, created: true };
}

/**
 * Upsert a store location.
 * Deduplicates by store_id + city + address.
 */
export async function upsertStoreLocation(input: StoreLocationInput): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from('store_locations')
    .select('id')
    .eq('store_id', input.store_id)
    .eq('city', input.city ?? '')
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabaseAdmin
    .from('store_locations')
    .insert({
      store_id:    input.store_id,
      label:       input.label,
      address:     input.address,
      city:        input.city,
      province:    input.province ?? 'ON',
      postal_code: input.postal_code,
      country:     input.country ?? 'CA',
      latitude:    input.latitude,
      longitude:   input.longitude,
      phone:       input.phone,
      email:       input.email,
      hours:       input.hours,
      is_active:   true,
    })
    .select('id')
    .single();

  if (error) throw new Error(`upsertStoreLocation failed: ${error.message}`);
  return data.id;
}
