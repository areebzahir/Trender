import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { analyzeRoom, validatePrompt } from '../../src/services/aiRoomAnalysisService';

/**
 * POST /api/analyze-room
 *
 * Accepts: { imageBase64: string, prompt: string }
 * Returns: { analysis: RoomAnalysis } | { error: string }
 *
 * Security:
 * - Validates inputs server-side before calling any AI API.
 * - API keys are read from Netlify environment variables only.
 * - Never returns stack traces or internal error details to the client.
 */
export const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed.' }),
    };
  }

  // Parse request body
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON in request body.' }),
    };
  }

  const { imageBase64, prompt } = body;

  // Validate imageBase64
  if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.trim().length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'imageBase64 is required and must be a non-empty string.' }),
    };
  }

  // Validate image size (base64 length × 0.75 ≈ bytes; reject > ~10 MB)
  const estimatedBytes = imageBase64.length * 0.75;
  if (estimatedBytes > 10 * 1024 * 1024) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Image exceeds the 10 MB size limit.' }),
    };
  }

  // Validate prompt
  if (!prompt || typeof prompt !== 'string') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'prompt is required.' }),
    };
  }
  const promptError = validatePrompt(prompt);
  if (promptError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: promptError }),
    };
  }

  // Call AI analysis service
  try {
    const result = await analyzeRoom(imageBase64, prompt);

    if ('error' in result) {
      console.error('[analyze-room] Service error:', result.error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis: result }),
    };
  } catch (err) {
    console.error('[analyze-room] Unexpected error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong. Please try again.' }),
    };
  }
};
