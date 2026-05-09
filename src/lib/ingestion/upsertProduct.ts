/**
 * Upsert a normalized product and its related rows into Supabase.
 * Uses service role client — backend only.
 *
 * Deduplication priority:
 *   1. canonical_url (strongest signal)
 *   2. store_id + sku
 *   3. store_id + normalized_title + price (fallback)
 */
import { supabaseAdmin } from './supabaseAdmin';
import type { NormalizedFurnitureProduct } from './types';

export type UpsertProductResult =
  | { status: 'inserted'; product_id: string }
  | { status: 'updated';  product_id: string }
  | { status: 'skipped';  product_id: string; reason: string }
  | { status: 'failed';   error: string };

export async function upsertProduct(
  product: NormalizedFurnitureProduct,
  store_id: string,
  scrape_job_id?: string
): Promise<UpsertProductResult> {
  try {
    // ── 1. Find existing product ──────────────────────────────────────────────
    let existingId: string | null = null;

    // By canonical URL
    if (product.canonical_url) {
      const { data } = await supabaseAdmin
        .from('products')
        .select('id, price')
        .eq('canonical_url', product.canonical_url)
        .maybeSingle();
      if (data) existingId = data.id;
    }

    // By store + SKU
    if (!existingId && store_id && product.sku) {
      const { data } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('store_id', store_id)
        .eq('sku', product.sku)
        .maybeSingle();
      if (data) existingId = data.id;
    }

    // By store + normalized title + price (fuzzy fallback)
    if (!existingId && store_id && product.normalized_title && product.price) {
      const { data } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('store_id', store_id)
        .eq('normalized_title', product.normalized_title)
        .eq('price', product.price)
        .maybeSingle();
      if (data) existingId = data.id;
    }

    const now = new Date().toISOString();

    // ── 2. Build product row ──────────────────────────────────────────────────
    const productRow = {
      store_id,
      title:                product.title,
      normalized_title:     product.normalized_title,
      description:          product.description,
      category:             product.category,
      subcategory:          product.subcategory,
      brand:                product.brand,
      sku:                  product.sku,
      model_number:         product.sku,
      product_url:          product.product_url,
      canonical_url:        product.canonical_url,
      image_url:            product.image_url,
      additional_images:    product.additional_images ?? [],
      price:                product.price,
      original_price:       product.original_price,
      currency:             product.currency,
      on_sale:              product.on_sale,
      availability:         product.availability,
      condition:            product.condition,
      delivery_info:        product.delivery_info,
      pickup_available:     product.pickup_available,
      location_availability: product.attributes.room_types ?? [],
      source_platform:      product.source_platform,
      scrape_job_id:        scrape_job_id ?? null,
      raw_payload:          product.raw_payload,
      last_seen_at:         now,
      last_price_seen_at:   product.price ? now : null,
      is_active:            true,
    };

    let productId: string;
    let status: 'inserted' | 'updated';

    if (existingId) {
      // Update
      const { error } = await supabaseAdmin
        .from('products')
        .update(productRow)
        .eq('id', existingId);
      if (error) throw error;
      productId = existingId;
      status = 'updated';
    } else {
      // Insert
      const { data, error } = await supabaseAdmin
        .from('products')
        .insert({ ...productRow, first_seen_at: now })
        .select('id')
        .single();
      if (error) throw error;
      productId = data.id;
      status = 'inserted';
    }

    // ── 3. Upsert dimensions ──────────────────────────────────────────────────
    if (product.dimensions) {
      await supabaseAdmin
        .from('product_dimensions')
        .upsert(
          { product_id: productId, ...product.dimensions },
          { onConflict: 'product_id' }
        );
    }

    // ── 4. Upsert attributes ──────────────────────────────────────────────────
    if (product.attributes) {
      await supabaseAdmin
        .from('product_attributes')
        .upsert(
          { product_id: productId, ...product.attributes },
          { onConflict: 'product_id' }
        );
    }

    // ── 5. Embedding placeholder ──────────────────────────────────────────────
    // Build the source text that will be embedded later.
    // Actual embedding generation requires OpenAI/Gemini API — connect in generateEmbeddings.ts
    const embeddingSourceText = [
      product.title,
      product.description ?? '',
      product.category,
      product.brand ?? '',
      (product.attributes.colors ?? []).join(' '),
      (product.attributes.materials ?? []).join(' '),
      (product.attributes.styles ?? []).join(' '),
      product.store.name,
      product.store.city ?? '',
      product.store.province ?? 'ON',
    ].join(' ').trim();

    // Only insert placeholder if no embedding exists yet
    const { data: existingEmb } = await supabaseAdmin
      .from('product_embeddings')
      .select('id')
      .eq('product_id', productId)
      .maybeSingle();

    if (!existingEmb) {
      await supabaseAdmin
        .from('product_embeddings')
        .insert({
          product_id:  productId,
          source_text: embeddingSourceText,
          embedding:   null,   // populated later by generateEmbeddings.ts
          model:       'pending',
        });
    } else {
      // Update source text so it can be re-embedded if product changed
      await supabaseAdmin
        .from('product_embeddings')
        .update({ source_text: embeddingSourceText })
        .eq('product_id', productId);
    }

    return { status, product_id: productId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: 'failed', error: msg };
  }
}
