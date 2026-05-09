# TypeScript Production Patterns

**Purpose:** Write type-safe, maintainable TypeScript code.

---

## Strong Typing

### Use Explicit Types
```typescript
// Bad
function parsePrice(raw) {
  return parseFloat(raw);
}

// Good
function parsePrice(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return isFinite(raw) ? raw : null;
  const cleaned = String(raw).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isFinite(parsed) ? parsed : null;
}
```

### Avoid `any`
```typescript
// Bad
function processItem(item: any) {
  return item.title;
}

// Good
interface ProductItem {
  title: string;
  price?: number;
}

function processItem(item: ProductItem): string {
  return item.title;
}
```

### Use Union Types
```typescript
type ProductAvailability = 'in_stock' | 'out_of_stock' | 'limited' | 'unknown';
type SourcePlatform = 'apify' | 'serpapi' | 'custom_crawler' | 'csv' | 'manual';
```

---

## Explicit Return Types

For public/exported functions, always specify return type:

```typescript
// Bad
export function upsertProduct(product, storeId) {
  // ...
}

// Good
export async function upsertProduct(
  product: NormalizedFurnitureProduct,
  store_id: string,
  scrape_job_id?: string
): Promise<UpsertProductResult> {
  // ...
}
```

---

## Validate External Data

Never trust external/raw data:

```typescript
// Bad
const price = item.price;  // Could be string, null, undefined, object

// Good
const price = parsePrice(item.price);  // Returns number | null
```

### Validation Pattern
```typescript
export function validateProductInput(raw: unknown): ProductInput | null {
  if (!raw || typeof raw !== 'object') return null;
  
  const obj = raw as Record<string, unknown>;
  
  if (!obj.title || typeof obj.title !== 'string') return null;
  if (!obj.product_url || typeof obj.product_url !== 'string') return null;
  
  return {
    title: obj.title,
    product_url: obj.product_url,
    price: typeof obj.price === 'number' ? obj.price : undefined,
    // ... validate other fields
  };
}
```

---

## Normalize Null/Undefined

Be consistent about null vs undefined:

```typescript
// Bad - mixing null and undefined
interface Product {
  title: string;
  description: string | null;
  brand: string | undefined;
  price?: number | null;
}

// Good - pick one convention
interface Product {
  title: string;
  description?: string;  // optional = may be undefined
  brand?: string;
  price?: number;
}
```

**Convention for this project:**
- Use `?` for optional fields (undefined)
- Use `| null` only when the database column is nullable and you need to distinguish "not set" from "explicitly null"

---

## Safe Parsing

### URLs
```typescript
export function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw.trim());
    // Remove tracking params
    url.searchParams.delete('utm_source');
    return url.toString().replace(/\/$/, '');
  } catch {
    return raw.trim();  // Fallback to original if invalid
  }
}
```

### JSON
```typescript
function parseJsonSafely<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
```

### Arrays
```typescript
function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return [value];
  return [];
}
```

---

## Error Handling

### Typed Error Results
```typescript
export type UpsertProductResult =
  | { status: 'inserted'; product_id: string }
  | { status: 'updated';  product_id: string }
  | { status: 'skipped';  product_id: string; reason: string }
  | { status: 'failed';   error: string };
```

### Don't Silently Swallow Errors
```typescript
// Bad
try {
  await upsertProduct(product);
} catch {
  // Silent failure
}

// Good
try {
  await upsertProduct(product);
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error('Failed to upsert product:', product.title, message);
  return { status: 'failed', error: message };
}
```

---

## Pure Functions

Keep utility functions pure where possible:

```typescript
// Pure - no side effects, same input = same output
export function normalizeTitle(raw: string): string {
  return raw.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
}

// Impure - has side effects (database write)
export async function upsertProduct(product: NormalizedFurnitureProduct) {
  await supabaseAdmin.from('products').insert(product);
}
```

**Benefits of pure functions:**
- Easy to test
- Easy to reason about
- No hidden dependencies
- Cacheable

---

## Avoid Magic Strings

```typescript
// Bad
if (product.category === 'sofa') { ... }
if (job.status === 'completed') { ... }

// Good
const PRODUCT_CATEGORIES = ['sofa', 'sectional', 'loveseat', ...] as const;
type ProductCategory = typeof PRODUCT_CATEGORIES[number];

const SCRAPE_JOB_STATUSES = ['queued', 'running', 'completed', 'failed'] as const;
type ScrapeJobStatus = typeof SCRAPE_JOB_STATUSES[number];

if (product.category === 'sofa') { ... }  // Type-safe
```

---

## Interface vs Type

**Use `interface` for:**
- Object shapes
- Extendable structures
- Public APIs

**Use `type` for:**
- Union types
- Mapped types
- Utility types

```typescript
// Interface
export interface ProductInput {
  title: string;
  price?: number;
}

// Type
export type ProductCategory = 'sofa' | 'sectional' | 'loveseat';
export type Result<T> = { success: true; data: T } | { success: false; error: string };
```

---

## Const Assertions

```typescript
// Bad - type is string[]
const colors = ['red', 'blue', 'green'];

// Good - type is readonly ['red', 'blue', 'green']
const colors = ['red', 'blue', 'green'] as const;
type Color = typeof colors[number];  // 'red' | 'blue' | 'green'
```

---

## Utility Types

Use TypeScript's built-in utility types:

```typescript
// Pick specific fields
type ProductSummary = Pick<Product, 'id' | 'title' | 'price'>;

// Make all fields optional
type PartialProduct = Partial<Product>;

// Make all fields required
type RequiredProduct = Required<Product>;

// Omit specific fields
type ProductWithoutRaw = Omit<Product, 'raw_payload'>;
```

---

## Type Guards

```typescript
function isProductInput(value: unknown): value is ProductInput {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.title === 'string' && typeof obj.product_url === 'string';
}

// Usage
if (isProductInput(rawData)) {
  // TypeScript knows rawData is ProductInput here
  console.log(rawData.title);
}
```

---

## Async/Await Best Practices

```typescript
// Bad - unhandled promise rejection
async function processProducts(products: Product[]) {
  products.forEach(async (p) => {
    await upsertProduct(p);  // forEach doesn't wait
  });
}

// Good - wait for all
async function processProducts(products: Product[]) {
  await Promise.all(products.map(p => upsertProduct(p)));
}

// Good - sequential with error handling
async function processProducts(products: Product[]) {
  for (const product of products) {
    try {
      await upsertProduct(product);
    } catch (err) {
      console.error('Failed:', product.title, err);
    }
  }
}
```

---

## Documentation

Use JSDoc for public functions:

```typescript
/**
 * Normalize a product title for deduplication.
 * Converts to lowercase, removes punctuation, and trims whitespace.
 * 
 * @param raw - The raw product title from the source
 * @returns Normalized title suitable for comparison
 * 
 * @example
 * normalizeTitle("Modern Sofa - Beige!") // "modern sofa beige"
 */
export function normalizeTitle(raw: string): string {
  return raw.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
}
```
