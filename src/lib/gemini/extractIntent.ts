/**
 * extractIntent — extracts strict furniture intent from the user's prompt.
 * This runs BEFORE room analysis and enforces category as a hard filter.
 * SERVER-SIDE ONLY.
 */

import { callGemini } from './geminiClient';
import { parseGeminiJson } from './parseGeminiJson';

export type FurnitureCategory =
  | 'sofa' | 'sectional' | 'loveseat' | 'sleeper_sofa'
  | 'armchair' | 'accent_chair' | 'lounge_chair' | 'recliner'
  | 'dining_chair' | 'office_chair' | 'bar_stool' | 'bench' | 'ottoman'
  | 'coffee_table' | 'side_table' | 'console_table' | 'dining_table'
  | 'desk' | 'nightstand' | 'dresser' | 'wardrobe'
  | 'bed_frame' | 'mattress' | 'bunk_bed'
  | 'bookshelf' | 'storage_cabinet' | 'tv_stand' | 'media_console'
  | 'rug' | 'lamp' | 'floor_lamp' | 'pendant_light'
  | 'mirror' | 'wall_art' | 'decor' | 'patio_set'
  | 'outdoor_chair' | 'outdoor_table'
  | 'unclear' | 'other';

export interface FurnitureIntent {
  requestedCategory: FurnitureCategory;
  specificItem: string;
  requiresClarification: boolean;
  clarificationQuestion: string | null;
  requiredAttributes: {
    color: string[];
    material: string[];
    style: string[];
    size: 'small' | 'medium' | 'large' | 'unknown';
    roomType: 'living_room' | 'bedroom' | 'dining_room' | 'office' | 'nursery' | 'entryway' | 'other' | 'unknown';
    budgetMin: number | null;
    budgetMax: number | null;
  };
  hardFilters: {
    mustMatchCategory: boolean;
    mustMatchColorIfProvided: boolean;
    mustMatchSizeIfProvided: boolean;
  };
  softPreferences: {
    styleCompatibility: string[];
    avoid: string[];
  };
  /** DB category values to use in Supabase query */
  dbCategories: string[];
}

/** Maps intent category to Supabase DB category enum values. */
const CATEGORY_TO_DB: Record<string, string[]> = {
  sofa:           ['sofa', 'sectional', 'loveseat'],
  sectional:      ['sectional', 'sofa'],
  loveseat:       ['loveseat', 'sofa'],
  sleeper_sofa:   ['sofa'],
  armchair:       ['armchair', 'accent_chair'],
  accent_chair:   ['accent_chair', 'armchair'],
  lounge_chair:   ['armchair', 'accent_chair'],
  recliner:       ['armchair'],
  dining_chair:   ['dining_chair'],
  office_chair:   ['office_chair'],
  bar_stool:      ['dining_chair'],
  bench:          ['bench', 'dining_chair'],
  ottoman:        ['armchair', 'accent_chair'],
  coffee_table:   ['coffee_table'],
  side_table:     ['side_table'],
  console_table:  ['side_table', 'coffee_table'],
  dining_table:   ['dining_table'],
  desk:           ['desk'],
  nightstand:     ['nightstand'],
  dresser:        ['dresser'],
  wardrobe:       ['wardrobe'],
  bed_frame:      ['bed_frame'],
  mattress:       ['mattress'],
  bunk_bed:       ['bed_frame'],
  bookshelf:      ['bookshelf'],
  storage_cabinet:['storage_cabinet'],
  tv_stand:       ['tv_stand', 'media_console'],
  media_console:  ['media_console', 'tv_stand'],
  rug:            ['rug'],
  lamp:           ['lighting'],
  floor_lamp:     ['lighting'],
  pendant_light:  ['lighting'],
  mirror:         ['mirror'],
  wall_art:       ['decor'],
  decor:          ['decor'],
};

/** Fast local keyword extraction — runs before Gemini as a safety net. */
function extractCategoryLocally(prompt: string): { category: FurnitureCategory; dbCategories: string[] } | null {
  const p = prompt.toLowerCase();

  const KEYWORD_MAP: Array<[string[], FurnitureCategory]> = [
    [['sofa', 'couch', 'sectional', 'loveseat', 'chesterfield'], 'sofa'],
    [['sleeper sofa', 'sofa bed', 'pull-out'], 'sleeper_sofa'],
    [['armchair', 'accent chair', 'lounge chair', 'reading chair'], 'armchair'],
    [['recliner'], 'recliner'],
    [['dining chair', 'kitchen chair'], 'dining_chair'],
    [['office chair', 'desk chair', 'ergonomic chair'], 'office_chair'],
    [['bar stool', 'counter stool'], 'bar_stool'],
    [['ottoman', 'footstool', 'pouf'], 'ottoman'],
    [['bench'], 'bench'],
    [['coffee table'], 'coffee_table'],
    [['side table', 'end table', 'accent table'], 'side_table'],
    [['console table', 'entryway table', 'hallway table'], 'console_table'],
    [['dining table', 'kitchen table', 'dinner table'], 'dining_table'],
    [['desk', 'writing table', 'work table'], 'desk'],
    [['nightstand', 'bedside table', 'night table'], 'nightstand'],
    [['dresser', 'chest of drawers', 'bureau'], 'dresser'],
    [['wardrobe', 'armoire', 'closet'], 'wardrobe'],
    [['bed frame', 'bed', 'headboard', 'platform bed'], 'bed_frame'],
    [['mattress'], 'mattress'],
    [['bunk bed'], 'bunk_bed'],
    [['bookshelf', 'bookcase', 'shelving', 'shelf'], 'bookshelf'],
    [['storage cabinet', 'cabinet', 'credenza', 'sideboard'], 'storage_cabinet'],
    [['tv stand', 'tv unit', 'media console', 'entertainment center', 'media unit'], 'tv_stand'],
    [['rug', 'carpet', 'area rug'], 'rug'],
    [['floor lamp', 'standing lamp'], 'floor_lamp'],
    [['pendant light', 'chandelier', 'ceiling light'], 'pendant_light'],
    [['lamp', 'light', 'lighting'], 'lamp'],
    [['mirror'], 'mirror'],
    [['wall art', 'painting', 'artwork', 'picture frame'], 'wall_art'],
  ];

  for (const [keywords, category] of KEYWORD_MAP) {
    if (keywords.some(kw => p.includes(kw))) {
      return { category, dbCategories: CATEGORY_TO_DB[category] ?? [] };
    }
  }
  return null;
}

export async function extractIntent(prompt: string): Promise<FurnitureIntent> {
  // ── Step 1: Try local keyword extraction first ────────────────────────────
  // This is instant and never fails — used as safety net if Gemini is slow/fails
  const localMatch = extractCategoryLocally(prompt);
  // ── Step 2: Call Gemini for richer attribute extraction ──────────────────
  const intentPrompt = `You are a furniture intent parser for Trender, an interior design app.

Parse the user's furniture request and return strict JSON.

FURNITURE CATEGORIES (use exactly one):
sofa, sectional, loveseat, sleeper_sofa, armchair, accent_chair, lounge_chair, recliner,
dining_chair, office_chair, bar_stool, bench, ottoman,
coffee_table, side_table, console_table, dining_table, desk,
nightstand, dresser, wardrobe, bed_frame, mattress, bunk_bed,
bookshelf, storage_cabinet, tv_stand, media_console,
rug, lamp, floor_lamp, pendant_light, mirror, wall_art, decor,
patio_set, outdoor_chair, outdoor_table, unclear, other

RULES:
- If user asks for "sofa" or "couch" → requestedCategory: "sofa"
- If user asks for "coffee table" → requestedCategory: "coffee_table"
- If user asks for "desk" → requestedCategory: "desk"
- If user asks for "nightstand" → requestedCategory: "nightstand"
- If user asks for "TV stand" or "media console" → requestedCategory: "tv_stand"
- If user asks for "make my room look better" or is vague with no furniture type → requestedCategory: "unclear", requiresClarification: true
- If category is unclear, set clarificationQuestion to ask what furniture type they want
- Extract color, material, style, size from the prompt
- Extract budget if mentioned (e.g. "under $500" → budgetMax: 500)
- mustMatchCategory is ALWAYS true
- mustMatchColorIfProvided is true if color was specified
- mustMatchSizeIfProvided is true if size was specified

USER PROMPT: "${prompt.replace(/"/g, '\\"')}"

Return JSON only:
{
  "requestedCategory": string,
  "specificItem": string,
  "requiresClarification": boolean,
  "clarificationQuestion": string | null,
  "requiredAttributes": {
    "color": string[],
    "material": string[],
    "style": string[],
    "size": "small" | "medium" | "large" | "unknown",
    "roomType": "living_room" | "bedroom" | "dining_room" | "office" | "nursery" | "entryway" | "other" | "unknown",
    "budgetMin": number | null,
    "budgetMax": number | null
  },
  "hardFilters": {
    "mustMatchCategory": true,
    "mustMatchColorIfProvided": boolean,
    "mustMatchSizeIfProvided": boolean
  },
  "softPreferences": {
    "styleCompatibility": string[],
    "avoid": string[]
  }
}`;

  try {
    const raw = await callGemini(
      [{ role: 'user', parts: [{ text: intentPrompt }] }],
      { forceJson: true }
    );
    const parsed = parseGeminiJson<Record<string, unknown>>(raw);

    const category = String(parsed.requestedCategory ?? 'unclear') as FurnitureCategory;
    const attrs = (parsed.requiredAttributes ?? {}) as Record<string, unknown>;
    const hard = (parsed.hardFilters ?? {}) as Record<string, unknown>;
    const soft = (parsed.softPreferences ?? {}) as Record<string, unknown>;

    // If Gemini says unclear but local keyword matched, trust local match
    const finalCategory = (category === 'unclear' && localMatch)
      ? localMatch.category
      : category;

    const requiresClarification = finalCategory === 'unclear' || finalCategory === 'other'
      ? Boolean(parsed.requiresClarification)
      : false;

    return {
      requestedCategory: finalCategory,
      specificItem: String(parsed.specificItem ?? prompt),
      requiresClarification,
      clarificationQuestion: requiresClarification
        ? (parsed.clarificationQuestion ? String(parsed.clarificationQuestion) : 'What type of furniture are you looking for? (e.g. sofa, desk, coffee table)')
        : null,
      requiredAttributes: {
        color:     Array.isArray(attrs.color)    ? attrs.color.map(String)    : [],
        material:  Array.isArray(attrs.material) ? attrs.material.map(String) : [],
        style:     Array.isArray(attrs.style)    ? attrs.style.map(String)    : [],
        size:      (['small','medium','large'].includes(String(attrs.size)) ? attrs.size : 'unknown') as FurnitureIntent['requiredAttributes']['size'],
        roomType:  (['living_room','bedroom','dining_room','office','nursery','entryway','other'].includes(String(attrs.roomType)) ? attrs.roomType : 'unknown') as FurnitureIntent['requiredAttributes']['roomType'],
        budgetMin: typeof attrs.budgetMin === 'number' ? attrs.budgetMin : null,
        budgetMax: typeof attrs.budgetMax === 'number' ? attrs.budgetMax : null,
      },
      hardFilters: {
        mustMatchCategory:         true,
        mustMatchColorIfProvided:  Boolean(hard.mustMatchColorIfProvided),
        mustMatchSizeIfProvided:   Boolean(hard.mustMatchSizeIfProvided),
      },
      softPreferences: {
        styleCompatibility: Array.isArray(soft.styleCompatibility) ? soft.styleCompatibility.map(String) : [],
        avoid:              Array.isArray(soft.avoid)              ? soft.avoid.map(String)              : [],
      },
      dbCategories: CATEGORY_TO_DB[finalCategory] ?? localMatch?.dbCategories ?? [],
    };
  } catch {
    // Gemini failed — use local keyword match if available, otherwise ask for clarification
    if (localMatch) {
      return {
        requestedCategory: localMatch.category,
        specificItem: prompt,
        requiresClarification: false,
        clarificationQuestion: null,
        requiredAttributes: { color: [], material: [], style: [], size: 'unknown', roomType: 'unknown', budgetMin: null, budgetMax: null },
        hardFilters: { mustMatchCategory: true, mustMatchColorIfProvided: false, mustMatchSizeIfProvided: false },
        softPreferences: { styleCompatibility: [], avoid: [] },
        dbCategories: localMatch.dbCategories,
      };
    }
    // Truly unclear — ask for clarification
    return {
      requestedCategory: 'unclear',
      specificItem: prompt,
      requiresClarification: true,
      clarificationQuestion: 'What type of furniture are you looking for? (e.g. sofa, desk, coffee table)',
      requiredAttributes: { color: [], material: [], style: [], size: 'unknown', roomType: 'unknown', budgetMin: null, budgetMax: null },
      hardFilters: { mustMatchCategory: true, mustMatchColorIfProvided: false, mustMatchSizeIfProvided: false },
      softPreferences: { styleCompatibility: [], avoid: [] },
      dbCategories: [],
    };
  }
}
