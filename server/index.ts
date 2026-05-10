/**
 * Local development API server — mirrors Netlify Functions for local dev.
 * Run with: npx tsx server/index.ts
 * Then run Vite: npm run dev
 *
 * This file is NOT deployed. Netlify Functions handle production.
 */

import 'dotenv/config';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { analyzeRoom, validatePrompt } from '../src/services/aiRoomAnalysisService';
import { generateRoomPreview } from '../src/services/roomPreviewGenerationService';
import { saveSession, isValidRoomAnalysis } from '../src/services/storageService';
import { recommendProducts, extractBudget } from '../src/services/productRecommendationService';
import { createClient } from '@supabase/supabase-js';
import type { RoomAnalysis } from '../src/types/roomAnalysis';
import { ROOM_ANALYSIS_REQUIRED_FIELDS } from '../src/types/roomAnalysis';
import type { Product } from '../src/types/product';
// New Gemini intelligence pipeline
import { runRoomOverlayPipeline } from '../src/lib/room-overlay/roomOverlayPipeline';
import { translateUserPrompt } from '../src/lib/gemini/translateUserPrompt';
import { analyzeRoomWithGemini } from '../src/lib/gemini/analyzeRoomWithGemini';
import { buildProductCandidates } from '../src/lib/room-overlay/productCandidateBuilder';
import { scoreAndRankCandidates } from '../src/lib/room-overlay/productRecommendationService';
import { rankProductsWithGemini } from '../src/lib/gemini/rankProductsWithGemini';
import { toUserMessage } from '../src/lib/gemini/geminiErrors';
import type { UserRoomPromptInput, RoomAnalysis as OverlayRoomAnalysis } from '../src/lib/room-overlay/types';

const PORT = 8888;

// ── Helpers ──────────────────────────────────────────────────────────────────

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(json);
}

// ── Route handlers ────────────────────────────────────────────────────────────

async function handleAnalyzeRoom(body: Record<string, unknown>, res: ServerResponse) {
  const { imageBase64, prompt } = body;

  if (!imageBase64 || typeof imageBase64 !== 'string')
    return send(res, 400, { error: 'imageBase64 is required.' });

  if ((imageBase64.length * 0.75) > 10 * 1024 * 1024)
    return send(res, 400, { error: 'Image exceeds 10 MB limit.' });

  if (!prompt || typeof prompt !== 'string')
    return send(res, 400, { error: 'prompt is required.' });

  const promptError = validatePrompt(prompt);
  if (promptError) return send(res, 400, { error: promptError });

  const result = await analyzeRoom(imageBase64, prompt);
  if ('error' in result) {
    console.error('[analyze-room]', result.error);
    return send(res, 500, { error: result.error });
  }
  send(res, 200, { analysis: result });
}

async function handleRecommendProducts(body: Record<string, unknown>, res: ServerResponse) {
  const { analysis } = body;

  if (!analysis || typeof analysis !== 'object')
    return send(res, 400, { error: 'analysis is required.' });

  const missing = ROOM_ANALYSIS_REQUIRED_FIELDS.filter(
    f => !(f in (analysis as Record<string, unknown>))
  );
  if (missing.length) return send(res, 400, { error: `Missing fields: ${missing.join(', ')}` });

  const typedAnalysis = analysis as RoomAnalysis;
  const budget = extractBudget(typedAnalysis.designGoal) ?? undefined;

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey)
    return send(res, 500, { error: 'Database not configured.' });

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, title, description, category, price, currency,
      image_url, product_url, is_active,
      stores ( name ),
      product_attributes ( colors, materials, styles, room_types ),
      product_dimensions ( width, height, depth, unit )
    `)
    .eq('is_active', true)
    .limit(500);

  if (error) {
    console.error('[recommend-products] Supabase error:', error);
    return send(res, 500, { error: 'Failed to fetch products.' });
  }

  const products: Product[] = (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.title ?? 'Untitled',
    storeName: p.stores?.name ?? 'Unknown Store',
    category: p.category ?? 'unknown',
    price: p.price ?? 0,
    currency: p.currency ?? 'CAD',
    productUrl: p.product_url ?? '',
    affiliateUrl: p.product_url ?? '',
    imageUrl: p.image_url ?? '/placeholder.svg',
    cleanImageUrl: p.image_url ?? '/placeholder.svg',
    colorTags: p.product_attributes?.colors ?? [],
    styleTags: p.product_attributes?.styles ?? [],
    materialTags: p.product_attributes?.materials ?? [],
    roomTags: p.product_attributes?.room_types ?? [],
    dimensions: p.product_dimensions ? {
      width: p.product_dimensions.width ? `${p.product_dimensions.width}${p.product_dimensions.unit ?? ''}` : undefined,
      height: p.product_dimensions.height ? `${p.product_dimensions.height}${p.product_dimensions.unit ?? ''}` : undefined,
      depth: p.product_dimensions.depth ? `${p.product_dimensions.depth}${p.product_dimensions.unit ?? ''}` : undefined,
    } : undefined,
    inStock: true,
  }));

  console.log(`[recommend-products] ${products.length} products fetched, running matcher…`);
  const matched = recommendProducts(typedAnalysis, products, budget);
  console.log(`[recommend-products] ${matched.length} matched`);

  send(res, 200, { products: matched.slice(0, 20) });
}

async function handleGeneratePreview(body: Record<string, unknown>, res: ServerResponse) {
  const { imageBase64, productImageUrls, prompt } = body;

  if (!imageBase64 || typeof imageBase64 !== 'string')
    return send(res, 400, { error: 'imageBase64 is required.' });
  if (!Array.isArray(productImageUrls))
    return send(res, 400, { error: 'productImageUrls must be an array.' });
  if (!prompt || typeof prompt !== 'string')
    return send(res, 400, { error: 'prompt is required.' });

  const result = await generateRoomPreview(imageBase64, productImageUrls as string[], prompt);
  if ('error' in result) return send(res, 500, { error: result.error });
  send(res, 200, result);
}

async function handleSaveDesign(body: Record<string, unknown>, res: ServerResponse) {
  const { imageUrl, analysis, selectedProductIds, previewImageUrl } = body;

  if (!imageUrl || typeof imageUrl !== 'string')
    return send(res, 400, { error: 'imageUrl is required.' });
  if (!isValidRoomAnalysis(analysis))
    return send(res, 400, { error: 'analysis is invalid.' });
  if (!Array.isArray(selectedProductIds))
    return send(res, 400, { error: 'selectedProductIds must be an array.' });

  const session = await saveSession({
    imageUrl,
    analysis,
    selectedProductIds: selectedProductIds as string[],
    previewImageUrl: typeof previewImageUrl === 'string' ? previewImageUrl : null,
  });
  send(res, 200, { id: session.id, createdAt: session.createdAt });
}

// ── New Gemini pipeline handlers ──────────────────────────────────────────────

async function handleOverlayAnalyze(body: Record<string, unknown>, res: ServerResponse) {
  const { imageBase64, mimeType, prompt, budget, preferredStyle, preferredColor, furnitureType } = body;
  if (!imageBase64 || typeof imageBase64 !== 'string') return send(res, 400, { error: 'imageBase64 is required.' });
  if (!prompt || typeof prompt !== 'string') return send(res, 400, { error: 'prompt is required.' });
  try {
    const userPrompt   = await translateUserPrompt(prompt);
    const roomAnalysis = await analyzeRoomWithGemini(
      imageBase64, (mimeType as string) || 'image/jpeg', userPrompt,
      { budget: typeof budget === 'number' ? budget : undefined }
    );
    send(res, 200, { userPrompt, roomAnalysis });
  } catch (err) {
    console.error('[overlay-analyze]', err);
    send(res, 500, { error: toUserMessage(err) });
  }
}

async function handleOverlayRecommend(body: Record<string, unknown>, res: ServerResponse) {
  const { userPrompt, roomAnalysis, budget } = body;
  if (!userPrompt || !roomAnalysis) return send(res, 400, { error: 'userPrompt and roomAnalysis are required.' });
  try {
    const budgetNum = typeof budget === 'number' ? budget : undefined;
    const raw = await buildProductCandidates(roomAnalysis as OverlayRoomAnalysis, budgetNum);
    const scored = scoreAndRankCandidates(raw, roomAnalysis as OverlayRoomAnalysis, userPrompt as UserRoomPromptInput, budgetNum);
    let final = scored;
    try {
      const ranking = await rankProductsWithGemini(userPrompt as UserRoomPromptInput, roomAnalysis as OverlayRoomAnalysis, scored);
      const map = new Map(ranking.rankedProducts.map(r => [r.productId, r]));
      final = scored.map(c => {
        const g = map.get(c.id);
        if (!g) return c;
        return { ...c, geminiScore: g.geminiScore, finalScore: c.structuredScore * 0.4 + g.geminiScore * 0.6, whySelected: g.whySelected };
      }).sort((a, b) => b.finalScore - a.finalScore);
    } catch { /* non-fatal */ }
    send(res, 200, { candidates: final });
  } catch (err) {
    console.error('[overlay-recommend]', err);
    send(res, 500, { error: toUserMessage(err) });
  }
}

async function handleOverlayCreate(body: Record<string, unknown>, res: ServerResponse) {
  const { imageBase64, mimeType, prompt, budget, preferredStyle, preferredColor, furnitureType } = body;
  if (!imageBase64 || typeof imageBase64 !== 'string') return send(res, 400, { error: 'imageBase64 is required.' });
  if (!prompt || typeof prompt !== 'string') return send(res, 400, { error: 'prompt is required.' });
  try {
    const result = await runRoomOverlayPipeline({
      imageBase64, mimeType: (mimeType as string) || 'image/jpeg', prompt,
      budget: typeof budget === 'number' ? budget : undefined,
    });
    if (!result.ok) return send(res, 500, { error: result.userMessage });
    const { data } = result;
    send(res, 200, {
      needsUserClarification: data.needsUserClarification,
      clarificationQuestion:  data.clarificationQuestion,
      roomAnalysis:    data.roomAnalysis,
      userPrompt:      data.userPrompt,
      selectedProduct: data.selectedProduct,
      placement:       data.placement,
      renderGuidance:  data.renderGuidance,
      allCandidates:   data.allCandidates.slice(0, 10),
    });
  } catch (err) {
    console.error('[overlay-create]', err);
    send(res, 500, { error: toUserMessage(err) });
  }
}

async function handleRemoveBg(body: Record<string, unknown>, res: ServerResponse) {
  const { imageUrl } = body;
  if (!imageUrl || typeof imageUrl !== 'string')
    return send(res, 400, { error: 'imageUrl required' });
  try {
    const fetchRes = await fetch(imageUrl as string, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Trender)' },
    });
    if (!fetchRes.ok) throw new Error(`Fetch failed: ${fetchRes.status}`);

    const contentType = fetchRes.headers.get('content-type') ?? 'image/jpeg';
    const arrayBuffer = await fetchRes.arrayBuffer();
    const inputBlob = new Blob([arrayBuffer], { type: contentType });

    const { removeBackground } = await import('@imgly/background-removal-node');
    const resultBlob = await (removeBackground as any)(inputBlob, {
      model: 'medium',
      output: { format: 'image/png', quality: 1.0 },
    });

    const resultBuf = Buffer.from(await resultBlob.arrayBuffer());

    // ── Quality check ─────────────────────────────────────────────────────────
    // Decode the PNG and count non-transparent pixels.
    // If fewer than 12% of pixels survived, the model removed the furniture
    // (happens when furniture color matches background). Fall back to original.
    const { createCanvas, loadImage } = await import('canvas');
    const img = await loadImage(resultBuf);
    const cv = createCanvas(img.width, img.height);
    const ctx = cv.getContext('2d');
    ctx.drawImage(img as any, 0, 0);
    const pixels = ctx.getImageData(0, 0, img.width, img.height).data;
    let nonTransparent = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 10) nonTransparent++;
    }
    const totalPixels = img.width * img.height;
    const ratio = nonTransparent / totalPixels;
    console.log(`[remove-bg] Quality check: ${(ratio * 100).toFixed(1)}% pixels retained`);

    if (ratio < 0.12) {
      // Too much removed — return original image as data URL
      console.warn('[remove-bg] Quality check failed, returning original image');
      const originalBuf = Buffer.from(arrayBuffer);
      const originalDataUrl = `data:${contentType};base64,${originalBuf.toString('base64')}`;
      return send(res, 200, { dataUrl: originalDataUrl, usedFallback: true });
    }

    const dataUrl = `data:image/png;base64,${resultBuf.toString('base64')}`;
    send(res, 200, { dataUrl, usedFallback: false });
  } catch (err) {
    console.error('[remove-bg]', err);
    send(res, 500, { error: (err as Error).message });
  }
}

// ── Server ────────────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  const url = req.url ?? '';

  // GET /.netlify/functions/image-proxy?url=<encoded>
  if (req.method === 'GET' && url.startsWith('/.netlify/functions/image-proxy')) {
    try {
      const u = new URL(url, 'http://localhost');
      const target = u.searchParams.get('url');
      if (!target) { res.writeHead(400); return res.end('url required'); }

      const upstream = await fetch(target, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Trender image proxy)' },
      });
      if (!upstream.ok) { res.writeHead(upstream.status); return res.end(`upstream ${upstream.status}`); }

      const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(buf);
    } catch (err) {
      res.writeHead(500);
      res.end(`proxy error: ${(err as Error).message}`);
    }
    return;
  }

  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Method not allowed.' });
  }

  // Map /.netlify/functions/<name> paths (Vite proxy rewrites /api/* to this)
  const route = url.replace(/^\/\.netlify\/functions\//, '').split('?')[0];

  try {
    const body = await readBody(req);

    if (route === 'analyze-room')        return await handleAnalyzeRoom(body, res);
    if (route === 'recommend-products')  return await handleRecommendProducts(body, res);
    if (route === 'generate-room-preview') return await handleGeneratePreview(body, res);
    if (route === 'save-design')         return await handleSaveDesign(body, res);

    // New Gemini intelligence pipeline routes
    if (route === 'room-overlay-analyze')    return await handleOverlayAnalyze(body, res);
    if (route === 'room-overlay-recommend')  return await handleOverlayRecommend(body, res);
    if (route === 'room-overlay-create')     return await handleOverlayCreate(body, res);

    // Background removal
    if (route === 'remove-bg') return await handleRemoveBg(body, res);

    send(res, 404, { error: `Unknown route: ${route}` });
  } catch (err) {
    console.error('[server] Unhandled error:', err);
    send(res, 500, { error: 'Internal server error.' });
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Local API server running at http://localhost:${PORT}`);
  console.log('   Routes:');
  console.log('   POST /.netlify/functions/analyze-room');
  console.log('   POST /.netlify/functions/recommend-products');
  console.log('   POST /.netlify/functions/generate-room-preview');
  console.log('   POST /.netlify/functions/save-design');
  console.log('   POST /.netlify/functions/room-overlay-analyze');
  console.log('   POST /.netlify/functions/room-overlay-recommend');
  console.log('   POST /.netlify/functions/room-overlay-create');
  console.log('\n   Vite proxy: /api/* → http://localhost:8888/.netlify/functions/*');
  console.log('\n   Make sure GEMINI_API_KEY is set in .env\n');
});
