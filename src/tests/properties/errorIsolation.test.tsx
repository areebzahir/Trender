import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { AIResultsPage } from '@/components/AIResultsPage';
import type { AIAnalysisResult } from '@/types/api';
import type { Product } from '@/types/product';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const baseAnalysis = {
  roomType: 'living room',
  currentStyle: 'modern',
  detectedColors: ['white', 'grey'],
  recommendedPalette: ['cream', 'walnut'],
  designGoal: 'modern cozy living room',
  missingItems: ['rug', 'lamp'],
  recommendedCategories: ['sofa', 'rug'],
  reasoning: 'These choices complement the existing neutral palette.',
};

const sampleProduct: Product = {
  id: 'test-p-001',
  name: 'Test Sofa',
  storeName: 'Test Store',
  category: 'sofa',
  price: 999,
  currency: 'USD',
  productUrl: 'https://example.com',
  affiliateUrl: 'https://example.com',
  imageUrl: 'https://example.com/img.jpg',
  cleanImageUrl: 'https://example.com/img.jpg',
  colorTags: ['cream'],
  styleTags: ['modern'],
  materialTags: ['fabric'],
  roomTags: ['living room'],
  dimensions: { width: '80cm', height: '75cm', depth: '60cm' },
  inStock: true,
};

function makeResult(overrides: Partial<AIAnalysisResult> = {}): AIAnalysisResult {
  return {
    imageBase64: 'dGVzdA==', // base64 for "test"
    imageUrl: 'data:image/jpeg;base64,dGVzdA==',
    analysis: baseAnalysis,
    products: [sampleProduct],
    previewUrl: null,
    isFallbackPreview: true,
    sessionId: 'test-session-001',
    ...overrides,
  };
}

// ─── Property 17: Error isolation — other sections remain visible ─────────────
// Feature: ai-room-personalization, Property 17: Error isolation — other sections remain visible
// Validates: Requirements 10.2, 10.4
describe('Property 17: Error isolation — other sections remain visible', () => {
  it('renders product cards even when preview generation fails (previewUrl is null)', () => {
    const result = makeResult({ previewUrl: null, products: [sampleProduct] });
    const { unmount } = render(
      <AIResultsPage
        result={result}
        onBack={() => {}}
        onStartOver={() => {}}
      />
    );

    // Products section must still be visible
    expect(screen.getByText('Test Sofa')).toBeTruthy();
    expect(screen.getByText('Test Store')).toBeTruthy();

    unmount();
  });

  it('renders the colour palette section regardless of preview state', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // previewUrl present or not
        (hasPreview) => {
          const result = makeResult({
            previewUrl: hasPreview ? 'https://example.com/preview.jpg' : null,
          });
          const { unmount } = render(
            <AIResultsPage
              result={result}
              onBack={() => {}}
              onStartOver={() => {}}
            />
          );

          // Colour palette section heading must always be present
          expect(screen.getByText(/colour palette/i)).toBeTruthy();

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('renders the analysis section regardless of product count', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constant(sampleProduct), { minLength: 0, maxLength: 5 }),
        (products) => {
          const result = makeResult({ products });
          const { unmount } = render(
            <AIResultsPage
              result={result}
              onBack={() => {}}
              onStartOver={() => {}}
            />
          );

          // Analysis section must always be present
          expect(screen.getByText(/room analysis/i)).toBeTruthy();

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ─── Property 18: No stack traces in user-facing error messages ───────────────
// Feature: ai-room-personalization, Property 18: No stack traces in user-facing error messages
// Validates: Requirements 10.5
describe('Property 18: No stack traces in user-facing error messages', () => {
  const STACK_FRAME_PATTERN = /at\s+\w+\s*\(/;
  const FILE_PATH_PATTERN = /(?:\/[\w.-]+){2,}|(?:[A-Z]:\\[\w\\.-]+)/;

  it('does not render stack frame patterns in the AIResultsPage UI', () => {
    const result = makeResult({ products: [] });
    const { unmount } = render(
      <AIResultsPage
        result={result}
        onBack={() => {}}
        onStartOver={() => {}}
      />
    );

    const bodyText = document.body.innerText ?? document.body.textContent ?? '';
    expect(STACK_FRAME_PATTERN.test(bodyText)).toBe(false);
    expect(FILE_PATH_PATTERN.test(bodyText)).toBe(false);

    unmount();
  });

  it('does not expose internal error details in rendered text for any product count', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constant(sampleProduct), { minLength: 0, maxLength: 3 }),
        (products) => {
          const result = makeResult({ products });
          const { unmount } = render(
            <AIResultsPage
              result={result}
              onBack={() => {}}
              onStartOver={() => {}}
            />
          );

          const bodyText = document.body.innerText ?? document.body.textContent ?? '';
          expect(STACK_FRAME_PATTERN.test(bodyText)).toBe(false);

          unmount();
        }
      ),
      { numRuns: 20 }
    );
  });
});
