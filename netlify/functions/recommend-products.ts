import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { recommendProducts, extractBudget } from '../../src/services/productRecommendationService';
import type { RoomAnalysis } from '../../src/types/roomAnalysis';
import { ROOM_ANALYSIS_REQUIRED_FIELDS } from '../../src/types/roomAnalysis';
import type { Product } from '../../src/types/product';

/**
 * POST /api/recommend-products
 *
 * Accepts: { analysis: RoomAnalysis }
 * Returns: { products: Product[] } | { error: string }
 *
 * Queries Supabase database for real furniture products from 28+ stores.
 */
export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed.' }),
    };
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON in request body.' }),
    };
  }

  const { analysis } = body;

  // Validate analysis object
  if (!analysis || typeof analysis !== 'object') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'analysis is required and must be an object.' }),
    };
  }

  const missingFields = ROOM_ANALYSIS_REQUIRED_FIELDS.filter(
    field => !(field in (analysis as Record<string, unknown>))
  );
  if (missingFields.length > 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `analysis is missing required fields: ${missingFields.join(', ')}`,
      }),
    };
  }

  try {
    const typedAnalysis = analysis as RoomAnalysis;
    const budget = extractBudget(typedAnalysis.designGoal) ?? undefined;

    // Initialize Supabase client with service role key (server-side only)
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[recommend-products] Missing Supabase credentials');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Database configuration error.' }),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch products with attributes from Supabase
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        description,
        category,
        price,
        currency,
        image_url,
        product_url,
        is_active,
        store_id,
        stores (
          name
        ),
        product_attributes (
          colors,
          materials,
          styles,
          room_types
        ),
        product_dimensions (
          width,
          height,
          depth,
          unit
        )
      `)
      .eq('is_active', true)
      .limit(500); // Limit to 500 products for performance

    if (productsError) {
      console.error('[recommend-products] Supabase query error:', productsError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch products from database.' }),
      };
    }

    // Transform Supabase data to Product type
    const products: Product[] = (productsData || []).map((p: any) => ({
      id: p.id,
      name: p.title || 'Untitled Product',
      storeName: p.stores?.name || 'Unknown Store',
      category: p.category || 'unknown',
      price: p.price || 0,
      currency: p.currency || 'CAD',
      productUrl: p.product_url || '',
      affiliateUrl: p.product_url || '',
      imageUrl: p.image_url || '/placeholder.svg',
      cleanImageUrl: p.image_url || '/placeholder.svg',
      colorTags: p.product_attributes?.colors || [],
      styleTags: p.product_attributes?.styles || [],
      materialTags: p.product_attributes?.materials || [],
      roomTags: p.product_attributes?.room_types || [],
      dimensions: p.product_dimensions
        ? {
            width: p.product_dimensions.width
              ? `${p.product_dimensions.width}${p.product_dimensions.unit || ''}`
              : undefined,
            height: p.product_dimensions.height
              ? `${p.product_dimensions.height}${p.product_dimensions.unit || ''}`
              : undefined,
            depth: p.product_dimensions.depth
              ? `${p.product_dimensions.depth}${p.product_dimensions.unit || ''}`
              : undefined,
          }
        : undefined,
      inStock: true, // Assume in stock if is_active is true
    }));

    console.log(`[recommend-products] Fetched ${products.length} products from Supabase`);

    // Run AI matching algorithm
    const matched = recommendProducts(typedAnalysis, products, budget);

    console.log(`[recommend-products] Matched ${matched.length} products for analysis`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: matched.slice(0, 20) }), // Return top 20 matches
    };
  } catch (err) {
    console.error('[recommend-products] Unexpected error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong. Please try again.' }),
    };
  }
};
