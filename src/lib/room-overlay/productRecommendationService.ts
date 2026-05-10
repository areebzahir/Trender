/**
 * productRecommendationService — deterministic structured scoring of product candidates.
 * Runs before Gemini reranking to reduce the candidate set to top 10–15.
 */

import type { ProductCandidate, RoomAnalysis, UserRoomPromptInput } from './types';

const TOP_N_FOR_GEMINI = 30;

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function overlap(a: string[], b: string[]): number {
  const setB = new Set(b.map(normalize));
  return a.filter(x => setB.has(normalize(x))).length;
}

function partialOverlap(a: string[], b: string[]): number {
  let count = 0;
  for (const x of a) {
    for (const y of b) {
      if (normalize(x).includes(normalize(y)) || normalize(y).includes(normalize(x))) {
        count++;
        break;
      }
    }
  }
  return count;
}

export function scoreCandidate(
  candidate: ProductCandidate,
  analysis: RoomAnalysis,
  budget?: number
): number {
  let score = 0;
  const req = analysis.requestedItem;
  const constraints = analysis.recommendedProductConstraints;

  // ── Hard rejects ──────────────────────────────────────────────────────────
  if (!candidate.imageUrl) return -1000;

  // ── Category / furniture type match ──────────────────────────────────────
  const dbCategory = normalize(candidate.category ?? '');
  const reqType    = normalize(req.furnitureType ?? '');
  const reqCat     = normalize(req.category ?? '');

  if (reqType && dbCategory.includes(reqType)) score += 40;
  else if (reqCat && dbCategory.includes(reqCat)) score += 25;

  // ── Room type match ───────────────────────────────────────────────────────
  if (analysis.roomType && candidate.roomType) {
    if (normalize(candidate.roomType).includes(normalize(analysis.roomType))) score += 10;
  }

  // ── Style match ───────────────────────────────────────────────────────────
  const styleMatches = partialOverlap(candidate.styleTags, [
    ...req.stylePreferences,
    ...analysis.designStyleDetected,
  ]);
  score += Math.min(styleMatches * 5, 15);

  // ── Color match ───────────────────────────────────────────────────────────
  const colorMatches = partialOverlap(candidate.colors, [
    ...req.colorPreferences,
    ...analysis.dominantColors,
  ]);
  score += Math.min(colorMatches * 5, 10);

  // ── Material match ────────────────────────────────────────────────────────
  const materialMatches = partialOverlap(candidate.materials, [
    ...req.materialPreferences,
    ...constraints.preferredMaterials,
  ]);
  score += Math.min(materialMatches * 4, 8);

  // ── Dimension fit ─────────────────────────────────────────────────────────
  const { maxWidthCm, maxDepthCm, maxHeightCm, minWidthCm } = constraints;
  if (candidate.widthCm) {
    if (maxWidthCm && candidate.widthCm > maxWidthCm) score -= 25;
    else if (minWidthCm && candidate.widthCm >= minWidthCm) score += 8;
    else score += 7;
  }
  if (maxDepthCm && candidate.depthCm && candidate.depthCm > maxDepthCm) score -= 15;
  if (maxHeightCm && candidate.heightCm && candidate.heightCm > maxHeightCm) score -= 15;

  // ── Budget ────────────────────────────────────────────────────────────────
  if (budget && candidate.price) {
    if (candidate.price <= budget) score += 10;
    else score -= 20;
  }

  // ── Avoid colors/styles ───────────────────────────────────────────────────
  const avoidColorHits = overlap(candidate.colors, constraints.avoidColors);
  score -= avoidColorHits * 8;

  const avoidStyleHits = overlap(candidate.styleTags, constraints.avoidStyles);
  score -= avoidStyleHits * 8;

  // ── Image quality bonus ───────────────────────────────────────────────────
  if (candidate.imageUrl && candidate.imageUrl.startsWith('http')) score += 10;

  return score;
}

export function scoreAndRankCandidates(
  candidates: ProductCandidate[],
  analysis: RoomAnalysis,
  userPrompt: UserRoomPromptInput,
  budget?: number
): ProductCandidate[] {
  return candidates
    .map(c => {
      const s = scoreCandidate(c, analysis, budget);
      return {
        ...c,
        structuredScore: s,
        finalScore: s,
        whySelected: s > 0
          ? `Matches your ${analysis.requestedItem.furnitureType ?? 'furniture'} request`
          : '',
        renderWarnings: buildRenderWarnings(c, analysis),
      };
    })
    .filter(c => c.structuredScore > -100) // drop hard rejects
    .sort((a, b) => b.structuredScore - a.structuredScore)
    .slice(0, TOP_N_FOR_GEMINI);
}

function buildRenderWarnings(
  candidate: ProductCandidate,
  analysis: RoomAnalysis
): string[] {
  const warnings: string[] = [];
  const { maxWidthCm } = analysis.recommendedProductConstraints;

  if (maxWidthCm && candidate.widthCm && candidate.widthCm > maxWidthCm * 0.9) {
    warnings.push('Product may be close to the maximum width for this space.');
  }
  if (!candidate.widthCm) {
    warnings.push('No dimension data — scale in compositor may need manual adjustment.');
  }
  return warnings;
}
