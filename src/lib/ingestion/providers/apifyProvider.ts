/**
 * Apify Provider
 *
 * Converts Apify actor result items into NormalizedFurnitureProduct.
 * Supports multiple actor output shapes:
 *   - Google Maps / local business results
 *   - Store website product scraping results
 *   - Marketplace / product listing results
 *
 * To add a new Apify actor:
 *   1. Identify the actor's output schema from Apify console.
 *   2. Add a mapper function below following the existing patterns.
 *   3. Register it in ACTOR_MAPPERS with the actor ID as key.
 *
 * Docs: https://docs.apify.com/api/v2
 */

import { toNormalizedProduct } from '../normalizeProduct';
import type { NormalizedFurnitureProduct, StoreInput } from '../types';

// ─── Actor output shapes ──────────────────────────────────────────────────────

/** Google Maps / Places scraper output (e.g. apify/google-maps-scraper) */
export interface ApifyGoogleMapsItem {
  title?: string;
  name?: string;
  website?: string;
  url?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
  location?: { lat: number; lng: number };
  categoryName?: string;
  [key: string]: unknown;
}

/** Generic product listing scraper output */
export interface ApifyProductItem {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  url?: string;
  productUrl?: string;
  link?: string;
  price?: string | number;
  originalPrice?: string | number;
  currency?: string;
  imageUrl?: string;
  image?: string;
  images?: string[];
  brand?: string;
  sku?: string;
  availability?: string;
  inStock?: boolean;
  category?: string;
  colors?: string | string[];
  materials?: string | string[];
  styles?: string | string[];
  dimensions?: string;
  storeName?: string;
  storeUrl?: string;
  storeCity?: string;
  storeProvince?: string;
  [key: string]: unknown;
}

// ─── Store extraction from Google Maps result ─────────────────────────────────

export function apifyGoogleMapsToStore(item: ApifyGoogleMapsItem): StoreInput {
  return {
    name:            item.title ?? item.name ?? 'Unknown Store',
    website:         item.website ?? item.url,
    domain:          item.website ? undefined : undefined, // extracted in normalizer
    phone:           item.phone,
    address:         item.address,
    city:            item.city,
    province:        item.state ?? 'ON',
    postal_code:     item.postalCode,
    country:         item.countryCode ?? 'CA',
    latitude:        item.location?.lat,
    longitude:       item.location?.lng,
    store_type:      'unknown',
    discovered_by:   'apify_google_maps',
    source_platform: 'apify',
  };
}

// ─── Product extraction from generic product scraper ─────────────────────────

export function apifyProductItemToNormalized(
  item: ApifyProductItem,
  storeOverride?: StoreInput
): NormalizedFurnitureProduct {
  const store: StoreInput = storeOverride ?? {
    name:            item.storeName ?? 'Unknown Store',
    website:         item.storeUrl,
    city:            item.storeCity,
    province:        item.storeProvince ?? 'ON',
    country:         'CA',
    store_type:      'unknown',
    discovered_by:   'apify_product_scraper',
    source_platform: 'apify',
  };

  const productUrl = item.url ?? item.productUrl ?? item.link ?? '';
  const imageUrl   = item.imageUrl ?? item.image ?? (Array.isArray(item.images) ? item.images[0] : undefined);
  const extraImages = Array.isArray(item.images) ? item.images.slice(1) : [];

  return toNormalizedProduct({
    title:             item.title ?? item.name ?? 'Untitled',
    description:       item.description,
    product_url:       productUrl,
    image_url:         imageUrl,
    additional_images: extraImages,
    price:             item.price,
    original_price:    item.originalPrice,
    currency:          item.currency ?? 'CAD',
    brand:             item.brand,
    sku:               item.sku ?? item.id,
    colors:            item.colors,
    materials:         item.materials,
    styles:            item.styles,
    dimensions:        item.dimensions,
    availability:      item.inStock === false ? 'out_of_stock'
                     : item.availability === 'in_stock' ? 'in_stock'
                     : 'unknown',
    source_platform:   'apify',
    store,
    raw_payload:       item as Record<string, unknown>,
  });
}

// ─── Batch processor ─────────────────────────────────────────────────────────

/**
 * Process a batch of Apify actor results.
 *
 * @param items     Raw items from Apify actor run
 * @param actorType 'google_maps' | 'product_scraper'
 * @param storeOverride  Provide a known store to attach all products to
 */
export function processApifyResults(
  items: unknown[],
  actorType: 'google_maps' | 'product_scraper',
  storeOverride?: StoreInput
): NormalizedFurnitureProduct[] {
  const results: NormalizedFurnitureProduct[] = [];

  for (const item of items) {
    try {
      if (actorType === 'product_scraper') {
        results.push(
          apifyProductItemToNormalized(item as ApifyProductItem, storeOverride)
        );
      }
      // google_maps results are stores, not products — handle separately via upsertStore
    } catch (err) {
      console.warn('[apifyProvider] Failed to normalize item:', err);
    }
  }

  return results;
}
