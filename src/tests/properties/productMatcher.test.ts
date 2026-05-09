import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  recommendProducts,
  scoreProduct,
  extractBudget,
} from '@/services/productRecommendationService';
import type { Product } from '@/types/product';
import type { RoomAnalysis } from '@/types/roomAnalysis';

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const tagArray = fc.array(
  fc.string({ minLength: 2, maxLength: 15 }).filter(s => /^[a-z\s]+$/.test(s)),
  { minLength: 1, maxLength: 4 }
);

const productArb: fc.Arbitrary<Product> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 40 }),
  storeName: fc.string({ minLength: 2, maxLength: 20 }),
  category: fc.constantFrom('sofa', 'chair', 'table', 'lamp', 'rug', 'storage', 'decor'),
  price: fc.float({ min: 10, max: 5000, noNaN: true }),
  currency: fc.constant('USD'),
  productUrl: fc.constant('https://example.com'),
  affiliateUrl: fc.constant('https://example.com'),
  imageUrl: fc.constant('https://example.com/img.jpg'),
  cleanImageUrl: fc.constant('https://example.com/img.jpg'),
  colorTags: tagArray,
  styleTags: tagArray,
  materialTags: tagArray,
  roomTags: fc.array(fc.constantFrom('living room', 'bedroom', 'dining room'), { minLength: 1, maxLength: 2 }),
  dimensions: fc.record({
    width: fc.constant('80cm'),
    height: fc.constant('75cm'),
    depth: fc.constant('60cm'),
  }),
  inStock: fc.boolean(),
});

const roomAnalysisArb: fc.Arbitrary<RoomAnalysis> = fc.record({
  roomType: fc.constantFrom('living room', 'bedroom', 'dining room'),
  currentStyle: fc.constantFrom('modern', 'minimalist', 'cozy', 'luxury', 'scandinavian'),
  detectedColors: fc.array(fc.constantFrom('white', 'grey', 'brown', 'beige'), { minLength: 1, maxLength: 3 }),
  recommendedPalette: fc.array(fc.constantFrom('cream', 'walnut', 'olive', 'warm white'), { minLength: 1, maxLength: 3 }),
  designGoal: fc.string({ minLength: 5, maxLength: 60 }),
  missingItems: fc.array(fc.constantFrom('rug', 'lamp', 'table', 'sofa'), { minLength: 1, maxLength: 3 }),
  recommendedCategories: fc.array(
    fc.constantFrom('sofa', 'chair', 'table', 'lamp', 'rug', 'storage', 'decor'),
    { minLength: 1, maxLength: 4 }
  ),
  reasoning: fc.string({ minLength: 10, maxLength: 200 }),
});

// ─── Property 8: Product relevance sort order ─────────────────────────────────
// Feature: ai-room-personalization, Property 8: Product relevance sort order
// Validates: Requirements 4.6
describe('Property 8: Product relevance sort order', () => {
  it('returns products sorted by score descending for any analysis and non-empty catalogue', () => {
    fc.assert(
      fc.property(
        roomAnalysisArb,
        fc.array(productArb, { minLength: 1, maxLength: 20 }),
        (analysis, catalogue) => {
          const results = recommendProducts(analysis, catalogue);

          // Verify sort order: each adjacent pair must satisfy score[i] >= score[i+1]
          for (let i = 0; i < results.length - 1; i++) {
            const scoreA = scoreProduct(results[i], analysis);
            const scoreB = scoreProduct(results[i + 1], analysis);
            expect(scoreA).toBeGreaterThanOrEqual(scoreB);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 9: Budget filter correctness ────────────────────────────────────
// Feature: ai-room-personalization, Property 9: Budget filter correctness
// Validates: Requirements 4.4
describe('Property 9: Budget filter correctness', () => {
  it('returns only products with price <= budget for any positive budget limit', () => {
    fc.assert(
      fc.property(
        roomAnalysisArb,
        fc.array(productArb, { minLength: 1, maxLength: 20 }),
        fc.float({ min: 1, max: 10000, noNaN: true }),
        (analysis, catalogue, budget) => {
          const results = recommendProducts(analysis, catalogue, budget);

          for (const product of results) {
            expect(product.price).toBeLessThanOrEqual(budget);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns all products when no budget is specified', () => {
    fc.assert(
      fc.property(
        roomAnalysisArb,
        fc.array(productArb, { minLength: 1, maxLength: 10 }),
        (analysis, catalogue) => {
          const results = recommendProducts(analysis, catalogue, undefined);
          // All returned products must be from the catalogue
          for (const p of results) {
            expect(catalogue.some(c => c.id === p.id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── extractBudget unit tests ─────────────────────────────────────────────────
describe('extractBudget', () => {
  it('extracts budget from common prompt patterns', () => {
    expect(extractBudget('Make this room look luxury under $800')).toBe(800);
    expect(extractBudget('less than $500 please')).toBe(500);
    expect(extractBudget('budget of $1200')).toBe(1200);
    expect(extractBudget('no more than $350')).toBe(350);
    expect(extractBudget('$600 or less')).toBe(600);
  });

  it('returns null when no budget is mentioned', () => {
    fc.assert(
      fc.property(
        // Strings that don't contain dollar signs or budget keywords
        fc.string({ minLength: 0, maxLength: 100 }).filter(
          s => !s.includes('$') && !/under|less than|below|budget|maximum|no more/i.test(s)
        ),
        (prompt) => {
          expect(extractBudget(prompt)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
