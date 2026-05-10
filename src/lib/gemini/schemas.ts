/**
 * schemas — Zod validation schemas for all Gemini JSON outputs.
 */

import { z } from 'zod';

// ── Shared ────────────────────────────────────────────────────────────────────

const nullableString = z.string().nullable().default(null);
const nullableNumber = z.number().nullable().default(null);
const stringArray    = z.array(z.string()).default([]);

// ── UserRoomPromptInput ───────────────────────────────────────────────────────

export const UserRoomPromptInputSchema = z.object({
  originalPrompt:   z.string(),
  detectedLanguage: nullableString,
  translatedPrompt: z.string(),
  normalizedPrompt: z.string(),
  safetyFlags:      stringArray,
});

// ── PlacementRecommendation ───────────────────────────────────────────────────

export const PlacementRecommendationSchema = z.object({
  zoneLabel:       z.string(),
  targetSurface:   z.enum(['floor', 'wall', 'tabletop', 'ceiling', 'unknown']),
  xRelative:       z.number().min(0).max(1),
  yRelative:       z.number().min(0).max(1),
  widthRelative:   z.number().min(0).max(1),
  heightRelative:  z.number().min(0).max(1),
  anchor:          z.enum(['bottom-center', 'center', 'top-center', 'left-wall', 'right-wall']),
  depthLayer:      z.enum(['foreground', 'midground', 'background']),
  reason:          z.string(),
  risks:           stringArray,
});

// ── RoomAnalysis ──────────────────────────────────────────────────────────────

export const RoomAnalysisSchema = z.object({
  roomType:             nullableString,
  designStyleDetected:  stringArray,
  dominantColors:       stringArray,
  colorPalette: z.object({
    walls:     stringArray,
    floor:     stringArray,
    furniture: stringArray,
    accents:   stringArray,
  }).default({ walls: [], floor: [], furniture: [], accents: [] }),
  lighting: z.object({
    brightness: z.enum(['low', 'medium', 'high']).nullable().default(null),
    direction:  z.enum(['left', 'right', 'front', 'back', 'overhead', 'unknown']).default('unknown'),
    warmth:     z.enum(['cool', 'neutral', 'warm']).nullable().default(null),
    notes:      stringArray,
  }).default({ brightness: null, direction: 'unknown', warmth: null, notes: [] }),
  surfaces: z.object({
    floorType:              nullableString,
    wallColor:              nullableString,
    openSpaceDescription:   nullableString,
  }).default({ floorType: null, wallColor: null, openSpaceDescription: null }),
  existingFurniture: z.array(z.object({
    item:                z.string(),
    approximatePosition: z.string(),
    color:               nullableString,
    material:            nullableString,
  })).default([]),
  requestedItem: z.object({
    originalUserRequest:   z.string(),
    translatedUserRequest: z.string(),
    category:              nullableString,
    furnitureType:         nullableString,
    quantity:              z.number().int().min(1).default(1),
    stylePreferences:      stringArray,
    colorPreferences:      stringArray,
    materialPreferences:   stringArray,
    comfortKeywords:       stringArray,
    placementGoal:         nullableString,
    constraints:           stringArray,
  }),
  placementRecommendations:    z.array(PlacementRecommendationSchema).default([]),
  recommendedProductConstraints: z.object({
    maxWidthCm:        nullableNumber,
    maxDepthCm:        nullableNumber,
    maxHeightCm:       nullableNumber,
    minWidthCm:        nullableNumber,
    preferredMaterials: stringArray,
    avoidColors:        stringArray,
    avoidStyles:        stringArray,
  }).default({
    maxWidthCm: null, maxDepthCm: null, maxHeightCm: null, minWidthCm: null,
    preferredMaterials: [], avoidColors: [], avoidStyles: [],
  }),
  searchKeywords:         stringArray,
  negativeSearchKeywords: stringArray,
  renderGuidance: z.object({
    placementNotes:    stringArray,
    scaleNotes:        stringArray,
    perspectiveNotes:  stringArray,
    shadowNotes:       stringArray,
    lightingNotes:     stringArray,
    occlusionNotes:    stringArray,
  }).default({
    placementNotes: [], scaleNotes: [], perspectiveNotes: [],
    shadowNotes: [], lightingNotes: [], occlusionNotes: [],
  }),
  confidence: z.object({
    roomUnderstanding: z.number().min(0).max(1).default(0),
    placement:         z.number().min(0).max(1).default(0),
    productIntent:     z.number().min(0).max(1).default(0),
  }).default({ roomUnderstanding: 0, placement: 0, productIntent: 0 }),
  needsUserClarification: z.boolean().default(false),
  clarificationQuestion:  nullableString,
});

// ── GeminiProductRankingResult ────────────────────────────────────────────────

export const GeminiProductRankingResultSchema = z.object({
  rankedProducts: z.array(z.object({
    productId:                   z.string(),
    geminiScore:                 z.number().min(0).max(100),
    whySelected:                 z.string(),
    fitReasons:                  stringArray,
    concerns:                    stringArray,
    recommendedPlacementIndex:   z.number().int().min(0).default(0),
  })),
  bestProductId: nullableString,
  summary:       z.string(),
});

export type RoomAnalysisSchemaType          = z.infer<typeof RoomAnalysisSchema>;
export type GeminiRankingResultSchemaType   = z.infer<typeof GeminiProductRankingResultSchema>;
export type UserPromptSchemaType            = z.infer<typeof UserRoomPromptInputSchema>;
