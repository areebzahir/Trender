/**
 * productRecommendationService — pure matching logic for AI-driven product recommendations.
 *
 * This module is intentionally free of side effects and external dependencies
 * so it can be used both in Netlify Functions and in unit/property tests.
 */

import type { Product } from '../types/product';
import type { RoomAnalysis } from '../types/roomAnalysis';

// ─── Budget extraction ────────────────────────────────────────────────────────

const BUDGET_PATTERNS: RegExp[] = [
  /under\s+\$?([\d,]+)/i,
  /less\s+than\s+\$?([\d,]+)/i,
  /below\s+\$?([\d,]+)/i,
  /budget\s+(?:of\s+)?\$?([\d,]+)/i,
  /max(?:imum)?\s+\$?([\d,]+)/i,
  /no\s+more\s+than\s+\$?([\d,]+)/i,
  /\$?([\d,]+)\s+(?:or\s+)?(?:less|under|max)/i,
];

/**
 * Extracts a numeric budget limit from a free-text prompt.
 * Returns null if no budget constraint is found.
 */
export function extractBudget(prompt: string): number | null {
  for (const pattern of BUDGET_PATTERNS) {
    const match = prompt.match(pattern);
    if (match?.[1]) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(value) && value > 0) return value;
    }
  }
  return null;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Scores a product against a RoomAnalysis by counting matching tags.
 * Higher score = better match.
 */
export function scoreProduct(product: Product, analysis: RoomAnalysis): number {
  let score = 0;

  const normalize = (s: string) => s.toLowerCase().trim();
  const analysisCategories = analysis.recommendedCategories.map(normalize);
  const analysisPalette = analysis.recommendedPalette.map(normalize);
  const analysisStyle = [analysis.currentStyle, analysis.designGoal]
    .join(' ')
    .toLowerCase();
  const analysisRoom = normalize(analysis.roomType);

  // Category match — highest weight (3 points)
  if (analysisCategories.some(cat => normalize(product.category).includes(cat) || cat.includes(normalize(product.category)))) {
    score += 3;
  }

  // Color match (1 point per matching tag, max 3)
  const colorMatches = product.colorTags.filter(tag =>
    analysisPalette.some(p => p.includes(normalize(tag)) || normalize(tag).includes(p))
  ).length;
  score += Math.min(colorMatches, 3);

  // Style match (1 point per matching tag, max 3)
  const styleMatches = product.styleTags.filter(tag =>
    analysisStyle.includes(normalize(tag))
  ).length;
  score += Math.min(styleMatches, 3);

  // Room match (2 points)
  if (product.roomTags.some(tag => normalize(tag).includes(analysisRoom) || analysisRoom.includes(normalize(tag)))) {
    score += 2;
  }

  // Material match against reasoning (1 point per match, max 2)
  const reasoningLower = analysis.reasoning.toLowerCase();
  const materialMatches = product.materialTags.filter(tag =>
    reasoningLower.includes(normalize(tag))
  ).length;
  score += Math.min(materialMatches, 2);

  return score;
}

// ─── Main recommendation function ────────────────────────────────────────────

/**
 * Returns products from the catalogue that best match the RoomAnalysis.
 *
 * Matching strategy:
 * 1. Filter by all four dimensions (category, color, style, room).
 * 2. Apply budget filter if budgetLimit is provided.
 * 3. If no products pass all filters, fall back to category-only matching.
 * 4. Sort by relevance score descending.
 */
export function recommendProducts(
  analysis: RoomAnalysis,
  catalogue: Product[],
  budgetLimit?: number
): Product[] {
  const normalize = (s: string) => s.toLowerCase().trim();
  const analysisCategories = analysis.recommendedCategories.map(normalize);
  const analysisPalette = analysis.recommendedPalette.map(normalize);
  const analysisStyle = [analysis.currentStyle, analysis.designGoal]
    .join(' ')
    .toLowerCase();
  const analysisRoom = normalize(analysis.roomType);

  const matchesCategory = (p: Product) =>
    analysisCategories.some(
      cat => normalize(p.category).includes(cat) || cat.includes(normalize(p.category))
    );

  const matchesColor = (p: Product) =>
    p.colorTags.some(tag =>
      analysisPalette.some(pal => pal.includes(normalize(tag)) || normalize(tag).includes(pal))
    );

  const matchesStyle = (p: Product) =>
    p.styleTags.some(tag => analysisStyle.includes(normalize(tag)));

  const matchesRoom = (p: Product) =>
    p.roomTags.some(
      tag => normalize(tag).includes(analysisRoom) || analysisRoom.includes(normalize(tag))
    );

  const withinBudget = (p: Product) =>
    budgetLimit === undefined || p.price <= budgetLimit;

  // Full match: all four dimensions + budget
  let matched = catalogue.filter(
    p => matchesCategory(p) && matchesColor(p) && matchesStyle(p) && matchesRoom(p) && withinBudget(p)
  );

  // Partial match: category + budget (relax color/style/room)
  if (matched.length === 0) {
    matched = catalogue.filter(p => matchesCategory(p) && withinBudget(p));
  }

  // Last resort: just budget filter (return something rather than nothing)
  if (matched.length === 0) {
    matched = catalogue.filter(p => withinBudget(p));
  }

  // Sort by relevance score descending
  return matched
    .map(p => ({ product: p, score: scoreProduct(p, analysis) }))
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);
}
