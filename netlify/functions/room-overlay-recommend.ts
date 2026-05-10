/**
 * POST /api/room-overlay-recommend
 * Step 2: Query Supabase + score + Gemini rerank → return product candidates.
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import { buildProductCandidates } from '../../src/lib/room-overlay/productCandidateBuilder';
import { scoreAndRankCandidates } from '../../src/lib/room-overlay/productRecommendationService';
import { rankProductsWithGemini } from '../../src/lib/gemini/rankProductsWithGemini';
import { extractIntent } from '../../src/lib/gemini/extractIntent';
import { toUserMessage } from '../../src/lib/gemini/geminiErrors';
import type { UserRoomPromptInput, RoomAnalysis } from '../../src/lib/room-overlay/types';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST')
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed.' }) };

  let body: Record<string, unknown>;
  try { body = JSON.parse(event.body ?? '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON.' }) }; }

  const { userPrompt, roomAnalysis, budget, forcedCategories } = body;

  if (!userPrompt || !roomAnalysis)
    return { statusCode: 400, body: JSON.stringify({ error: 'userPrompt and roomAnalysis are required.' }) };

  try {
    const budgetNum = typeof budget === 'number' ? budget : undefined;
    const analysis = roomAnalysis as RoomAnalysis;
    const prompt = userPrompt as UserRoomPromptInput;

    // Extract categories from the user's original prompt to enforce strict filtering
    let dbCategories: string[] = [];
    if (Array.isArray(forcedCategories) && forcedCategories.length > 0) {
      dbCategories = forcedCategories as string[];
    } else if (prompt.originalPrompt) {
      const intent = await extractIntent(prompt.originalPrompt);
      dbCategories = intent.dbCategories;
      console.log('[room-overlay-recommend] Extracted categories:', dbCategories);
    }

    const rawCandidates = await buildProductCandidates(
      analysis,
      budgetNum,
      dbCategories.length > 0 ? dbCategories : undefined
    );
    const scored = scoreAndRankCandidates(
      rawCandidates,
      analysis,
      prompt,
      budgetNum
    );

    let finalCandidates = scored;
    try {
      const ranking = await rankProductsWithGemini(
        prompt,
        analysis,
        scored
      );
      const scoreMap = new Map(ranking.rankedProducts.map(r => [r.productId, r]));
      finalCandidates = scored.map(c => {
        const g = scoreMap.get(c.id);
        if (!g) return c;
        return {
          ...c,
          geminiScore: g.geminiScore,
          finalScore:  c.structuredScore * 0.4 + g.geminiScore * 0.6,
          whySelected: g.whySelected,
          renderWarnings: [...c.renderWarnings, ...g.concerns],
        };
      }).sort((a, b) => b.finalScore - a.finalScore);
    } catch {
      // Reranking failure is non-fatal
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidates: finalCandidates }),
    };
  } catch (err) {
    console.error('[room-overlay-recommend]', err);
    return { statusCode: 500, body: JSON.stringify({ error: toUserMessage(err) }) };
  }
};
