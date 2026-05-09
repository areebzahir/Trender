/**
 * RoomAnalysis — the structured JSON object returned by the AI room analyzer.
 * All fields are required; the server guarantees their presence before returning.
 */
export interface RoomAnalysis {
  /** e.g. "living room", "bedroom", "home office" */
  roomType: string;
  /** e.g. "Scandinavian minimalist", "cozy rustic", "modern luxury" */
  currentStyle: string;
  /** Colours observed in the uploaded image, e.g. ["white", "grey", "brown"] */
  detectedColors: string[];
  /** AI-suggested complementary colours, e.g. ["cream", "walnut", "olive green"] */
  recommendedPalette: string[];
  /** Parsed design goal from the user prompt, e.g. "modern cozy living room" */
  designGoal: string;
  /** Items the AI thinks are absent or would improve the room */
  missingItems: string[];
  /** Product categories to surface, e.g. ["sofa", "rug", "lamp"] */
  recommendedCategories: string[];
  /** Human-readable explanation of why these choices fit the room and prompt */
  reasoning: string;
}

/** The eight required field names — used for runtime validation. */
export const ROOM_ANALYSIS_REQUIRED_FIELDS: ReadonlyArray<keyof RoomAnalysis> = [
  'roomType',
  'currentStyle',
  'detectedColors',
  'recommendedPalette',
  'designGoal',
  'missingItems',
  'recommendedCategories',
  'reasoning',
] as const;
