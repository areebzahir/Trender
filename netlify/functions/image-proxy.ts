/**
 * GET /api/image-proxy?url=<encoded>
 * Fetches remote product images server-side to bypass CORS.
 * Returns the raw image bytes with permissive CORS headers.
 */

import type { Handler, HandlerEvent } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent) => {
  const url = event.queryStringParameters?.url;
  if (!url) return { statusCode: 400, body: 'url required' };

  // Basic URL validation
  let parsed: URL;
  try { parsed = new URL(url); }
  catch { return { statusCode: 400, body: 'invalid url' }; }

  if (!['http:', 'https:'].includes(parsed.protocol))
    return { statusCode: 400, body: 'invalid protocol' };

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Trender image proxy)' },
    });
    if (!res.ok) return { statusCode: res.status, body: `upstream ${res.status}` };

    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const buf = Buffer.from(await res.arrayBuffer());

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
      body: buf.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 500, body: `fetch failed: ${(err as Error).message}` };
  }
};
