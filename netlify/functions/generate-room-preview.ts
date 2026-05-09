import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { generateRoomPreview } from '../../src/services/roomPreviewGenerationService';

/**
 * POST /api/generate-room-preview
 *
 * Accepts: { imageBase64: string, productImageUrls: string[], prompt: string }
 * Returns: { previewUrl: string, isFallback: boolean } | { error: string }
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

  const { imageBase64, productImageUrls, prompt } = body;

  if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.trim().length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'imageBase64 is required and must be a non-empty string.' }),
    };
  }

  if (!Array.isArray(productImageUrls)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'productImageUrls must be an array.' }),
    };
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'prompt is required and must be a non-empty string.' }),
    };
  }

  try {
    const result = await generateRoomPreview(
      imageBase64,
      productImageUrls as string[],
      prompt
    );

    if ('error' in result) {
      console.error('[generate-room-preview] Service error:', result.error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error('[generate-room-preview] Unexpected error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong. Please try again.' }),
    };
  }
};
