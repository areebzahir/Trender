/**
 * Furniture Search Service — FRONTEND
 *
 * Queries active products and stores from Supabase using the public anon key.
 * RLS ensures only is_active = true rows are returned.
 * The service role key is NEVER used here.
 */

import { supabase } from '@/lib/supabaseClient';
import type { ProductSearchResult } from '@/lib/ingestion/types';

export interface ProductSearchParams {
  q?:          string;
  category?:   string;
  city?:       string;
  province?:   string;
  min_price?:  number;
  max_price?:  number;
  colors?:     string[];
  materials?:  string[];
  styles?:     string[];
  room_type?:  string;
  limit?:      number;
  offset?:     number;
}

export interface StoreSearchParams {
  city?:       string;
  province?:   string;
  store_type?: string;
  limit?:      number;
  offset?:     number;
}

/**
 * Search active furniture products.
 * Joins products → stores → product_attributes.
 */
export async function searchProducts(
  params: ProductSearchParams = {}
): Promise<ProductSearchResult[]> {
  const {
    q, category, city, province,
    min_price, max_price,
    colors = [], materials = [], styles = [], room_type,
    limit = 20, offset = 0,
  } = params;

  let query = supabase
    .from('products')
    .select(`
      id,
      title,
      price,
      currency,
      image_url,
      product_url,
      category,
      availability,
      on_sale,
      stores ( name, city, province ),
      product_attributes ( colors, materials, styles, room_types )
    `)
    .eq('is_active', true)
    .range(offset, offset + Math.min(limit, 100) - 1)
    .order('price', { ascending: true });

  if (category)  query = query.eq('category', category);
  if (min_price) query = query.gte('price', min_price);
  if (max_price) query = query.lte('price', max_price);

  // Full-text search
  if (q) {
    query = query.textSearch('title', q, { type: 'websearch', config: 'english' });
  }

  const { data, error } = await query;
  if (error) throw new Error(`searchProducts failed: ${error.message}`);

  let results: ProductSearchResult[] = (data ?? []).map((row: any) => ({
    id:           row.id,
    title:        row.title,
    price:        row.price,
    currency:     row.currency ?? 'CAD',
    image_url:    row.image_url,
    product_url:  row.product_url,
    category:     row.category,
    availability: row.availability,
    on_sale:      row.on_sale ?? false,
    store_name:   row.stores?.name     ?? null,
    city:         row.stores?.city     ?? null,
    province:     row.stores?.province ?? null,
    colors:       row.product_attributes?.colors    ?? [],
    materials:    row.product_attributes?.materials ?? [],
    styles:       row.product_attributes?.styles    ?? [],
  }));

  // Client-side array filters (Supabase JS v2 doesn't support nested table array overlap in one query)
  if (city)             results = results.filter(r => r.city?.toLowerCase().includes(city.toLowerCase()));
  if (province)         results = results.filter(r => r.province === province);
  if (colors.length)    results = results.filter(r => colors.some(c => r.colors?.includes(c)));
  if (materials.length) results = results.filter(r => materials.some(m => r.materials?.includes(m)));
  if (styles.length)    results = results.filter(r => styles.some(s => r.styles?.includes(s)));

  return results;
}

/**
 * Search active stores.
 */
export async function searchStores(params: StoreSearchParams = {}) {
  const { city, province, store_type, limit = 20, offset = 0 } = params;

  let query = supabase
    .from('stores')
    .select('id, name, website, city, province, store_type, phone, address')
    .eq('is_active', true)
    .range(offset, offset + Math.min(limit, 100) - 1)
    .order('name', { ascending: true });

  if (city)       query = query.ilike('city', `%${city}%`);
  if (province)   query = query.eq('province', province);
  if (store_type) query = query.eq('store_type', store_type);

  const { data, error } = await query;
  if (error) throw new Error(`searchStores failed: ${error.message}`);
  return data ?? [];
}
