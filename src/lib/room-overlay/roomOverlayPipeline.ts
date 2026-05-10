/**
 * roomOverlayPipeline — the full Gemini intelligence pipeline for Trender.
 *
 * Steps:
 * 1. Validate + guardrail prompt and image
 * 2. Translate/normalize prompt (Gemini call 1)
 * 3. Analyze room image (Gemini call 2)
 * 4. If clarification needed → return early
 * 5. Query Supabase for product candidates
 * 6. Structured-score candidates
 * 7. Gemini rerank top candidates (Gemini call 3, optional)
 * 8. Select best product
 * 9. Return result for compositor handoff
 *
 * Does NOT stitch/composite the image. That is a separate system.
 * SERVER-SIDE ONLY.
 */

import { translateUserPrompt } from '../gemini/translateUserPrompt';
import { analyzeRoomWithGemini } from '../gemini/analyzeRoomWithGemini';
import { rankProductsWithGemini } from '../gemini/rankProductsWithGemini';
import { extractIntent } from '../gemini/extractIntent';
import { buildProductCandidates } from './productCandidateBuilder';
import { scoreAndRankCandidates } from './productRecommendationService';
import { logRoomOverlayRequest } from './requestLogger';
import { toUserMessage } from '../gemini/geminiErrors';
import type { RoomOverlayResult, ProductCandidate } from './types';

export interface PipelineInput {
  imageBase64: string;
  mimeType:    string;
  prompt:      string;
  budget?:     number;
  preferredStyle?: string;
  preferredColor?: string;
  furnitureType?:  string;
  /** Skip Gemini reranking if structured scoring has a clear winner (score gap > threshold). */
  skipRerankThreshold?: number;
}

export type PipelineResult =
  | { ok: true;  data: RoomOverlayResult }
  | { ok: false; error: string; userMessage: string };

export async function runRoomOverlayPipeline(
  input: PipelineInput
): Promise<PipelineResult> {
  const {
    imageBase64, mimeType, prompt, budget,
    preferredStyle, preferredColor, furnitureType,
    skipRerankThreshold = 30,
  } = input;

  try {
    // ── Step 1: Extract strict furniture intent ───────────────────────────────
    console.log('[pipeline] Step 1: Extracting furniture intent...');
    const intent = await extractIntent(prompt);
    console.log('[pipeline] Step 1 ✓ category:', intent.requestedCategory, '| dbCategories:', intent.dbCategories);

    // If category is unclear, ask for clarification immediately
    if (intent.requiresClarification) {
      return {
        ok: true,
        data: {
          userPrompt: { originalPrompt: prompt, detectedLanguage: 'en', translatedPrompt: prompt, normalizedPrompt: prompt, safetyFlags: [] },
          roomAnalysis: null as any,
          selectedProduct: null,
          placement: null,
          renderGuidance: { placementNotes: [], scaleNotes: [], perspectiveNotes: [], shadowNotes: [], lightingNotes: [], occlusionNotes: [] },
          allCandidates: [],
          needsUserClarification: true,
          clarificationQuestion: intent.clarificationQuestion ?? 'What type of furniture are you looking for?',
        },
      };
    }

    // ── Step 2: Translate + normalize prompt ──────────────────────────────────
    console.log('[pipeline] Step 2: Translating prompt...');
    const userPrompt = await translateUserPrompt(prompt);
    console.log('[pipeline] Step 2 ✓ prompt normalized:', userPrompt.normalizedPrompt);

    // ── Step 3: Analyze room image ────────────────────────────────────────────
    console.log('[pipeline] Step 3: Analyzing room with Gemini...');
    const roomAnalysis = await analyzeRoomWithGemini(
      imageBase64, mimeType, userPrompt,
      { budget: intent.requiredAttributes.budgetMax ?? budget, preferredStyle, preferredColor, furnitureType: intent.requestedCategory }
    );
    console.log('[pipeline] Step 3 ✓ room analyzed:', roomAnalysis.roomType);

    // ── Step 4: Clarification needed from room analysis? ─────────────────────
    if (roomAnalysis.needsUserClarification) {
      await logRoomOverlayRequest({ userPrompt, roomAnalysis, status: 'clarification_needed' });
      return {
        ok: true,
        data: {
          userPrompt, roomAnalysis,
          selectedProduct: null, placement: null,
          renderGuidance: roomAnalysis.renderGuidance,
          allCandidates: [],
          needsUserClarification: true,
          clarificationQuestion: roomAnalysis.clarificationQuestion,
        },
      };
    }

    // ── Step 5: Fetch product candidates using HARD category filter ───────────
    console.log('[pipeline] Step 5: Querying Supabase with hard category filter:', intent.dbCategories);
    const rawCandidates = await buildProductCandidates(
      roomAnalysis,
      intent.requiredAttributes.budgetMax ?? budget,
      intent.dbCategories.length > 0 ? intent.dbCategories : undefined
    );
    console.log(`[pipeline] Step 5 ✓ ${rawCandidates.length} candidates fetched`);

    // If no candidates match the hard filter, return a clear message
    if (rawCandidates.length === 0) {
      return {
        ok: true,
        data: {
          userPrompt, roomAnalysis,
          selectedProduct: null, placement: null,
          renderGuidance: roomAnalysis.renderGuidance,
          allCandidates: [],
          needsUserClarification: true,
          clarificationQuestion: `No ${intent.requestedCategory.replace(/_/g, ' ')} found in our database. Try a different style or category.`,
        },
      };
    }

    // ── Step 6: Structured scoring ────────────────────────────────────────────
    console.log('[pipeline] Step 6: Scoring candidates...');
    const scoredCandidates = scoreAndRankCandidates(rawCandidates, roomAnalysis, userPrompt, intent.requiredAttributes.budgetMax ?? budget);
    console.log(`[pipeline] Step 6 ✓ top ${scoredCandidates.length} candidates scored`);

    let finalCandidates: ProductCandidate[] = scoredCandidates;

    // ── Step 7: Gemini reranking (skip if clear winner) ───────────────────────
    const shouldSkipRerank =
      scoredCandidates.length > 0 &&
      scoredCandidates.length >= 2 &&
      (scoredCandidates[0].structuredScore - scoredCandidates[1].structuredScore) > skipRerankThreshold;

    if (!shouldSkipRerank && scoredCandidates.length > 0) {
      try {
        const ranking = await rankProductsWithGemini(
          userPrompt,
          roomAnalysis,
          scoredCandidates
        );

        // Merge Gemini scores into candidates
        const geminiScoreMap = new Map(
          ranking.rankedProducts.map(r => [r.productId, r])
        );

        finalCandidates = scoredCandidates.map(c => {
          const geminiResult = geminiScoreMap.get(c.id);
          if (!geminiResult) return c;
          const finalScore = c.structuredScore * 0.4 + geminiResult.geminiScore * 0.6;
          return {
            ...c,
            geminiScore: geminiResult.geminiScore,
            finalScore,
            whySelected: geminiResult.whySelected,
            renderWarnings: [...c.renderWarnings, ...geminiResult.concerns],
          };
        }).sort((a, b) => b.finalScore - a.finalScore);

      } catch (rankErr) {
        // Reranking failure is non-fatal — fall back to structured scores
        console.warn('[pipeline] Gemini reranking failed, using structured scores:', rankErr);
      }
    }

    // ── Step 8: Select best product ───────────────────────────────────────────
    const selectedProduct = finalCandidates[0] ?? null;
    const placement = roomAnalysis.placementRecommendations[0] ?? null;
    console.log(`[pipeline] ✓ Complete. Selected: ${selectedProduct?.title ?? 'none'} | Total candidates: ${finalCandidates.length}`);

    // ── Step 9: Log ───────────────────────────────────────────────────────────
    await logRoomOverlayRequest({
      userPrompt,
      roomAnalysis,
      selectedIds: selectedProduct ? [selectedProduct.id] : [],
      placement,
      renderGuidance: roomAnalysis.renderGuidance,
      status: 'success',
    });

    return {
      ok: true,
      data: {
        userPrompt,
        roomAnalysis,
        selectedProduct,
        placement,
        renderGuidance: roomAnalysis.renderGuidance,
        allCandidates: finalCandidates,
        needsUserClarification: false,
        clarificationQuestion: null,
      },
    };

  } catch (err) {
    console.error('[roomOverlayPipeline] Error:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      userMessage: toUserMessage(err),
    };
  }
}
