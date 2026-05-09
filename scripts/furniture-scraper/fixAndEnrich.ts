#!/usr/bin/env tsx
/**
 * Fix & Enrich existing products in Supabase:
 * 1. Re-infer category for products stuck on 'unknown'
 * 2. Re-infer and upsert product_attributes (colors, materials, styles, room_types)
 * 3. Parse dimensions from descriptions where missing
 * 4. Fix on_sale flag where original_price > price
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { inferCategory, inferRoomTypes, normalizeColors, normalizeMaterials, normalizeStyles } from '../../src/lib/ingestion/normalizeProduct';
import { parseDimensions } from './normalize/parseDimensions';
import { chunk } from './utils/chunk';
import { logger } from './logger';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function fixCategories() {
  logger.section('Step 1: Fix unknown categories');
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, description, category, subcategory, raw_payload')
    .eq('category', 'unknown')
    .limit(2000);

  if (error || !products) { logger.error('Failed to fetch: ' + error?.message); return; }
  logger.info(`Found ${products.length} products with unknown category`);

  let fixed = 0;
  for (const p of products) {
    // Try title + description first
    let inferred = inferCategory(p.title, p.description ?? '');

    // If still unknown, try product_type from raw_payload (Shopify)
    if (inferred === 'unknown') {
      const productType: string = (p.raw_payload as any)?.product_type ?? '';
      const tags: string[] = (p.raw_payload as any)?.tags ?? [];
      const combined = `${p.title} ${productType} ${tags.join(' ')}`;
      inferred = inferCategory(combined, '');
    }

    // Map Bouclair/Shopify product_type strings directly
    if (inferred === 'unknown') {
      const productType: string = ((p.raw_payload as any)?.product_type ?? '').toLowerCase();
      if (productType.includes('rug') || productType.includes('carpet')) inferred = 'rug';
      else if (productType.includes('light') || productType.includes('lamp') || productType.includes('chandelier')) inferred = 'lighting';
      else if (productType.includes('mirror')) inferred = 'mirror';
      else if (productType.includes('pillow') || productType.includes('throw') || productType.includes('vase') || productType.includes('decor') || productType.includes('art') || productType.includes('candle') || productType.includes('frame')) inferred = 'decor';
      else if (productType.includes('storage') || productType.includes('cabinet') || productType.includes('shelf') || productType.includes('shelv')) inferred = 'storage_cabinet';
      else if (productType.includes('bed') || productType.includes('duvet') || productType.includes('sheet')) inferred = 'bed_frame';
      else if (productType.includes('curtain') || productType.includes('blind') || productType.includes('drape')) inferred = 'decor';
      else if (productType.includes('outdoor') || productType.includes('patio')) inferred = 'decor';
    }

    if (inferred !== 'unknown') {
      await supabase.from('products').update({ category: inferred }).eq('id', p.id);
      fixed++;
    }
  }
  logger.success(`Fixed ${fixed} / ${products.length} categories`);
}

async function enrichAttributes() {
  logger.section('Step 2: Enrich product_attributes');
  // Get all products that have attributes but may be missing colors/materials
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, description, category, brand, raw_payload')
    .limit(3000);

  if (error || !products) { logger.error('Failed: ' + error?.message); return; }
  logger.info(`Enriching attributes for ${products.length} products`);

  let enriched = 0;
  const batches = chunk(products, 100);
  for (const batch of batches) {
    for (const p of batch) {
      const text = `${p.title} ${p.description ?? ''} ${p.brand ?? ''}`;
      const colors = normalizeColors(text);
      const materials = normalizeMaterials(text);
      const styles = normalizeStyles(text);
      const category = inferCategory(p.title, p.description ?? '');
      const roomTypes = inferRoomTypes(category, p.title);

      // Extract tags from raw_payload if available
      const rawTags: string[] = (p.raw_payload as any)?.tags ?? [];
      const productType: string = (p.raw_payload as any)?.product_type ?? '';
      const tags = [...rawTags, productType].filter(Boolean);

      await supabase.from('product_attributes').upsert({
        product_id: p.id,
        colors: colors.length ? colors : undefined,
        materials: materials.length ? materials : undefined,
        styles: styles.length ? styles : undefined,
        room_types: roomTypes.length ? roomTypes : undefined,
        tags: tags.length ? tags : undefined,
        extracted_by: 'rule_based',
      }, { onConflict: 'product_id' });
      enriched++;
    }
  }
  logger.success(`Enriched ${enriched} product attributes`);
}

async function enrichDimensions() {
  logger.section('Step 3: Extract dimensions from descriptions');
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, description, raw_payload')
    .limit(3000);

  if (error || !products) { logger.error('Failed: ' + error?.message); return; }

  // Only process products that don't already have dimensions
  const { data: existingDims } = await supabase
    .from('product_dimensions')
    .select('product_id');
  const existingSet = new Set((existingDims ?? []).map((d: any) => d.product_id));

  const toProcess = products.filter(p => !existingSet.has(p.id));
  logger.info(`Processing dimensions for ${toProcess.length} products`);

  let added = 0;
  for (const p of toProcess) {
    // Try to find dimension text in description or raw_payload
    const desc = p.description ?? '';
    const rawMeasurements = (p.raw_payload as any)?.measurements?.metric
      || (p.raw_payload as any)?.measurements?.imperial
      || (p.raw_payload as any)?.dimensions
      || '';

    const dimText = rawMeasurements || extractDimText(desc);
    if (!dimText) continue;

    const parsed = parseDimensions(dimText);
    if (!parsed || (!parsed.width && !parsed.height && !parsed.depth)) continue;

    await supabase.from('product_dimensions').upsert({
      product_id: p.id,
      width: parsed.width,
      height: parsed.height,
      depth: parsed.depth,
      length: parsed.length,
      seat_height: parsed.seat_height,
      weight: parsed.weight,
      unit: parsed.unit,
      raw_dimensions_text: parsed.raw_dimensions_text,
    }, { onConflict: 'product_id' });
    added++;
  }
  logger.success(`Added dimensions for ${added} products`);
}

async function fixOnSaleFlag() {
  logger.section('Step 4: Fix on_sale flags');
  const { data: products } = await supabase
    .from('products')
    .select('id, price, original_price, on_sale')
    .not('original_price', 'is', null)
    .limit(3000);

  let fixed = 0;
  for (const p of products ?? []) {
    const shouldBeSale = p.original_price && p.price && p.original_price > p.price;
    if (shouldBeSale !== p.on_sale) {
      await supabase.from('products').update({ on_sale: !!shouldBeSale }).eq('id', p.id);
      fixed++;
    }
  }
  logger.success(`Fixed on_sale flag for ${fixed} products`);
}

function extractDimText(text: string): string {
  // Look for dimension patterns in description text
  const patterns = [
    /\d+(?:\.\d+)?\s*(?:cm|in|inch|")\s*[xX×]\s*\d+(?:\.\d+)?\s*(?:cm|in|inch|")/,
    /(?:width|height|depth|w|h|d)[:\s]+\d+(?:\.\d+)?\s*(?:cm|in)/i,
    /\d+(?:\.\d+)?["\s]*[wW]\s*[xX×]\s*\d+(?:\.\d+)?["\s]*[hH]/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return '';
}

async function main() {
  logger.section('🔧 Fix & Enrich Existing Products');
  await fixCategories();
  await enrichAttributes();
  await enrichDimensions();
  await fixOnSaleFlag();

  // Final count
  const { count: total } = await supabase.from('products').select('id', { count: 'exact', head: true });
  const { count: withPrice } = await supabase.from('products').select('id', { count: 'exact', head: true }).not('price', 'is', null);
  const { count: withAttrs } = await supabase.from('product_attributes').select('id', { count: 'exact', head: true });
  const { count: withDims } = await supabase.from('product_dimensions').select('id', { count: 'exact', head: true });
  const { count: unknown } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('category', 'unknown');

  logger.summary({
    'Total products':    total ?? 0,
    'With price':        withPrice ?? 0,
    'With attributes':   withAttrs ?? 0,
    'With dimensions':   withDims ?? 0,
    'Unknown category':  unknown ?? 0,
  });
}

main().then(() => process.exit(0)).catch(e => { logger.error(String(e)); process.exit(1); });
