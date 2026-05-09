/**
 * Trender Ingestion Layer — TypeScript Types
 * These types mirror the Supabase schema exactly.
 * Used by all ingestion providers and upsert utilities.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type StoreType = 'local_shop' | 'chain' | 'marketplace' | 'manufacturer' | 'unknown';
export type SourcePlatform = 'apify' | 'serpapi' | 'custom_crawler' | 'csv' | 'manual';
export type ProductCategory =
  | 'sofa' | 'sectional' | 'loveseat' | 'armchair' | 'accent_chair'
  | 'coffee_table' | 'side_table' | 'dining_table' | 'dining_chair'
  | 'bed_frame' | 'mattress' | 'nightstand' | 'dresser' | 'wardrobe'
  | 'tv_stand' | 'media_console' | 'desk' | 'office_chair' | 'bookshelf'
  | 'storage_cabinet' | 'rug' | 'lighting' | 'mirror' | 'decor' | 'unknown';

export type ProductCondition = 'new' | 'used' | 'open_box' | 'unknown';
export type ProductAvailability = 'in_stock' | 'out_of_stock' | 'limited' | 'unknown';
export type ScrapeJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ScrapeItemStatus = 'pending' | 'inserted' | 'updated' | 'skipped' | 'failed';
export type DimensionUnit = 'inches' | 'cm' | 'mm';

// ─── Normalized colors, materials, styles ─────────────────────────────────────

export const NORMALIZED_COLORS = [
  'white', 'black', 'grey', 'beige', 'brown', 'cream', 'navy',
  'blue', 'green', 'red', 'orange', 'yellow', 'gold', 'silver',
  'natural_wood', 'walnut', 'oak',
] as const;
export type NormalizedColor = typeof NORMALIZED_COLORS[number];

export const NORMALIZED_MATERIALS = [
  'wood', 'oak', 'walnut', 'metal', 'glass', 'fabric', 'velvet',
  'leather', 'faux_leather', 'marble', 'stone', 'rattan', 'plastic', 'acrylic',
] as const;
export type NormalizedMaterial = typeof NORMALIZED_MATERIALS[number];

export const NORMALIZED_STYLES = [
  'modern', 'minimalist', 'luxury', 'japandi', 'scandinavian', 'mid_century',
  'industrial', 'farmhouse', 'traditional', 'contemporary', 'boho',
  'rustic', 'coastal', 'glam', 'unknown',
] as const;
export type NormalizedStyle = typeof NORMALIZED_STYLES[number];

// ─── Input types (what providers produce) ─────────────────────────────────────

export interface StoreInput {
  name: string;
  website?: string;
  domain?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  store_type?: StoreType;
  discovered_by?: string;
  source_url?: string;
  source_platform?: SourcePlatform;
  scrape_allowed?: boolean;
}

export interface StoreLocationInput {
  store_id: string;
  label?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  hours?: Record<string, string>;
}

export interface ProductDimensionInput {
  width?: number;
  height?: number;
  depth?: number;
  length?: number;
  seat_height?: number;
  weight?: number;
  unit?: DimensionUnit;
  raw_dimensions_text?: string;
}

export interface ProductAttributesInput {
  colors?: string[];
  materials?: string[];
  styles?: string[];
  room_types?: string[];
  tags?: string[];
  color_confidence?: number;
  material_confidence?: number;
  style_confidence?: number;
  extracted_by?: string;
}

export interface ProductInput {
  store_id?: string;
  title: string;
  description?: string;
  category?: ProductCategory;
  subcategory?: string;
  brand?: string;
  sku?: string;
  model_number?: string;
  product_url?: string;
  image_url?: string;
  additional_images?: string[];
  price?: number;
  original_price?: number;
  currency?: string;
  on_sale?: boolean;
  availability?: ProductAvailability;
  condition?: ProductCondition;
  delivery_info?: string;
  pickup_available?: boolean;
  location_availability?: string[];
  source_platform?: SourcePlatform;
  scrape_job_id?: string;
  raw_payload?: Record<string, unknown>;
  dimensions?: ProductDimensionInput;
  attributes?: ProductAttributesInput;
}

export interface ScrapeJobInput {
  source_type: SourcePlatform;
  source_name?: string;
  target_url?: string;
  raw_config?: Record<string, unknown>;
}

// ─── Normalized product (canonical shape after normalization) ─────────────────

export interface NormalizedFurnitureProduct {
  // store
  store: StoreInput;
  // product core
  title: string;
  normalized_title: string;
  description?: string;
  category: ProductCategory;
  subcategory?: string;
  brand?: string;
  sku?: string;
  product_url: string;
  canonical_url: string;
  image_url?: string;
  additional_images?: string[];
  // pricing
  price?: number;
  original_price?: number;
  currency: string;
  on_sale: boolean;
  // availability
  availability: ProductAvailability;
  condition: ProductCondition;
  delivery_info?: string;
  pickup_available?: boolean;
  // attributes
  dimensions?: ProductDimensionInput;
  attributes: ProductAttributesInput;
  // ingestion metadata
  source_platform: SourcePlatform;
  raw_payload: Record<string, unknown>;
}

// ─── Search result shape (returned to frontend) ───────────────────────────────

export interface ProductSearchResult {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  image_url: string | null;
  product_url: string | null;
  category: string;
  store_name: string | null;
  city: string | null;
  province: string | null;
  colors: string[] | null;
  materials: string[] | null;
  styles: string[] | null;
  availability: string;
  on_sale: boolean;
}
