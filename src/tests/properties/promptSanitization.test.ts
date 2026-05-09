import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sanitizePrompt } from '@/services/aiRoomAnalysisService';

// Known injection patterns that must be stripped
const INJECTION_PHRASES = [
  'ignore previous instructions',
  'ignore above instructions',
  'you are now',
  'disregard all',
  'disregard previous',
  'system:',
  '<|im_start|>',
  '<|im_end|>',
];

// Regex patterns that should NOT appear in sanitized output
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above)\s+instructions?/i,
  /you\s+are\s+now/i,
  /disregard\s+(all|previous|above|the)/i,
  /system\s*:/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
];

// ─── Property 10: Prompt sanitization removes injection patterns ──────────────
// Feature: ai-room-personalization, Property 10: Prompt sanitization removes injection patterns
// Validates: Requirements 11.4
describe('Property 10: Prompt sanitization removes injection patterns', () => {
  it('removes all known injection phrases from any prompt that contains them', () => {
    fc.assert(
      fc.property(
        // Pick one or more injection phrases to embed
        fc.subarray(INJECTION_PHRASES, { minLength: 1, maxLength: INJECTION_PHRASES.length }),
        // Surrounding benign text
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 50 }),
        (phrases, prefix, suffix) => {
          const injected = `${prefix} ${phrases.join(' ')} ${suffix}`;
          const sanitized = sanitizePrompt(injected);

          for (const pattern of INJECTION_PATTERNS) {
            expect(pattern.test(sanitized)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('truncates output to 500 characters', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 501, maxLength: 2000 }),
        (longPrompt) => {
          const sanitized = sanitizePrompt(longPrompt);
          expect(sanitized.length).toBeLessThanOrEqual(500);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('preserves benign prompts (no injection patterns)', () => {
    const benignPrompts = [
      'Make this room look modern and cozy',
      'Add a beige sofa and warm lighting',
      'Show me furniture under $800',
      'Scandinavian minimalist style please',
    ];

    for (const prompt of benignPrompts) {
      const sanitized = sanitizePrompt(prompt);
      // Benign prompts should not be emptied
      expect(sanitized.length).toBeGreaterThan(0);
      // Should not contain injection patterns
      for (const pattern of INJECTION_PATTERNS) {
        expect(pattern.test(sanitized)).toBe(false);
      }
    }
  });
});
