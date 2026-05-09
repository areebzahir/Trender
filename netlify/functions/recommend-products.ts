import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { recommendProducts, extractBudget } from '../../src/services/productRecommendationService';
import { products } from '../../src/data/products';
import type { RoomAnalysis } from '../../src/types/roomAnalysis';
import { ROOM_ANALYSIS_REQUIRED_FIELDS } from '../../src/types/roomAnalysis';

/**
 * POST /api/recommend-products
 *
 * Accepts: { analysis: RoomAnalysis }
 * Returns: { products: Product[] } | { error: string }
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
    // Extract budget from the design goal if present
    const budget = extractBudget(typedAnalysis.designGoal) ?? undefined;
    const matched = recommendProducts(typedAnalysis, products, budget);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: matched }),
    };
  } catch (err) {
    console.error('[recommend-products] Unexpected error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong. Please try again.' }),
    };
  }
};
