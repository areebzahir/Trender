import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/types/product';

// ─── Arbitrary ────────────────────────────────────────────────────────────────

const productArb: fc.Arbitrary<Product> = fc.record({
  id: fc.uuid(),
  // Use simple alphanumeric names to avoid text-matching issues
  name: fc.string({ minLength: 3, maxLength: 30 }).filter(s => /^[a-zA-Z0-9 ]+$/.test(s) && s.trim().length >= 3),
  storeName: fc.string({ minLength: 2, maxLength: 20 }).filter(s => /^[a-zA-Z0-9 ]+$/.test(s) && s.trim().length >= 2),
  category: fc.constantFrom('sofa', 'chair', 'table', 'lamp', 'rug'),
  price: fc.float({ min: 10, max: 9999, noNaN: true }),
  currency: fc.constantFrom('USD', 'GBP', 'EUR'),
  productUrl: fc.constant('https://example.com/product'),
  affiliateUrl: fc.constant('https://example.com/affiliate'),
  imageUrl: fc.constant('https://example.com/img.jpg'),
  cleanImageUrl: fc.constant('https://example.com/clean.jpg'),
  colorTags: fc.array(fc.string({ minLength: 2, maxLength: 15 }), { minLength: 0, maxLength: 4 }),
  styleTags: fc.array(
    fc.string({ minLength: 2, maxLength: 15 }).filter(s => /^[a-zA-Z0-9 ]+$/.test(s) && s.trim().length >= 2),
    { minLength: 0, maxLength: 3 }
  ),
  materialTags: fc.array(fc.string({ minLength: 2, maxLength: 15 }), { minLength: 0, maxLength: 3 }),
  roomTags: fc.array(fc.constantFrom('living room', 'bedroom'), { minLength: 1, maxLength: 2 }),
  dimensions: fc.record({
    width: fc.constant('80cm'),
    height: fc.constant('75cm'),
    depth: fc.constant('60cm'),
  }),
  inStock: fc.boolean(),
});

// ─── Property 13: ProductCard renders all required fields ─────────────────────
// Feature: ai-room-personalization, Property 13: ProductCard renders all required fields
// Validates: Requirements 8.2, 8.4
describe('Property 13: ProductCard renders all required fields', () => {
  it('renders product name, store name, price, and one badge per styleTag', () => {
    fc.assert(
      fc.property(productArb, (product) => {
        const { container, unmount } = render(<ProductCard product={product} />);

        // Product name — find by text content
        const nameEl = Array.from(container.querySelectorAll('h3')).find(
          el => el.textContent?.includes(product.name)
        );
        expect(nameEl).toBeTruthy();

        // Store name
        const storeEl = Array.from(container.querySelectorAll('p')).find(
          el => el.textContent?.includes(product.storeName)
        );
        expect(storeEl).toBeTruthy();

        // Price — formatted currency string should appear somewhere
        const priceEl = container.querySelector('[class*="text-[#F76A1C]"]');
        expect(priceEl).toBeTruthy();

        // Style tag badges (up to 3 shown) — check that each tag text appears in the rendered output
        const shownTags = product.styleTags.slice(0, 3).map(t => t.trim()).filter(t => t.length > 0);
        const allText = container.textContent ?? '';
        for (const tag of shownTags) {
          // The tag text must appear somewhere in the rendered card
          expect(allText.toLowerCase()).toContain(tag.toLowerCase());
        }

        // Buy link or disabled button must be present
        const buyLink = container.querySelector('a[href]');
        const disabledBtn = container.querySelector('button[disabled], button[aria-disabled="true"]');
        expect(buyLink !== null || disabledBtn !== null).toBe(true);

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('buy link href equals affiliateUrl when product is in stock', () => {
    fc.assert(
      fc.property(
        productArb.map(p => ({ ...p, inStock: true })),
        (product) => {
          const { container, unmount } = render(<ProductCard product={product} />);

          const buyLink = container.querySelector('a[href]') as HTMLAnchorElement | null;
          expect(buyLink).not.toBeNull();
          expect(buyLink!.href).toContain(product.affiliateUrl || product.productUrl);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 14: Out-of-stock products disable buy button ────────────────────
// Feature: ai-room-personalization, Property 14: Out-of-stock products disable buy button
// Validates: Requirements 8.3
describe('Property 14: Out-of-stock products disable buy button', () => {
  it('shows Out of Stock badge and disabled button for any product where inStock is false', () => {
    fc.assert(
      fc.property(
        productArb.map(p => ({ ...p, inStock: false })),
        (outOfStockProduct) => {
          const { container, unmount } = render(<ProductCard product={outOfStockProduct} />);

          // Out of Stock text must appear somewhere
          const bodyText = container.textContent ?? '';
          expect(bodyText.toLowerCase()).toContain('out of stock');

          // Disabled button must be present
          const disabledBtn = container.querySelector('button[disabled], button[aria-disabled="true"]');
          expect(disabledBtn).not.toBeNull();

          // No active buy link (anchor with href)
          const buyLink = container.querySelector('a[href]');
          expect(buyLink).toBeNull();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('shows an active Buy Now link for any product where inStock is true', () => {
    fc.assert(
      fc.property(
        productArb.map(p => ({ ...p, inStock: true })),
        (inStockProduct) => {
          const { container, unmount } = render(<ProductCard product={inStockProduct} />);

          const buyLink = container.querySelector('a[href]') as HTMLAnchorElement | null;
          expect(buyLink).not.toBeNull();
          expect(buyLink!.hasAttribute('disabled')).toBe(false);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
