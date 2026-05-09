/**
 * Supabase Edge Function: search-products
 *
 * GET /functions/v1/search-products
 *
 * Query params:
 *   q           - free text search
 *   category    - product category
 *   city        - store city
 *   province    - store province (default: ON)
 *   min_price   - minimum price
 *   max_price   - maximum price
 *   colors      - comma-separated colors
 *   materials   - comma-separated materials
 *   styles      - comma-separated styles
 *   room_type   - room type filter
 *   limit       - max results (default 20, max 100)
 *   offset      - pagination offset
 *
 * Returns: ProductSearchResult[]
 *
 * Uses anon key — public read only (RLS enforces is_active = true).
 * Service role key is NOT used here.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url    = new URL(req.url);
    const params = url.searchParams;

    const q          = params.get('q')         ?? '';
    const category   = params.get('category')  ?? '';
    const city       = params.get('city')       ?? '';
    const province   = params.get('province')  ?? '';
    const minPrice   = params.get('min_price') ? parseFloat(params.get('min_price')!) : null;
    const maxPrice   = params.get('max_price') ? parseFloat(params.get('max_price')!) : null;
    const colors     = params.get('colors')?.split(',').filter(Boolean)    ?? [];
    const materials  = params.get('materials')?.split(',').filter(Boolean) ?? [];
    const styles     = params.get('styles')?.split(',').filter(Boolean)    ?? [];
    const roomType   = params.get('room_type') ?? '';
    const limit      = Math.min(parseInt(params.get('limit')  ?? '20'), 100);
    const offset     = parseInt(params.get('offset') ?? '0');

    // Use anon key — public read, RLS enforced
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Build query joining products → stores → product_attributes
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
        stores!inner ( name, city, province ),
        product_attributes ( colors, materials, styles, room_types )
      `)
      .eq('is_active', true)
      .range(offset, offset + limit - 1)
      .order('price', { ascending: true });

    // Filters
    if (category)  query = query.eq('category', category);
    if (minPrice)  query = query.gte('price', minPrice);
    if (maxPrice)  query = query.lte('price', maxPrice);
    if (city)      query = query.eq('stores.city', city);
    if (province)  query = query.eq('stores.province', province);

    // Full-text search on title + description
    if (q) {
      query = query.textSearch('title', q, { type: 'websearch', config: 'english' });
    }

    // Array filters (colors, materials, styles, room_type)
    if (colors.length > 0) {
      query = query.overlaps('product_attributes.colors', colors);
    }
    if (materials.length > 0) {
      query = query.overlaps('product_attributes.materials', materials);
    }
    if (styles.length > 0) {
      query = query.overlaps('product_attributes.styles', styles);
    }
    if (roomType) {
      query = query.contains('product_attributes.room_types', [roomType]);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Shape the response
    const results = (data ?? []).map((row: any) => ({
      id:           row.id,
      title:        row.title,
      price:        row.price,
      currency:     row.currency,
      image_url:    row.image_url,
      product_url:  row.product_url,
      category:     row.category,
      availability: row.availability,
      on_sale:      row.on_sale,
      store_name:   row.stores?.name   ?? null,
      city:         row.stores?.city   ?? null,
      province:     row.stores?.province ?? null,
      colors:       row.product_attributes?.colors    ?? [],
      materials:    row.product_attributes?.materials ?? [],
      styles:       row.product_attributes?.styles    ?? [],
    }));

    return new Response(JSON.stringify({ data: results, count: results.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status:  200,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status:  500,
    });
  }
});
