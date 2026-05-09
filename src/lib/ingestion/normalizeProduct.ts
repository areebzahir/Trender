/**
 * Trender — Product Normalization Utilities
 * Converts raw source payloads into clean, consistent NormalizedFurnitureProduct shapes.
 */

import type {
  NormalizedFurnitureProduct,
  ProductCategory,
  ProductAvailability,
  ProductCondition,
  ProductDimensionInput,
  ProductAttributesInput,
  StoreInput,
  SourcePlatform,
} from './types';
import {
  NORMALIZED_COLORS,
  NORMALIZED_MATERIALS,
  NORMALIZED_STYLES,
} from './types';

// ─── Title ────────────────────────────────────────────────────────────────────

export function normalizeTitle(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')   // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── URL ──────────────────────────────────────────────────────────────────────

export function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw.trim());
    // Remove tracking params
    const TRACKING_PARAMS = [
      'utm_source','utm_medium','utm_campaign','utm_content','utm_term',
      'ref','source','fbclid','gclid','msclkid',
    ];
    TRACKING_PARAMS.forEach(p => url.searchParams.delete(p));
    // Remove trailing slash
    return url.toString().replace(/\/$/, '');
  } catch {
    return raw.trim();
  }
}

export function extractDomain(urlOrDomain: string): string {
  try {
    const url = new URL(
      urlOrDomain.startsWith('http') ? urlOrDomain : `https://${urlOrDomain}`
    );
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return urlOrDomain.toLowerCase().replace(/^www\./, '');
  }
}

// ─── Price ────────────────────────────────────────────────────────────────────

/**
 * Parse a price string like "$1,299.00 CAD", "CAD 899", "1299" into a number.
 * Returns null if unparseable.
 */
export function parsePrice(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return isFinite(raw) ? raw : null;
  const cleaned = String(raw).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isFinite(parsed) ? parsed : null;
}

// ─── Dimensions ───────────────────────────────────────────────────────────────

/**
 * Parse dimension strings like:
 *   "104.5\" W x 34.25\" H x 38\" D"
 *   "80 x 75 x 60 cm"
 *   "W: 120cm H: 75cm D: 60cm"
 */
export function parseDimensions(raw: string | null | undefined): ProductDimensionInput | null {
  if (!raw) return null;

  const result: ProductDimensionInput = { raw_dimensions_text: raw };

  // Detect unit
  result.unit = /\bcm\b/i.test(raw) ? 'cm' : /\bmm\b/i.test(raw) ? 'mm' : 'inches';

  // Try "W x H x D" pattern
  const wxhxd = raw.match(
    /(\d+(?:\.\d+)?)["\s]*(?:w|width)[^0-9]*(\d+(?:\.\d+)?)["\s]*(?:h|height)[^0-9]*(\d+(?:\.\d+)?)["\s]*(?:d|depth)/i
  );
  if (wxhxd) {
    result.width  = parseFloat(wxhxd[1]);
    result.height = parseFloat(wxhxd[2]);
    result.depth  = parseFloat(wxhxd[3]);
    return result;
  }

  // Try plain "N x N x N"
  const plain = raw.match(/(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)/);
  if (plain) {
    result.width  = parseFloat(plain[1]);
    result.height = parseFloat(plain[2]);
    result.depth  = parseFloat(plain[3]);
    return result;
  }

  // Try individual labels
  const w = raw.match(/(?:w|width)[:\s]*(\d+(?:\.\d+)?)/i);
  const h = raw.match(/(?:h|height)[:\s]*(\d+(?:\.\d+)?)/i);
  const d = raw.match(/(?:d|depth)[:\s]*(\d+(?:\.\d+)?)/i);
  const l = raw.match(/(?:l|length)[:\s]*(\d+(?:\.\d+)?)/i);
  const sh = raw.match(/(?:seat.?height)[:\s]*(\d+(?:\.\d+)?)/i);

  if (w) result.width       = parseFloat(w[1]);
  if (h) result.height      = parseFloat(h[1]);
  if (d) result.depth       = parseFloat(d[1]);
  if (l) result.length      = parseFloat(l[1]);
  if (sh) result.seat_height = parseFloat(sh[1]);

  return Object.keys(result).length > 2 ? result : null;
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  'gray': 'grey', 'charcoal': 'grey', 'ash': 'grey', 'slate': 'grey',
  'ivory': 'cream', 'off-white': 'cream', 'off white': 'cream', 'snow': 'white',
  'tan': 'beige', 'sand': 'beige', 'taupe': 'beige', 'khaki': 'beige',
  'chocolate': 'brown', 'espresso': 'brown', 'mocha': 'brown', 'coffee': 'brown',
  'midnight': 'navy', 'indigo': 'navy',
  'teal': 'blue', 'turquoise': 'blue', 'aqua': 'blue', 'cobalt': 'blue',
  'sage': 'green', 'olive': 'green', 'forest': 'green', 'emerald': 'green',
  'rust': 'orange', 'terracotta': 'orange', 'amber': 'orange',
  'blush': 'red', 'rose': 'red', 'burgundy': 'red', 'wine': 'red',
  'mustard': 'yellow', 'lemon': 'yellow',
  'brass': 'gold', 'champagne': 'gold',
  'chrome': 'silver', 'nickel': 'silver',
  'natural': 'natural_wood', 'wood': 'natural_wood', 'pine': 'natural_wood',
  'walnut': 'walnut', 'oak': 'oak',
};

export function normalizeColors(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  const input = Array.isArray(raw) ? raw.join(' ') : raw;
  const found = new Set<string>();

  const lower = input.toLowerCase();

  // Check direct normalized colors
  for (const color of NORMALIZED_COLORS) {
    if (lower.includes(color.replace('_', ' ')) || lower.includes(color)) {
      found.add(color);
    }
  }

  // Check alias map
  for (const [alias, normalized] of Object.entries(COLOR_MAP)) {
    if (lower.includes(alias)) {
      found.add(normalized);
    }
  }

  return Array.from(found);
}

// ─── Materials ────────────────────────────────────────────────────────────────

const MATERIAL_MAP: Record<string, string> = {
  'solid wood': 'wood', 'engineered wood': 'wood', 'mdf': 'wood', 'plywood': 'wood',
  'stainless steel': 'metal', 'iron': 'metal', 'steel': 'metal', 'aluminum': 'metal', 'brass': 'metal',
  'tempered glass': 'glass', 'acrylic': 'acrylic',
  'polyester': 'fabric', 'linen': 'fabric', 'cotton': 'fabric', 'wool': 'fabric',
  'boucle': 'fabric', 'bouclé': 'fabric', 'chenille': 'fabric', 'microfiber': 'fabric',
  'genuine leather': 'leather', 'full-grain leather': 'leather', 'aniline leather': 'leather',
  'faux leather': 'faux_leather', 'vegan leather': 'faux_leather', 'pu leather': 'faux_leather',
  'marble': 'marble', 'granite': 'stone', 'concrete': 'stone', 'ceramic': 'stone',
  'rattan': 'rattan', 'wicker': 'rattan', 'cane': 'rattan',
};

export function normalizeMaterials(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  const input = Array.isArray(raw) ? raw.join(' ') : raw;
  const found = new Set<string>();
  const lower = input.toLowerCase();

  for (const mat of NORMALIZED_MATERIALS) {
    if (lower.includes(mat.replace('_', ' ')) || lower.includes(mat)) {
      found.add(mat);
    }
  }
  for (const [alias, normalized] of Object.entries(MATERIAL_MAP)) {
    if (lower.includes(alias)) {
      found.add(normalized);
    }
  }

  return Array.from(found);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLE_MAP: Record<string, string> = {
  'mid-century': 'mid_century', 'mcm': 'mid_century', 'retro': 'mid_century',
  'scandi': 'scandinavian', 'nordic': 'scandinavian', 'hygge': 'scandinavian',
  'boho': 'boho', 'bohemian': 'boho', 'eclectic': 'boho',
  'country': 'farmhouse', 'cottage': 'farmhouse',
  'coastal': 'coastal', 'beach': 'coastal', 'nautical': 'coastal',
  'glam': 'glam', 'hollywood': 'glam',
  'japandi': 'japandi', 'wabi-sabi': 'japandi', 'zen': 'japandi',
  'classic': 'traditional', 'formal': 'traditional',
  'urban': 'industrial', 'loft': 'industrial',
};

export function normalizeStyles(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  const input = Array.isArray(raw) ? raw.join(' ') : raw;
  const found = new Set<string>();
  const lower = input.toLowerCase();

  for (const style of NORMALIZED_STYLES) {
    if (lower.includes(style.replace('_', '-')) || lower.includes(style)) {
      found.add(style);
    }
  }
  for (const [alias, normalized] of Object.entries(STYLE_MAP)) {
    if (lower.includes(alias)) {
      found.add(normalized);
    }
  }

  return Array.from(found);
}

// ─── Category inference ───────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Array<[ProductCategory, string[]]> = [
  ['sectional',       ['sectional', 'l-shape', 'l shape', 'modular sofa']],
  ['sofa',            ['sofa', 'couch', 'chesterfield']],
  ['loveseat',        ['loveseat', 'love seat', 'two-seater', '2-seater']],
  ['armchair',        ['armchair', 'arm chair', 'lounge chair', 'club chair']],
  ['accent_chair',    ['accent chair', 'occasional chair', 'side chair']],
  ['coffee_table',    ['coffee table', 'cocktail table']],
  ['side_table',      ['side table', 'end table', 'nightstand', 'bedside']],
  ['dining_table',    ['dining table', 'kitchen table', 'dinner table']],
  ['dining_chair',    ['dining chair', 'kitchen chair']],
  ['bed_frame',       ['bed frame', 'bedframe', 'platform bed', 'headboard']],
  ['mattress',        ['mattress', 'memory foam', 'box spring']],
  ['nightstand',      ['nightstand', 'night stand', 'bedside table']],
  ['dresser',         ['dresser', 'chest of drawers', 'bureau']],
  ['wardrobe',        ['wardrobe', 'armoire', 'closet']],
  ['tv_stand',        ['tv stand', 'tv unit', 'television stand', 'media stand']],
  ['media_console',   ['media console', 'entertainment unit', 'entertainment center']],
  ['desk',            ['desk', 'writing table', 'computer desk', 'work desk']],
  ['office_chair',    ['office chair', 'task chair', 'ergonomic chair']],
  ['bookshelf',       ['bookshelf', 'bookcase', 'shelving unit', 'shelf']],
  ['storage_cabinet', ['cabinet', 'sideboard', 'buffet', 'credenza', 'storage']],
  ['rug',             ['rug', 'carpet', 'area rug']],
  ['lighting',        ['lamp', 'light', 'chandelier', 'pendant', 'sconce', 'floor lamp']],
  ['mirror',          ['mirror']],
  ['decor',           ['vase', 'pillow', 'throw', 'artwork', 'decor', 'decoration']],
];

export function inferCategory(title: string, description?: string): ProductCategory {
  const text = `${title} ${description ?? ''}`.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some(kw => text.includes(kw))) return category;
  }
  return 'unknown';
}

// ─── Room type inference ──────────────────────────────────────────────────────

export function inferRoomTypes(category: ProductCategory, title: string): string[] {
  const rooms: string[] = [];
  const ROOM_MAP: Partial<Record<ProductCategory, string[]>> = {
    sofa:            ['living_room'],
    sectional:       ['living_room'],
    loveseat:        ['living_room'],
    armchair:        ['living_room', 'bedroom'],
    accent_chair:    ['living_room', 'bedroom', 'office'],
    coffee_table:    ['living_room'],
    side_table:      ['living_room', 'bedroom'],
    dining_table:    ['dining_room'],
    dining_chair:    ['dining_room'],
    bed_frame:       ['bedroom'],
    mattress:        ['bedroom'],
    nightstand:      ['bedroom'],
    dresser:         ['bedroom'],
    wardrobe:        ['bedroom'],
    tv_stand:        ['living_room', 'bedroom'],
    media_console:   ['living_room'],
    desk:            ['office'],
    office_chair:    ['office'],
    bookshelf:       ['living_room', 'office', 'bedroom'],
    storage_cabinet: ['living_room', 'dining_room', 'office'],
    rug:             ['living_room', 'bedroom', 'dining_room'],
    lighting:        ['living_room', 'bedroom', 'dining_room', 'office'],
    mirror:          ['bedroom', 'entryway', 'living_room'],
    decor:           ['living_room', 'bedroom', 'dining_room'],
  };
  return ROOM_MAP[category] ?? [];
}

// ─── Main converter ───────────────────────────────────────────────────────────

/**
 * Convert any raw source payload into a NormalizedFurnitureProduct.
 * Providers call this after mapping their raw fields to the intermediate shape.
 */
export function toNormalizedProduct(
  raw: {
    title: string;
    description?: string;
    product_url: string;
    image_url?: string;
    additional_images?: string[];
    price?: string | number | null;
    original_price?: string | number | null;
    currency?: string;
    brand?: string;
    sku?: string;
    category?: string;
    colors?: string | string[];
    materials?: string | string[];
    styles?: string | string[];
    dimensions?: string | ProductDimensionInput;
    availability?: string;
    condition?: string;
    delivery_info?: string;
    pickup_available?: boolean;
    source_platform: SourcePlatform;
    store: StoreInput;
    raw_payload: Record<string, unknown>;
  }
): NormalizedFurnitureProduct {
  const title = raw.title?.trim() ?? 'Untitled Product';
  const category = inferCategory(title, raw.description);
  const colors = normalizeColors(raw.colors);
  const materials = normalizeMaterials(raw.materials ?? raw.description);
  const styles = normalizeStyles(raw.styles ?? raw.description);
  const roomTypes = inferRoomTypes(category, title);

  const dimensions: ProductDimensionInput | undefined =
    typeof raw.dimensions === 'string'
      ? parseDimensions(raw.dimensions) ?? undefined
      : raw.dimensions;

  const price = parsePrice(raw.price);
  const originalPrice = parsePrice(raw.original_price);

  return {
    store: {
      ...raw.store,
      domain: raw.store.domain ?? extractDomain(raw.store.website ?? raw.product_url),
    },
    title,
    normalized_title: normalizeTitle(title),
    description: raw.description,
    category,
    brand: raw.brand,
    sku: raw.sku,
    product_url: raw.product_url,
    canonical_url: normalizeUrl(raw.product_url),
    image_url: raw.image_url,
    additional_images: raw.additional_images,
    price: price ?? undefined,
    original_price: originalPrice ?? undefined,
    currency: raw.currency ?? 'CAD',
    on_sale: !!(originalPrice && price && price < originalPrice),
    availability: (raw.availability as ProductAvailability) ?? 'unknown',
    condition: (raw.condition as ProductCondition) ?? 'new',
    delivery_info: raw.delivery_info,
    pickup_available: raw.pickup_available,
    dimensions,
    attributes: {
      colors,
      materials,
      styles,
      room_types: roomTypes,
      extracted_by: 'rule_based',
    },
    source_platform: raw.source_platform,
    raw_payload: raw.raw_payload,
  };
}
