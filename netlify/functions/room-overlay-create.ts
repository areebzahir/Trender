/**
 * POST /api/room-overlay-create
 * Full pipeline: translate → analyze → recommend → return compositor handoff.
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import { runRoomOverlayPipeline } from '../../src/lib/room-overlay/roomOverlayPipeline';
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
    const result = await runRoomOverlayPipeline({
      imageBase64,
      mimeType: (mimeType as string) || 'image/jpeg',
      prompt,
      budget:         typeof budget === 'number' ? budget : undefined,
      preferredStyle: typeof preferredStyle === 'string' ? preferredStyle : undefined,
      preferredColor: typeof preferredColor === 'string' ? preferredColor : undefined,
      furnitureType:  typeof furnitureType  === 'string' ? furnitureType  : undefined,
    });

    if (!result.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: result.userMessage }) };
    }

    const { data } = result;

    // Compositor handoff — this is where the image stitching system picks up
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Clarification flow
        needsUserClarification: data.needsUserClarification,
        clarificationQuestion:  data.clarificationQuestion,

        // Intelligence output
        roomAnalysis:    data.roomAnalysis,
        userPrompt:      data.userPrompt,

        // Compositor handoff
        selectedProduct: data.selectedProduct,
        placement:       data.placement,
        renderGuidance:  data.renderGuidance,

        // All ranked candidates (for UI to show alternatives)
        allCandidates: data.allCandidates,
      }),
    };
  } catch (err) {
    console.error('[room-overlay-create]', err);
    return { statusCode: 500, body: JSON.stringify({ error: toUserMessage(err) }) };
  }
};
