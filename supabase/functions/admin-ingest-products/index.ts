/**
 * Supabase Edge Function: admin-ingest-products
 *
 * POST /functions/v1/admin-ingest-products
 *
 * Protected — requires Authorization: Bearer <SERVICE_ROLE_KEY>
 * NEVER call this from the frontend.
 *
 * Body: {
 *   products:     NormalizedFurnitureProduct[]  (pre-normalized)
 *   source_type:  'apify' | 'serpapi' | 'csv' | 'manual'
 *   source_name?: string
 *   target_url?:  string
 * }
 *
 * Returns: IngestionResult
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

  // ── Auth check: must use service role key ─────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const token      = authHeader.replace('Bearer ', '').trim();
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!token || token !== serviceKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status:  401,
    });
  }

  try {
    const body = await req.json();
    const { products = [], source_type = 'manual', source_name, target_url } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return new Response(JSON.stringify({ error: 'products array is required and must not be empty' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status:  400,
      });
    }

    // Use service role for writes
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create scrape job
    const { data: jobData, error: jobError } = await supabase
      .from('scrape_jobs')
      .insert({ source_type, source_name, target_url, status: 'running', started_at: new Date().toISOString() })
      .select('id')
      .single();

    if (jobError) throw jobError;
    const jobId = jobData.id;

    const counts = { found: products.length, inserted: 0, updated: 0, failed: 0 };
    const errors: Array<{ title: string; error: string }> = [];

    for (const product of products) {
      try {
        // Upsert store
        const storeDomain = (product.store?.domain ?? '').replace(/^www\./, '').toLowerCase();
        let storeId: string;

        if (storeDomain) {
          const { data: existingStore } = await supabase
            .from('stores')
            .select('id')
            .eq('normalized_domain', storeDomain)
            .maybeSingle();

          if (existingStore) {
            storeId = existingStore.id;
          } else {
            const { data: newStore, error: storeErr } = await supabase
              .from('stores')
              .insert({
                name:            product.store.name,
                website:         product.store.website,
                domain:          product.store.domain,
                city:            product.store.city,
                province:        product.store.province ?? 'ON',
                country:         product.store.country ?? 'CA',
                store_type:      product.store.store_type ?? 'unknown',
                source_platform: product.store.source_platform,
                is_active:       true,
              })
              .select('id')
              .single();
            if (storeErr) throw storeErr;
            storeId = newStore.id;
          }
        } else {
          // No domain — insert store without dedup
          const { data: newStore, error: storeErr } = await supabase
            .from('stores')
            .insert({
              name:     product.store.name,
              city:     product.store.city,
              province: product.store.province ?? 'ON',
              country:  product.store.country ?? 'CA',
              is_active: true,
            })
            .select('id')
            .single();
          if (storeErr) throw storeErr;
          storeId = newStore.id;
        }

        // Check for existing product
        let existingProductId: string | null = null;
        if (product.canonical_url) {
          const { data: ep } = await supabase
            .from('products')
            .select('id')
            .eq('canonical_url', product.canonical_url)
            .maybeSingle();
          if (ep) existingProductId = ep.id;
        }

        const productRow = {
          store_id:          storeId,
          title:             product.title,
          normalized_title:  product.normalized_title,
          description:       product.description,
          category:          product.category ?? 'unknown',
          brand:             product.brand,
          sku:               product.sku,
          product_url:       product.product_url,
          canonical_url:     product.canonical_url,
          image_url:         product.image_url,
          additional_images: product.additional_images ?? [],
          price:             product.price,
          original_price:    product.original_price,
          currency:          product.currency ?? 'CAD',
          on_sale:           product.on_sale ?? false,
          availability:      product.availability ?? 'unknown',
          condition:         product.condition ?? 'new',
          delivery_info:     product.delivery_info,
          source_platform:   product.source_platform,
          scrape_job_id:     jobId,
          raw_payload:       product.raw_payload ?? {},
          last_seen_at:      new Date().toISOString(),
          is_active:         true,
        };

        let productId: string;
        if (existingProductId) {
          await supabase.from('products').update(productRow).eq('id', existingProductId);
          productId = existingProductId;
          counts.updated++;
        } else {
          const { data: np, error: pe } = await supabase
            .from('products')
            .insert({ ...productRow, first_seen_at: new Date().toISOString() })
            .select('id')
            .single();
          if (pe) throw pe;
          productId = np.id;
          counts.inserted++;
        }

        // Upsert dimensions
        if (product.dimensions) {
          await supabase.from('product_dimensions')
            .upsert({ product_id: productId, ...product.dimensions }, { onConflict: 'product_id' });
        }

        // Upsert attributes
        if (product.attributes) {
          await supabase.from('product_attributes')
            .upsert({ product_id: productId, ...product.attributes }, { onConflict: 'product_id' });
        }

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        counts.failed++;
        errors.push({ title: product.title ?? 'unknown', error: msg });
      }
    }

    // Complete job
    await supabase.from('scrape_jobs').update({
      status:         counts.failed === counts.found ? 'failed' : 'completed',
      finished_at:    new Date().toISOString(),
      total_found:    counts.found,
      total_inserted: counts.inserted,
      total_updated:  counts.updated,
      total_failed:   counts.failed,
    }).eq('id', jobId);

    return new Response(JSON.stringify({ job_id: jobId, ...counts, errors }), {
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
