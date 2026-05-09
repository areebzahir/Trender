/**
 * Supabase Edge Function: search-stores
 *
 * GET /functions/v1/search-stores
 *
 * Query params:
 *   city        - filter by city
 *   province    - filter by province
 *   store_type  - local_shop | chain | marketplace | manufacturer
 *   limit       - max results (default 20)
 *   offset      - pagination offset
 *
 * Public read — uses anon key, RLS enforces is_active = true.
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

    const city       = params.get('city')       ?? '';
    const province   = params.get('province')   ?? '';
    const storeType  = params.get('store_type') ?? '';
    const limit      = Math.min(parseInt(params.get('limit')  ?? '20'), 100);
    const offset     = parseInt(params.get('offset') ?? '0');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    let query = supabase
      .from('stores')
      .select('id, name, website, city, province, store_type, phone, address')
      .eq('is_active', true)
      .range(offset, offset + limit - 1)
      .order('name', { ascending: true });

    if (city)      query = query.ilike('city', `%${city}%`);
    if (province)  query = query.eq('province', province);
    if (storeType) query = query.eq('store_type', storeType);

    const { data, error } = await query;
    if (error) throw error;

    return new Response(JSON.stringify({ data: data ?? [], count: (data ?? []).length }), {
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
