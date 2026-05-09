import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { saveSession, isValidRoomAnalysis } from '../../src/services/storageService';

/**
 * POST /api/save-design
 *
 * Accepts: { imageUrl: string, analysis: RoomAnalysis, selectedProductIds: string[], previewImageUrl: string | null }
 * Returns: { id: string, createdAt: string } | { error: string }
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

  const { imageUrl, analysis, selectedProductIds, previewImageUrl } = body;

  // Validate imageUrl
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim().length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'imageUrl is required and must be a non-empty string.' }),
    };
  }

  // Validate analysis
  if (!isValidRoomAnalysis(analysis)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'analysis is required and must be a valid RoomAnalysis object.' }),
    };
  }

  // Validate selectedProductIds
  if (!Array.isArray(selectedProductIds) || !selectedProductIds.every(id => typeof id === 'string')) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'selectedProductIds must be an array of strings.' }),
    };
  }

  try {
    const session = await saveSession({
      imageUrl: imageUrl as string,
      analysis,
      selectedProductIds: selectedProductIds as string[],
      previewImageUrl: typeof previewImageUrl === 'string' ? previewImageUrl : null,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: session.id, createdAt: session.createdAt }),
    };
  } catch (err) {
    console.error('[save-design] Unexpected error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong. Please try again.' }),
    };
  }
};
