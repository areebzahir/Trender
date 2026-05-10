/**
 * productCandidateBuilder — converts RoomAnalysis into safe Supabase queries.
 * Gemini never writes SQL. All queries are built here from typed analysis data.
 * SERVER-SIDE ONLY.
 */

import { createClient } from '@supabase/supabase-js';
import type { RoomAnalysis, ProductCandidate } from './types';

const MAX_CANDIDATES = 100;

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !key) throw new Error('Supabase admin credentials not configured.');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Maps Gemini furniture type strings to our DB category enum values. */
function normalizeCategoryForDb(furnitureType: string | null, category: string | null): string[] {
  const candidates: string[] = [];
  const input = [furnitureType, category]
    .filter(Boolean)
    .map(s => s!.toLowerCase());

  const MAP: Record<string, string[]> = {
    sofa:        ['sofa', 'sectional', 'loveseat'],
    couch:       ['sofa', 'sectional', 'loveseat'],
    sectional:   ['sectional', 'sofa'],
    chair:       ['armchair', 'accent_chair', 'office_chair'],
    armchair:    ['armchair', 'accent_chair'],
    desk:        ['desk'],
    table:       ['coffee_table', 'side_table', 'dining_table'],
    'coffee table': ['coffee_table'],
    'side table':   ['side_table'],
    'dining table': ['dining_table'],
    bed:         ['bed_frame', 'mattress'],
    dresser:     ['dresser', 'wardrobe'],
    wardrobe:    ['wardrobe', 'dresser'],
    shelf:       ['bookshelf', 'storage_cabinet'],
    bookshelf:   ['bookshelf'],
    lamp:        ['lighting'],
    lighting:    ['lighting'],
    rug:         ['rug'],
    mirror:      ['mirror'],
    tv:          ['tv_stand', 'media_console'],
    'tv stand':  ['tv_stand', 'media_console'],
  };

  for (const term of input) {
    for (const [key, values] of Object.entries(MAP)) {
      if (term.includes(key)) {
        candidates.push(...values);
      }
    }
  }

  return [...new Set(candidates)];
}

export async function buildProductCandidates(
  analysis: RoomAnalysis,
  budget?: number,
  forcedCategories?: string[]  // hard filter from extractIntent — takes priority
): Promise<ProductCandidate[]> {
  const supabase = getSupabaseAdmin();

  // Use forced categories from intent extraction first, fall back to analysis mapping
  const categories = forcedCategories && forcedCategories.length > 0
    ? forcedCategories
    : normalizeCategoryForDb(
        analysis.requestedItem.furnitureType,
        analysis.requestedItem.category
      );

  console.log('[productCandidateBuilder] Using categories:', categories);

  let query = supabase
    .from('products')
    .select(`
      id, title, description, category, price, currency,
      image_url, product_url, additional_images, is_active,
      stores ( name ),
      product_attributes ( colors, materials, styles, room_types, tags ),
      product_dimensions ( width, height, depth, unit )
    `)
    .eq('is_active', true)
    .not('image_url', 'is', null)
    .limit(MAX_CANDIDATES);

  // Category filter — most important signal
  if (categories.length > 0) {
    query = query.in('category', categories);
  }

  // Budget filter
  if (budget && budget > 0) {
    query = query.lte('price', budget);
  }

  // Dimension constraint — max width
  const { maxWidthCm } = analysis.recommendedProductConstraints;
  // Note: dimension filtering done post-query since it's in a joined table

  const { data, error } = await query;
  if (error) throw new Error(`Product query failed: ${error.message}`);

  const rows = data ?? [];

  return rows.map((p: any): ProductCandidate => {
    const dims = p.product_dimensions;
    const attrs = p.product_attributes;

    // Convert dimensions to cm (DB stores in inches by default)
    const toCm = (val: number | null, unit: string | null): number | null => {
      if (val == null) return null;
      if (unit === 'cm') return val;
      if (unit === 'mm') return val / 10;
      return Math.round(val * 2.54); // inches → cm
    };

    const widthCm  = toCm(dims?.width,  dims?.unit);
    const heightCm = toCm(dims?.height, dims?.unit);
    const depthCm  = toCm(dims?.depth,  dims?.unit);

    return {
      id:            p.id,
      title:         p.title ?? 'Untitled',
      storeName:     p.stores?.name ?? null,
      price:         p.price ?? null,
      currency:      p.currency ?? 'CAD',
      productUrl:    p.product_url ?? '',
      imageUrl:      p.image_url ?? '',
      imageUrls:     [p.image_url, ...(p.additional_images ?? [])].filter(Boolean),
      category:      p.category ?? null,
      furnitureType: p.category ?? null,
      roomType:      attrs?.room_types?.[0] ?? null,
      colors:        attrs?.colors    ?? [],
      materials:     attrs?.materials ?? [],
      styleTags:     attrs?.styles    ?? [],
      aestheticTags: attrs?.tags      ?? [],
      widthCm,
      heightCm,
      depthCm,
      structuredScore: 0, // filled by scorer
      finalScore:      0,
      whySelected:     '',
      renderWarnings:  [],
    };
  }).filter(c => {
    // Reject products too wide for the space
    if (maxWidthCm && c.widthCm && c.widthCm > maxWidthCm) return false;
    // Reject products with no image
    if (!c.imageUrl) return false;
    return true;
  });
}
