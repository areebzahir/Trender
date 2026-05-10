/**
 * rankProductsWithGemini — sends top product candidates to Gemini for reranking.
 * SERVER-SIDE ONLY.
 */

import { callGemini } from './geminiClient';
import { parseGeminiJson } from './parseGeminiJson';
import { buildProductRerankingPrompt } from './prompts';
import { checkOutputGuardrails } from '../room-overlay/guardrails';
import type {
  UserRoomPromptInput,
  RoomAnalysis,
  ProductCandidate,
  GeminiProductRankingResult,
} from '../room-overlay/types';

const MAX_CANDIDATES = 15;

export async function rankProductsWithGemini(
  userPrompt: UserRoomPromptInput,
  roomAnalysis: RoomAnalysis,
  candidates: ProductCandidate[]
): Promise<GeminiProductRankingResult> {
  if (candidates.length === 0) {
    return { rankedProducts: [], bestProductId: null, summary: 'No candidates.' };
  }

  const safeCandidates = candidates.slice(0, MAX_CANDIDATES).map(c => ({
    id:            c.id,
    title:         c.title,
    storeName:     c.storeName,
    price:         c.price,
    category:      c.category,
    furnitureType: c.furnitureType,
    colors:        c.colors,
    materials:     c.materials,
    styleTags:     c.styleTags,
    aestheticTags: c.aestheticTags,
    widthCm:       c.widthCm,
    heightCm:      c.heightCm,
    depthCm:       c.depthCm,
  }));

  const promptText = buildProductRerankingPrompt(userPrompt, roomAnalysis, safeCandidates);

  try {
    const raw = await callGemini([{ role: 'user', parts: [{ text: promptText }] }]);
    checkOutputGuardrails(raw);

    const parsed = parseGeminiJson<Record<string, unknown>>(raw);
    const validIds = new Set(candidates.map(c => c.id));

    const rankedProducts = Array.isArray(parsed.rankedProducts)
      ? parsed.rankedProducts
          .filter((r: any) => validIds.has(String(r.productId)))
          .map((r: any) => ({
            productId:                 String(r.productId),
            geminiScore:               Math.min(100, Math.max(0, Number(r.geminiScore) || 50)),
            whySelected:               String(r.whySelected ?? ''),
            fitReasons:                Array.isArray(r.fitReasons) ? r.fitReasons.map(String) : [],
            concerns:                  Array.isArray(r.concerns)   ? r.concerns.map(String)   : [],
            recommendedPlacementIndex: Number(r.recommendedPlacementIndex) || 0,
          }))
      : [];

    return {
      rankedProducts,
      bestProductId: rankedProducts[0]?.productId ?? null,
      summary: parsed.summary ? String(parsed.summary) : '',
    };
  } catch (err) {
    // Reranking failure is non-fatal — caller falls back to structured scores
    console.warn('[rankProductsWithGemini] Failed, using structured scores:', (err as Error).message);
    return { rankedProducts: [], bestProductId: null, summary: 'Ranking unavailable.' };
  }
}
