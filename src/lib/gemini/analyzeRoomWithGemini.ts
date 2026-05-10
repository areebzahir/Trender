/**
 * analyzeRoomWithGemini — sends room image + prompt to Gemini 2.5 Flash
 * and returns a validated RoomAnalysis.
 * SERVER-SIDE ONLY.
 */

import { callGemini } from './geminiClient';
import { parseGeminiJson } from './parseGeminiJson';
import { buildRoomAnalysisPrompt } from './prompts';
import { checkImageGuardrails, checkOutputGuardrails } from '../room-overlay/guardrails';
import { GeminiAnalysisError } from './geminiErrors';
import type { UserRoomPromptInput, RoomAnalysis } from '../room-overlay/types';

export interface RoomAnalysisFilters {
  budget?: number;
  preferredStyle?: string;
  preferredColor?: string;
  furnitureType?: string;
}

/** Safely coerces any value to a string array. */
function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string' && val) return [val];
  return [];
}

/** Safely coerces to number or null. */
function toNumberOrNull(val: unknown): number | null {
  const n = Number(val);
  return isNaN(n) ? null : n;
}

/**
 * Converts raw Gemini JSON into a RoomAnalysis with safe defaults.
 * Never throws on missing/wrong fields — always returns a usable object.
 */
function coerceToRoomAnalysis(raw: unknown, userPrompt: UserRoomPromptInput): RoomAnalysis {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const lighting = (d.lighting && typeof d.lighting === 'object'
    ? d.lighting : {}) as Record<string, unknown>;

  const surfaces = (d.surfaces && typeof d.surfaces === 'object'
    ? d.surfaces : {}) as Record<string, unknown>;

  const colorPalette = (d.colorPalette && typeof d.colorPalette === 'object'
    ? d.colorPalette : {}) as Record<string, unknown>;

  const requestedItem = (d.requestedItem && typeof d.requestedItem === 'object'
    ? d.requestedItem : {}) as Record<string, unknown>;

  const constraints = (d.recommendedProductConstraints && typeof d.recommendedProductConstraints === 'object'
    ? d.recommendedProductConstraints : {}) as Record<string, unknown>;

  const renderGuidance = (d.renderGuidance && typeof d.renderGuidance === 'object'
    ? d.renderGuidance : {}) as Record<string, unknown>;

  const confidence = (d.confidence && typeof d.confidence === 'object'
    ? d.confidence : {}) as Record<string, unknown>;

  // Parse placement recommendations
  const rawPlacements = Array.isArray(d.placementRecommendations)
    ? d.placementRecommendations : [];

  const placements = rawPlacements.map((p: any) => ({
    zoneLabel:      String(p.zoneLabel ?? 'center floor'),
    targetSurface:  (['floor','wall','tabletop','ceiling','unknown'].includes(p.targetSurface)
                      ? p.targetSurface : 'floor') as RoomAnalysis['placementRecommendations'][0]['targetSurface'],
    xRelative:      Math.min(1, Math.max(0, Number(p.xRelative) || 0.5)),
    yRelative:      Math.min(1, Math.max(0, Number(p.yRelative) || 0.72)),
    widthRelative:  Math.min(1, Math.max(0, Number(p.widthRelative) || 0.45)),
    heightRelative: Math.min(1, Math.max(0, Number(p.heightRelative) || 0.35)),
    anchor:         (['bottom-center','center','top-center','left-wall','right-wall'].includes(p.anchor)
                      ? p.anchor : 'bottom-center') as RoomAnalysis['placementRecommendations'][0]['anchor'],
    depthLayer:     (['foreground','midground','background'].includes(p.depthLayer)
                      ? p.depthLayer : 'midground') as RoomAnalysis['placementRecommendations'][0]['depthLayer'],
    reason:         String(p.reason ?? ''),
    risks:          toStringArray(p.risks),
  }));

  return {
    roomType:            d.roomType ? String(d.roomType) : null,
    designStyleDetected: toStringArray(d.designStyleDetected),
    dominantColors:      toStringArray(d.dominantColors),
    colorPalette: {
      walls:     toStringArray(colorPalette.walls),
      floor:     toStringArray(colorPalette.floor),
      furniture: toStringArray(colorPalette.furniture),
      accents:   toStringArray(colorPalette.accents),
    },
    lighting: {
      brightness: (['low','medium','high'].includes(String(lighting.brightness))
                    ? lighting.brightness : null) as RoomAnalysis['lighting']['brightness'],
      direction:  (['left','right','front','back','overhead','unknown'].includes(String(lighting.direction))
                    ? lighting.direction : 'unknown') as RoomAnalysis['lighting']['direction'],
      warmth:     (['cool','neutral','warm'].includes(String(lighting.warmth))
                    ? lighting.warmth : null) as RoomAnalysis['lighting']['warmth'],
      notes:      toStringArray(lighting.notes),
    },
    surfaces: {
      floorType:             surfaces.floorType ? String(surfaces.floorType) : null,
      wallColor:             surfaces.wallColor ? String(surfaces.wallColor) : null,
      openSpaceDescription:  surfaces.openSpaceDescription ? String(surfaces.openSpaceDescription) : null,
    },
    existingFurniture: Array.isArray(d.existingFurniture)
      ? d.existingFurniture.map((f: any) => ({
          item:                String(f.item ?? ''),
          approximatePosition: String(f.approximatePosition ?? ''),
          color:               f.color ? String(f.color) : null,
          material:            f.material ? String(f.material) : null,
        }))
      : [],
    requestedItem: {
      originalUserRequest:   String(requestedItem.originalUserRequest   ?? userPrompt.originalPrompt),
      translatedUserRequest: String(requestedItem.translatedUserRequest ?? userPrompt.normalizedPrompt),
      category:              requestedItem.category   ? String(requestedItem.category)   : null,
      furnitureType:         requestedItem.furnitureType ? String(requestedItem.furnitureType) : null,
      quantity:              Number(requestedItem.quantity) || 1,
      stylePreferences:      toStringArray(requestedItem.stylePreferences),
      colorPreferences:      toStringArray(requestedItem.colorPreferences),
      materialPreferences:   toStringArray(requestedItem.materialPreferences),
      comfortKeywords:       toStringArray(requestedItem.comfortKeywords),
      placementGoal:         requestedItem.placementGoal ? String(requestedItem.placementGoal) : null,
      constraints:           toStringArray(requestedItem.constraints),
    },
    placementRecommendations: placements,
    recommendedProductConstraints: {
      maxWidthCm:         toNumberOrNull(constraints.maxWidthCm),
      maxDepthCm:         toNumberOrNull(constraints.maxDepthCm),
      maxHeightCm:        toNumberOrNull(constraints.maxHeightCm),
      minWidthCm:         toNumberOrNull(constraints.minWidthCm),
      preferredMaterials: toStringArray(constraints.preferredMaterials),
      avoidColors:        toStringArray(constraints.avoidColors),
      avoidStyles:        toStringArray(constraints.avoidStyles),
    },
    searchKeywords:         toStringArray(d.searchKeywords),
    negativeSearchKeywords: toStringArray(d.negativeSearchKeywords),
    renderGuidance: {
      placementNotes:   toStringArray(renderGuidance.placementNotes),
      scaleNotes:       toStringArray(renderGuidance.scaleNotes),
      perspectiveNotes: toStringArray(renderGuidance.perspectiveNotes),
      shadowNotes:      toStringArray(renderGuidance.shadowNotes),
      lightingNotes:    toStringArray(renderGuidance.lightingNotes),
      occlusionNotes:   toStringArray(renderGuidance.occlusionNotes),
    },
    confidence: {
      roomUnderstanding: Math.min(1, Math.max(0, Number(confidence.roomUnderstanding) || 0.8)),
      placement:         Math.min(1, Math.max(0, Number(confidence.placement)         || 0.7)),
      productIntent:     Math.min(1, Math.max(0, Number(confidence.productIntent)     || 0.8)),
    },
    needsUserClarification: Boolean(d.needsUserClarification),
    clarificationQuestion:  d.clarificationQuestion ? String(d.clarificationQuestion) : null,
  };
}

export async function analyzeRoomWithGemini(
  imageBase64: string,
  mimeType: string,
  userPrompt: UserRoomPromptInput,
  filters?: RoomAnalysisFilters
): Promise<RoomAnalysis> {
  checkImageGuardrails(imageBase64, mimeType);

  const promptText = buildRoomAnalysisPrompt(userPrompt, filters);

  let raw: string;
  try {
    raw = await callGemini([
      {
        role: 'user',
        parts: [
          { text: promptText },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      },
    ]);
    // Log first 300 chars to see what Gemini actually returned
    console.log('[analyzeRoomWithGemini] raw response preview:', raw.slice(0, 300));
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    throw new GeminiAnalysisError(
      `Gemini room analysis call failed: ${msg}`
    );
  }

  checkOutputGuardrails(raw);

  let parsed: unknown;
  try {
    parsed = parseGeminiJson<unknown>(raw);
  } catch (err) {
    console.error('[analyzeRoomWithGemini] JSON parse failed. Raw preview:', raw.slice(0, 400));
    throw new GeminiAnalysisError('Could not parse Gemini response as JSON.');
  }

  const analysis = coerceToRoomAnalysis(parsed, userPrompt);
  console.log('[analyzeRoomWithGemini] ✓ roomType:', analysis.roomType,
    '| furnitureType:', analysis.requestedItem.furnitureType,
    '| category:', analysis.requestedItem.category);

  return analysis;
}
