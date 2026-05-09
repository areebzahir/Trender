/**
 * SerpApi Google Shopping Provider
 *
 * Normalizes Google Shopping results from SerpApi into NormalizedFurnitureProduct.
 *
 * SerpApi docs: https://serpapi.com/google-shopping-api
 * Relevant fields: title, source, price, extracted_price, link, thumbnail,
 *                  rating, reviews, delivery, product_id, extensions
 *
 * To use:
 *   const results = await fetch(`https://serpapi.com/search?engine=google_shopping&q=sofa+ontario&api_key=KEY`)
 *   const normalized = processSerpApiShoppingResults(results.shopping_results, 'Toronto', 'ON')
 */

import { toNormalizedProduct, parsePrice } from '../normalizeProduct';
import type { NormalizedFurnitureProduct, StoreInput } from '../types';

// ─── SerpApi Shopping result shape ───────────────────────────────────────────

export interface SerpApiShoppingItem {
  position?:        number;
  title?:           string;
  link?:            string;
  product_link?:    string;
  source?:          string;           // store name
  price?:           string;           // "$1,299.00"
  extracted_price?: number;
  old_price?:       string;
  extracted_old_price?: number;
  currency?:        string;
  thumbnail?:       string;
  rating?:          number;
  reviews?:         number;
  delivery?:        string;
  product_id?:      string;
  extensions?:      string[];         // e.g. ["Free delivery", "In stock"]
  store_name?:      string;
  [key: string]: unknown;
}

export interface SerpApiShoppingResponse {
  shopping_results?: SerpApiShoppingItem[];
  search_metadata?:  { query?: string; [key: string]: unknown };
  [key: string]: unknown;
}

// ─── Single item normalizer ───────────────────────────────────────────────────

export function serpApiItemToNormalized(
  item: SerpApiShoppingItem,
  defaultCity?: string,
  defaultProvince?: string
): NormalizedFurnitureProduct {
  const storeName = item.source ?? item.store_name ?? 'Unknown Store';
  const price     = item.extracted_price ?? parsePrice(item.price) ?? undefined;
  const origPrice = item.extracted_old_price ?? parsePrice(item.old_price) ?? undefined;

  // Parse delivery/availability from extensions
  const extensions = item.extensions ?? [];
  const extText    = extensions.join(' ').toLowerCase();
  const inStock    = extText.includes('in stock') || extText.includes('available');
  const outOfStock = extText.includes('out of stock') || extText.includes('unavailable');
  const availability = outOfStock ? 'out_of_stock' : inStock ? 'in_stock' : 'unknown';

  const store: StoreInput = {
    name:            storeName,
    city:            defaultCity,
    province:        defaultProvince ?? 'ON',
    country:         'CA',
    store_type:      'unknown',
    discovered_by:   'serpapi_shopping',
    source_platform: 'serpapi',
  };

  return toNormalizedProduct({
    title:           item.title ?? 'Untitled',
    product_url:     item.link ?? item.product_link ?? '',
    image_url:       item.thumbnail,
    price,
    original_price:  origPrice,
    currency:        item.currency ?? 'CAD',
    availability,
    delivery_info:   item.delivery,
    source_platform: 'serpapi',
    store,
    raw_payload:     item as Record<string, unknown>,
  });
}

// ─── Batch processor ─────────────────────────────────────────────────────────

/**
 * Process a full SerpApi shopping response.
 *
 * @param response       Raw SerpApi JSON response
 * @param defaultCity    City context for the search (e.g. "Toronto")
 * @param defaultProvince Province context (default "ON")
 */
export function processSerpApiShoppingResults(
  response: SerpApiShoppingResponse,
  defaultCity?: string,
  defaultProvince = 'ON'
): NormalizedFurnitureProduct[] {
  const items = response.shopping_results ?? [];
  const results: NormalizedFurnitureProduct[] = [];

  for (const item of items) {
    try {
      results.push(serpApiItemToNormalized(item, defaultCity, defaultProvince));
    } catch (err) {
      console.warn('[serpApiShoppingProvider] Failed to normalize item:', err);
    }
  }

  return results;
}
