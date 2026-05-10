/**
 * types — all shared TypeScript types for the room overlay intelligence pipeline.
 */

export type UserRoomPromptInput = {
  originalPrompt: string;
  detectedLanguage: string | null;
  translatedPrompt: string;
  normalizedPrompt: string;
  safetyFlags: string[];
};

export type PlacementRecommendation = {
  zoneLabel: string;
  targetSurface: 'floor' | 'wall' | 'tabletop' | 'ceiling' | 'unknown';
  /** 0–1 relative to image width */
  xRelative: number;
  /** 0–1 relative to image height */
  yRelative: number;
  widthRelative: number;
  heightRelative: number;
  anchor: 'bottom-center' | 'center' | 'top-center' | 'left-wall' | 'right-wall';
  depthLayer: 'foreground' | 'midground' | 'background';
  reason: string;
  risks: string[];
};

export type RoomAnalysis = {
  roomType: string | null;
  designStyleDetected: string[];
  dominantColors: string[];
  colorPalette: {
    walls: string[];
    floor: string[];
    furniture: string[];
    accents: string[];
  };
  lighting: {
    brightness: 'low' | 'medium' | 'high' | null;
    direction: 'left' | 'right' | 'front' | 'back' | 'overhead' | 'unknown';
    warmth: 'cool' | 'neutral' | 'warm' | null;
    notes: string[];
  };
  surfaces: {
    floorType: string | null;
    wallColor: string | null;
    openSpaceDescription: string | null;
  };
  existingFurniture: {
    item: string;
    approximatePosition: string;
    color: string | null;
    material: string | null;
  }[];
  requestedItem: {
    originalUserRequest: string;
    translatedUserRequest: string;
    category: string | null;
    furnitureType: string | null;
    quantity: number;
    stylePreferences: string[];
    colorPreferences: string[];
    materialPreferences: string[];
    comfortKeywords: string[];
    placementGoal: string | null;
    constraints: string[];
  };
  placementRecommendations: PlacementRecommendation[];
  recommendedProductConstraints: {
    maxWidthCm: number | null;
    maxDepthCm: number | null;
    maxHeightCm: number | null;
    minWidthCm: number | null;
    preferredMaterials: string[];
    avoidColors: string[];
    avoidStyles: string[];
  };
  searchKeywords: string[];
  negativeSearchKeywords: string[];
  renderGuidance: {
    placementNotes: string[];
    scaleNotes: string[];
    perspectiveNotes: string[];
    shadowNotes: string[];
    lightingNotes: string[];
    occlusionNotes: string[];
  };
  confidence: {
    roomUnderstanding: number;
    placement: number;
    productIntent: number;
  };
  needsUserClarification: boolean;
  clarificationQuestion: string | null;
};

export type ProductCandidate = {
  id: string;
  title: string;
  storeName: string | null;
  price: number | null;
  currency: string | null;
  productUrl: string;
  imageUrl: string;
  imageUrls: string[];
  category: string | null;
  furnitureType: string | null;
  roomType: string | null;
  colors: string[];
  materials: string[];
  styleTags: string[];
  aestheticTags: string[];
  widthCm: number | null;
  heightCm: number | null;
  depthCm: number | null;
  structuredScore: number;
  geminiScore?: number;
  finalScore: number;
  whySelected: string;
  renderWarnings: string[];
};

export type GeminiProductRankingInput = {
  userPrompt: UserRoomPromptInput;
  roomAnalysis: RoomAnalysis;
  candidates: ProductCandidate[];
};

export type GeminiProductRankingResult = {
  rankedProducts: {
    productId: string;
    geminiScore: number;
    whySelected: string;
    fitReasons: string[];
    concerns: string[];
    recommendedPlacementIndex: number;
  }[];
  bestProductId: string | null;
  summary: string;
};

/** Final output of the full pipeline — handed off to the compositor. */
export type RoomOverlayResult = {
  userPrompt: UserRoomPromptInput;
  roomAnalysis: RoomAnalysis;
  selectedProduct: ProductCandidate | null;
  placement: PlacementRecommendation | null;
  renderGuidance: RoomAnalysis['renderGuidance'];
  allCandidates: ProductCandidate[];
  needsUserClarification: boolean;
  clarificationQuestion: string | null;
};
