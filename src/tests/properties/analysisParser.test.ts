import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  parseAnalysisResponse,
  validatePrompt,
} from '@/services/aiRoomAnalysisService';
import type { RoomAnalysis } from '@/types/roomAnalysis';
import { ROOM_ANALYSIS_REQUIRED_FIELDS } from '@/types/roomAnalysis';

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const stringArray = fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 });

const validRoomAnalysisArb: fc.Arbitrary<RoomAnalysis> = fc.record({
  roomType: fc.string({ minLength: 1, maxLength: 30 }),
  currentStyle: fc.string({ minLength: 1, maxLength: 30 }),
  detectedColors: stringArray,
  recommendedPalette: stringArray,
  designGoal: fc.string({ minLength: 1, maxLength: 60 }),
  missingItems: stringArray,
  recommendedCategories: stringArray,
  reasoning: fc.string({ minLength: 1, maxLength: 200 }),
});

// ─── Property 5: RoomAnalysis parser completeness ─────────────────────────────
// Feature: ai-room-personalization, Property 5: RoomAnalysis parser completeness
// Validates: Requirements 3.3
describe('Property 5: RoomAnalysis parser completeness', () => {
  it('returns a RoomAnalysis with all 8 fields for any valid JSON containing all required fields', () => {
    fc.assert(
      fc.property(validRoomAnalysisArb, (analysis) => {
        const rawText = JSON.stringify(analysis);
        const result = parseAnalysisResponse(rawText);

        // Must not be an error object
        expect('error' in result).toBe(false);

        const parsed = result as RoomAnalysis;
        for (const field of ROOM_ANALYSIS_REQUIRED_FIELDS) {
          expect(parsed[field]).not.toBeNull();
          expect(parsed[field]).not.toBeUndefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('handles JSON wrapped in markdown code fences', () => {
    fc.assert(
      fc.property(validRoomAnalysisArb, (analysis) => {
        const wrapped = `\`\`\`json\n${JSON.stringify(analysis)}\n\`\`\``;
        const result = parseAnalysisResponse(wrapped);
        expect('error' in result).toBe(false);
      }),
      { numRuns: 50 }
    );
  });
});

// ─── Property 6: Malformed AI response returns error object ───────────────────
// Feature: ai-room-personalization, Property 6: Malformed AI response returns error object
// Validates: Requirements 3.4, 11.5
describe('Property 6: Malformed AI response returns error object', () => {
  it('returns { error: string } for any non-JSON string without throwing', () => {
    fc.assert(
      fc.property(
        // Generate strings that are definitely not valid JSON
        fc.string({ minLength: 0, maxLength: 200 }).filter(s => {
          try { JSON.parse(s); return false; } catch { return true; }
        }),
        (invalidJson) => {
          expect(() => {
            const result = parseAnalysisResponse(invalidJson);
            expect('error' in result).toBe(true);
            expect(typeof (result as { error: string }).error).toBe('string');
          }).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns { error: string } for valid JSON missing one or more required fields', () => {
    fc.assert(
      fc.property(
        // Pick a random subset of required fields to omit (at least 1)
        fc.subarray([...ROOM_ANALYSIS_REQUIRED_FIELDS], { minLength: 1, maxLength: ROOM_ANALYSIS_REQUIRED_FIELDS.length }),
        validRoomAnalysisArb,
        (fieldsToOmit, analysis) => {
          const partial = { ...analysis } as Record<string, unknown>;
          for (const field of fieldsToOmit) {
            delete partial[field];
          }
          const result = parseAnalysisResponse(JSON.stringify(partial));
          expect('error' in result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 7: Server-side prompt validation rejects invalid inputs ─────────
// Feature: ai-room-personalization, Property 7: Server-side prompt validation rejects invalid inputs
// Validates: Requirements 3.6, 11.2
describe('Property 7: Server-side prompt validation rejects invalid inputs', () => {
  it('returns a non-null error for empty string', () => {
    expect(validatePrompt('')).not.toBeNull();
  });

  it('returns a non-null error for any whitespace-only string', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 50 }),
        (ws) => {
          const result = validatePrompt(ws);
          expect(result).not.toBeNull();
          expect(typeof result).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns a non-null error for any string longer than 500 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 501, maxLength: 1000 }),
        (longPrompt) => {
          const result = validatePrompt(longPrompt);
          expect(result).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns null for any valid prompt (1–500 chars, non-whitespace)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        (validPrompt) => {
          expect(() => {
            const result = validatePrompt(validPrompt);
            expect(result).toBeNull();
          }).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});
