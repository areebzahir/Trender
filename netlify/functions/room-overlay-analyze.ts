/**
 * POST /api/room-overlay-analyze
 * Step 1: Translate prompt + analyze room image with Gemini.
 * Returns RoomAnalysis JSON.
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import { translateUserPrompt } from '../../src/lib/gemini/translateUserPrompt';
import { analyzeRoomWithGemini } from '../../src/lib/gemini/analyzeRoomWithGemini';
import { toUserMessage } from '../../src/lib/gemini/geminiErrors';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed.' }) };

  let body: Record<string, unknown>;
  try { body = JSON.parse(event.body ?? '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON.' }) }; }

  const { imageBase64, mimeType, prompt, budget, preferredStyle, preferredColor, furnitureType } = body;

  if (!imageBase64 || typeof imageBase64 !== 'string')
    return { statusCode: 400, body: JSON.stringify({ error: 'imageBase64 is required.' }) };
  if (!prompt || typeof prompt !== 'string')
    return { statusCode: 400, body: JSON.stringify({ error: 'prompt is required.' }) };

  try {
    const userPrompt   = await translateUserPrompt(prompt as string);
    const roomAnalysis = await analyzeRoomWithGemini(
      imageBase64 as string,
      (mimeType as string) || 'image/jpeg',
      userPrompt,
      {
        budget:         typeof budget === 'number' ? budget : undefined,
        preferredStyle: typeof preferredStyle === 'string' ? preferredStyle : undefined,
        preferredColor: typeof preferredColor === 'string' ? preferredColor : undefined,
        furnitureType:  typeof furnitureType  === 'string' ? furnitureType  : undefined,
      }
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPrompt, roomAnalysis }),
    };
  } catch (err) {
    console.error('[room-overlay-analyze]', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: toUserMessage(err) }),
    };
  }
};
