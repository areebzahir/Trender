import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { saveSession, getSession } from '@/services/storageService';
import type { DesignSession } from '@/types/designSession';
import type { RoomAnalysis } from '@/types/roomAnalysis';

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const roomAnalysisArb: fc.Arbitrary<RoomAnalysis> = fc.record({
  roomType: fc.constantFrom('living room', 'bedroom', 'dining room'),
  currentStyle: fc.constantFrom('modern', 'minimalist', 'cozy', 'luxury'),
  detectedColors: fc.array(fc.string({ minLength: 2, maxLength: 15 }), { minLength: 1, maxLength: 4 }),
  recommendedPalette: fc.array(fc.string({ minLength: 2, maxLength: 15 }), { minLength: 1, maxLength: 4 }),
  designGoal: fc.string({ minLength: 5, maxLength: 60 }),
  missingItems: fc.array(fc.string({ minLength: 2, maxLength: 20 }), { minLength: 0, maxLength: 4 }),
  recommendedCategories: fc.array(fc.constantFrom('sofa', 'lamp', 'rug', 'table'), { minLength: 1, maxLength: 4 }),
  reasoning: fc.string({ minLength: 10, maxLength: 200 }),
});

const saveDesignRequestArb = fc.record({
  imageUrl: fc.webUrl(),
  analysis: roomAnalysisArb,
  selectedProductIds: fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }),
  previewImageUrl: fc.option(fc.webUrl(), { nil: null }),
});

// ─── Property 15: Save-design round trip ──────────────────────────────────────
// Feature: ai-room-personalization, Property 15: Save-design round trip
// Validates: Requirements 9.1, 9.2
describe('Property 15: Save-design round trip', () => {
  it('getSession returns a DesignSession deeply equal to the saved request values', async () => {
    await fc.assert(
      fc.asyncProperty(saveDesignRequestArb, async (request) => {
        const saved = await saveSession(request);

        // Retrieve by ID
        const retrieved = await getSession(saved.id);
        expect(retrieved).not.toBeNull();

        const session = retrieved as DesignSession;

        // Core fields must match
        expect(session.imageUrl).toBe(request.imageUrl);
        expect(session.selectedProductIds).toEqual(request.selectedProductIds);
        expect(session.previewImageUrl).toBe(request.previewImageUrl);

        // Analysis must be deeply equal
        expect(session.analysis.roomType).toBe(request.analysis.roomType);
        expect(session.analysis.currentStyle).toBe(request.analysis.currentStyle);
        expect(session.analysis.designGoal).toBe(request.analysis.designGoal);
        expect(session.analysis.reasoning).toBe(request.analysis.reasoning);
        expect(session.analysis.detectedColors).toEqual(request.analysis.detectedColors);
        expect(session.analysis.recommendedPalette).toEqual(request.analysis.recommendedPalette);
        expect(session.analysis.missingItems).toEqual(request.analysis.missingItems);
        expect(session.analysis.recommendedCategories).toEqual(request.analysis.recommendedCategories);
      }),
      { numRuns: 50 }
    );
  });

  it('returns null for a non-existent session ID', async () => {
    // Use a fixed prefix that will never match a real UUID to avoid collisions
    const result = await getSession('nonexistent-00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });
});

// ─── Property 16: Save-design response shape ──────────────────────────────────
// Feature: ai-room-personalization, Property 16: Save-design response shape
// Validates: Requirements 9.2
describe('Property 16: Save-design response shape', () => {
  it('returns a non-empty id string and a valid ISO 8601 createdAt for any valid request', async () => {
    await fc.assert(
      fc.asyncProperty(saveDesignRequestArb, async (request) => {
        const saved = await saveSession(request);

        // id must be a non-empty string
        expect(typeof saved.id).toBe('string');
        expect(saved.id.length).toBeGreaterThan(0);

        // createdAt must parse as a valid date
        const date = new Date(saved.createdAt);
        expect(isNaN(date.getTime())).toBe(false);

        // createdAt must be an ISO 8601 string (contains 'T' and 'Z' or offset)
        expect(saved.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      }),
      { numRuns: 50 }
    );
  });

  it('generates unique IDs for each saved session', async () => {
    const ids = new Set<string>();
    await fc.assert(
      fc.asyncProperty(saveDesignRequestArb, async (request) => {
        const saved = await saveSession(request);
        expect(ids.has(saved.id)).toBe(false);
        ids.add(saved.id);
      }),
      { numRuns: 30 }
    );
  });
});
