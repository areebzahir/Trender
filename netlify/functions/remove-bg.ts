/**
 * POST /api/remove-bg
 * Accepts: { imageUrl: string }
 * Returns: PNG image with background removed (base64 data URI)
 *
 * Runs server-side so no CORS or WASM browser issues.
 */

import type { Handler, HandlerEvent } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, body: 'Method not allowed' };

  let body: Record<string, unknown>;
  try { body = JSON.parse(event.body ?? '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { imageUrl } = body;
  if (!imageUrl || typeof imageUrl !== 'string')
    return { statusCode: 400, body: JSON.stringify({ error: 'imageUrl required' }) };

  try {
    // Fetch the image
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Trender)' },
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const inputBlob = new Blob([arrayBuffer]);

    // Remove background using Node.js version
    const { removeBackground } = await import('@imgly/background-removal-node');
    const resultBlob = await removeBackground(inputBlob, {
      model: 'small',
      output: { format: 'image/png', quality: 0.92 },
    });

    const buf = Buffer.from(await resultBlob.arrayBuffer());
    const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ dataUrl }),
    };
  } catch (err) {
    console.error('[remove-bg]', err);
    return { statusCode: 500, body: JSON.stringify({ error: (err as Error).message }) };
  }
};
