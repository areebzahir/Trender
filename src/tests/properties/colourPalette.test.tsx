import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { ColorPalette } from '@/components/ColorPalette';

// ─── Property 11: Colour palette rendering completeness ──────────────────────
// Feature: ai-room-personalization, Property 11: Colour palette rendering completeness
// Validates: Requirements 7.1, 7.4
describe('Property 11: Colour palette rendering completeness', () => {
  it('renders exactly one swatch per entry in recommendedPalette with the colour name as text', () => {
    fc.assert(
      fc.property(
        // Use printable ASCII strings that won't be mangled by CSS capitalize
        fc.array(
          fc.string({ minLength: 2, maxLength: 20 }).filter(
            s => s.trim().length >= 2 && /^[a-zA-Z][a-zA-Z0-9 -]*$/.test(s)
          ),
          { minLength: 1, maxLength: 6 }
        ),
        (palette) => {
          const { container, unmount } = render(
            <ColorPalette recommendedPalette={palette} detectedColors={[]} />
          );

          // Each colour name should appear as a title attribute on the swatch div
          for (const colorName of palette) {
            const swatch = container.querySelector(`[title="${colorName}"]`);
            expect(swatch).not.toBeNull();
          }

          // Number of swatches must equal palette length
          const swatches = container.querySelectorAll('[title]');
          expect(swatches.length).toBe(palette.length);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('renders exactly one swatch per entry in detectedColors with the colour name as title', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 2, maxLength: 20 }).filter(
            s => s.trim().length >= 2 && /^[a-zA-Z][a-zA-Z0-9 -]*$/.test(s)
          ),
          { minLength: 1, maxLength: 6 }
        ),
        (detected) => {
          const { container, unmount } = render(
            <ColorPalette recommendedPalette={[]} detectedColors={detected} />
          );

          for (const colorName of detected) {
            const swatch = container.querySelector(`[title="${colorName}"]`);
            expect(swatch).not.toBeNull();
          }

          const swatches = container.querySelectorAll('[title]');
          expect(swatches.length).toBe(detected.length);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 12: Unknown colour name renders placeholder ─────────────────────
// Feature: ai-room-personalization, Property 12: Unknown colour name renders placeholder
// Validates: Requirements 7.3
describe('Property 12: Unknown colour name renders placeholder', () => {
  // Colour names that are definitely NOT in the CSS lookup table
  const UNKNOWN_COLORS = [
    'zirconium blue', 'quantum teal', 'nebula pink', 'xylophone red',
    'abstract mauve', 'fictional ochre', 'invented sienna', 'made up coral',
  ];

  it('renders a swatch with neutral background (#CCCCCC) and displays the colour name for unknown colours', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...UNKNOWN_COLORS),
        (unknownColor) => {
          const { container, unmount } = render(
            <ColorPalette recommendedPalette={[unknownColor]} detectedColors={[]} />
          );

          // The swatch div should have the neutral placeholder colour
          const swatch = container.querySelector(`[title="${unknownColor}"]`);
          expect(swatch).not.toBeNull();

          const style = (swatch as HTMLElement).style.backgroundColor;
          // rgb(204, 204, 204) is #CCCCCC
          expect(style).toBe('rgb(204, 204, 204)');

          // The colour name should appear as visible text in a span
          const spans = container.querySelectorAll('span');
          const hasText = Array.from(spans).some(
            span => span.textContent?.toLowerCase().includes(unknownColor.toLowerCase())
          );
          expect(hasText).toBe(true);

          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });
});
