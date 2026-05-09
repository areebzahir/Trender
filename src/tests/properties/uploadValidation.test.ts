import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateImageFile,
  isPromptValid,
  isFormReady,
} from '@/components/RoomUploadPage';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

// Helper: create a minimal File-like object for testing
function makeFile(name: string, type: string, size: number): File {
  const blob = new Blob([new Uint8Array(Math.min(size, 1))], { type });
  return new File([blob], name, { type });
}

// ─── Property 1: File size rejection ─────────────────────────────────────────
// Feature: ai-room-personalization, Property 1: File size rejection
// Validates: Requirements 2.2, 11.1
describe('Property 1: File size rejection', () => {
  it('rejects any file whose size exceeds 10 MB with a non-empty error message', () => {
    fc.assert(
      fc.property(
        // Generate sizes strictly above the limit
        fc.integer({ min: MAX_SIZE + 1, max: MAX_SIZE * 3 }),
        fc.constantFrom(...ALLOWED_TYPES),
        (size, mimeType) => {
          // We can't actually create a File of arbitrary size in jsdom,
          // so we test the validation logic directly by mocking File.size
          const file = makeFile('room.jpg', mimeType, 1);
          Object.defineProperty(file, 'size', { value: size });
          const result = validateImageFile(file);
          expect(result).not.toBeNull();
          expect(typeof result).toBe('string');
          expect((result as string).length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 2: MIME type rejection ─────────────────────────────────────────
// Feature: ai-room-personalization, Property 2: MIME type rejection
// Validates: Requirements 2.3, 11.1
describe('Property 2: MIME type rejection', () => {
  it('rejects any MIME type that is not jpeg, png, or webp', () => {
    const invalidTypes = [
      'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml',
      'application/pdf', 'text/plain', 'video/mp4', 'audio/mpeg',
      'image/heic', 'image/avif',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...invalidTypes),
        (mimeType) => {
          const file = makeFile('room.gif', mimeType, 1024);
          const result = validateImageFile(file);
          expect(result).not.toBeNull();
          expect(typeof result).toBe('string');
          expect((result as string).length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts all three valid MIME types when size is within limit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALLOWED_TYPES),
        (mimeType) => {
          const file = makeFile('room.jpg', mimeType, 1024);
          const result = validateImageFile(file);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 3: Whitespace prompt disables submission ────────────────────────
// Feature: ai-room-personalization, Property 3: Whitespace prompt disables submission
// Validates: Requirements 2.5, 11.2
describe('Property 3: Whitespace prompt disables submission', () => {
  it('returns false for any string composed entirely of whitespace characters', () => {
    fc.assert(
      fc.property(
        // Generate strings of only whitespace characters
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r', '\u00A0'), { minLength: 0, maxLength: 50 }),
        (whitespacePrompt) => {
          expect(isPromptValid(whitespacePrompt)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false for empty string', () => {
    expect(isPromptValid('')).toBe(false);
  });
});

// ─── Property 4: Valid inputs enable submission ───────────────────────────────
// Feature: ai-room-personalization, Property 4: Valid inputs enable submission
// Validates: Requirements 2.6
describe('Property 4: Valid inputs enable submission', () => {
  it('returns true when a valid image file and non-empty prompt are both present', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALLOWED_TYPES),
        // Generate non-empty, non-whitespace strings up to 500 chars
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        (mimeType, prompt) => {
          const file = makeFile('room.jpg', mimeType, 1024);
          expect(isFormReady(file, prompt)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false when file is null regardless of prompt', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        (prompt) => {
          expect(isFormReady(null, prompt)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
