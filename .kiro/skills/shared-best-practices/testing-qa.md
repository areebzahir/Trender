# Testing & QA Best Practices

**Purpose:** Ensure code quality, correctness, and reliability.

---

## Test Migrations

### Verify SQL Syntax
```bash
# Check SQL is valid
psql -f supabase/migrations/20240001_furniture_catalog.sql --dry-run
```

### Test Migration Idempotency
```sql
-- Run migration twice, should not error
\i supabase/migrations/20240001_furniture_catalog.sql
\i supabase/migrations/20240001_furniture_catalog.sql
```

### Verify Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected: stores, store_locations, products, product_dimensions, 
--           product_attributes, product_embeddings, scrape_jobs, 
--           scrape_job_items, room_photos, furniture_request_logs
```

### Verify Indexes Created
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Verify Triggers Created
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

---

## Test RLS Policies

### Verify RLS Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All tables should have rowsecurity = true
```

### Test Public Read Access
```typescript
// Using anon key
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true);

expect(error).toBeNull();
expect(data.length).toBeGreaterThan(0);
```

### Test Public Cannot Read Inactive
```typescript
// Using anon key
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', false);

// Should return empty (RLS blocks inactive products)
expect(data.length).toBe(0);
```

### Test Public Cannot Write
```typescript
// Using anon key
const { error } = await supabase
  .from('products')
  .insert({ title: 'Test', ... });

// Should fail with permission error
expect(error).toBeDefined();
expect(error.message).toContain('permission');
```

### Test Service Role Can Write
```typescript
// Using service role key
const { data, error } = await supabaseAdmin
  .from('products')
  .insert({ title: 'Test', ... });

expect(error).toBeNull();
expect(data).toBeDefined();
```

---

## Test Mock Data Insertion

### Insert Mock Stores
```typescript
const stores = [
  { name: 'Test Store 1', city: 'Toronto', province: 'ON' },
  { name: 'Test Store 2', city: 'Ottawa', province: 'ON' }
];

const { data, error } = await supabaseAdmin
  .from('stores')
  .insert(stores)
  .select();

expect(error).toBeNull();
expect(data.length).toBe(2);
```

### Insert Mock Products
```typescript
const products = [
  {
    store_id: storeId,
    title: 'Test Sofa',
    category: 'sofa',
    price: 999.00,
    product_url: 'https://example.com/sofa',
    canonical_url: 'https://example.com/sofa',
    is_active: true
  }
];

const { data, error } = await supabaseAdmin
  .from('products')
  .insert(products)
  .select();

expect(error).toBeNull();
expect(data.length).toBe(1);
```

---

## Test Deduplication

### Test Canonical URL Deduplication
```typescript
const product = {
  title: 'Test Sofa',
  product_url: 'https://example.com/sofa?utm_source=test',
  canonical_url: 'https://example.com/sofa',
  // ...
};

// Insert first time
const result1 = await upsertProduct(product, storeId);
expect(result1.status).toBe('inserted');

// Insert again with same canonical URL
const result2 = await upsertProduct(product, storeId);
expect(result2.status).toBe('updated');
expect(result2.product_id).toBe(result1.product_id);
```

### Test Store + SKU Deduplication
```typescript
const product = {
  title: 'Test Chair',
  sku: 'CHAIR-001',
  product_url: 'https://example.com/chair',
  // ...
};

const result1 = await upsertProduct(product, storeId);
expect(result1.status).toBe('inserted');

// Same SKU, same store
const result2 = await upsertProduct(product, storeId);
expect(result2.status).toBe('updated');
```

---

## Test Product Search

### Test Category Filter
```typescript
const results = await searchProducts({ category: 'sofa' });

expect(results.length).toBeGreaterThan(0);
results.forEach(p => {
  expect(p.category).toBe('sofa');
});
```

### Test Price Filter
```typescript
const results = await searchProducts({ 
  min_price: 500, 
  max_price: 1500 
});

results.forEach(p => {
  expect(p.price).toBeGreaterThanOrEqual(500);
  expect(p.price).toBeLessThanOrEqual(1500);
});
```

### Test City Filter
```typescript
const results = await searchProducts({ city: 'Toronto' });

results.forEach(p => {
  expect(p.city).toBe('Toronto');
});
```

### Test Style Filter
```typescript
const results = await searchProducts({ styles: ['modern', 'minimalist'] });

results.forEach(p => {
  const hasStyle = p.styles?.some(s => 
    ['modern', 'minimalist'].includes(s)
  );
  expect(hasStyle).toBe(true);
});
```

---

## Test API Response Shape

### Test Product Search Response
```typescript
const response = await fetch('/api/products/search?category=sofa');
const json = await response.json();

expect(json).toHaveProperty('data');
expect(json).toHaveProperty('count');
expect(Array.isArray(json.data)).toBe(true);

if (json.data.length > 0) {
  const product = json.data[0];
  expect(product).toHaveProperty('id');
  expect(product).toHaveProperty('title');
  expect(product).toHaveProperty('price');
  expect(product).toHaveProperty('image_url');
  expect(product).toHaveProperty('category');
  
  // Should NOT have private fields
  expect(product).not.toHaveProperty('raw_payload');
  expect(product).not.toHaveProperty('scrape_job_id');
  expect(product).not.toHaveProperty('normalized_title');
}
```

---

## Test No Private Data Leaked

### Check Response Doesn't Include Sensitive Fields
```typescript
const { data } = await supabase
  .from('products')
  .select('*')
  .limit(1)
  .single();

// These should NOT be in public API responses
const sensitiveFields = [
  'raw_payload',
  'scrape_job_id',
  'normalized_title',
  'canonical_url'
];

// But they exist in database
sensitiveFields.forEach(field => {
  expect(data).toHaveProperty(field);
});

// Public API should filter them out
const publicResponse = await searchProducts({ limit: 1 });
const publicProduct = publicResponse[0];

sensitiveFields.forEach(field => {
  expect(publicProduct).not.toHaveProperty(field);
});
```

---

## Test TypeScript Types

### Run Type Check
```bash
npx tsc --noEmit
```

### Verify No `any` Types
```bash
# Search for 'any' in source files
grep -r ": any" src/lib/ingestion/
# Should return minimal results
```

---

## Test Normalization

### Test Title Normalization
```typescript
expect(normalizeTitle('Modern Sofa - Beige!')).toBe('modern sofa beige');
expect(normalizeTitle('  CHAIR  ')).toBe('chair');
```

### Test URL Normalization
```typescript
const url = 'https://example.com/product?utm_source=test&ref=123';
expect(normalizeUrl(url)).toBe('https://example.com/product');
```

### Test Price Parsing
```typescript
expect(parsePrice('$1,299.00')).toBe(1299.00);
expect(parsePrice('CAD 899')).toBe(899.00);
expect(parsePrice('invalid')).toBeNull();
```

### Test Color Normalization
```typescript
const colors = normalizeColors('gray charcoal off-white');
expect(colors).toContain('grey');
expect(colors).toContain('cream');
```

---

## Test Ingestion Pipeline

### Test Full Ingestion Flow
```typescript
const mockProducts = [
  {
    title: 'Test Sofa',
    product_url: 'https://example.com/sofa',
    price: 999,
    source_platform: 'manual',
    store: { name: 'Test Store', city: 'Toronto', province: 'ON' },
    raw_payload: {}
  }
];

const result = await runIngestion({
  products: mockProducts,
  source_type: 'manual'
});

expect(result.found).toBe(1);
expect(result.inserted).toBe(1);
expect(result.failed).toBe(0);
expect(result.job_id).toBeDefined();
```

### Test Job Tracking
```typescript
const { data: job } = await supabaseAdmin
  .from('scrape_jobs')
  .select('*')
  .eq('id', result.job_id)
  .single();

expect(job.status).toBe('completed');
expect(job.total_found).toBe(1);
expect(job.total_inserted).toBe(1);
```

---

## Integration Tests

### Test Complete User Flow
```typescript
// 1. Insert mock data
await insertMockStores();
await insertMockProducts();

// 2. Search products
const results = await searchProducts({ category: 'sofa' });
expect(results.length).toBeGreaterThan(0);

// 3. Verify response shape
const product = results[0];
expect(product.id).toBeDefined();
expect(product.title).toBeDefined();
expect(product.price).toBeDefined();

// 4. Verify no private data
expect(product.raw_payload).toBeUndefined();
```

---

## Performance Tests

### Test Query Performance
```typescript
const start = Date.now();
const results = await searchProducts({ limit: 100 });
const duration = Date.now() - start;

expect(duration).toBeLessThan(1000);  // Should be < 1 second
```

### Test Bulk Insert Performance
```typescript
const products = Array.from({ length: 100 }, (_, i) => ({
  title: `Product ${i}`,
  product_url: `https://example.com/product-${i}`,
  // ...
}));

const start = Date.now();
await runIngestion({ products, source_type: 'manual' });
const duration = Date.now() - start;

expect(duration).toBeLessThan(10000);  // Should be < 10 seconds
```

---

## QA Checklist

Before marking complete, verify:

- [ ] All migrations applied successfully
- [ ] All required tables exist
- [ ] All indexes created
- [ ] All triggers created
- [ ] pgvector extension enabled
- [ ] RLS enabled on all tables
- [ ] Public can read active products
- [ ] Public cannot read inactive products
- [ ] Public cannot write products
- [ ] Service role can write products
- [ ] Mock stores inserted
- [ ] Mock products inserted
- [ ] Product search works
- [ ] Category filter works
- [ ] Price filter works
- [ ] City filter works
- [ ] Style filter works
- [ ] Deduplication works
- [ ] API response shape is correct
- [ ] No private data in public responses
- [ ] No service role key in frontend code
- [ ] TypeScript compiles without errors
- [ ] No `any` types (or minimal)
- [ ] Normalization functions work
- [ ] Ingestion pipeline works
- [ ] Job tracking works

---

## Automated Testing

### Unit Tests
```typescript
// src/lib/ingestion/__tests__/normalizeProduct.test.ts
import { normalizeTitle, parsePrice } from '../normalizeProduct';

describe('normalizeTitle', () => {
  it('should lowercase and remove punctuation', () => {
    expect(normalizeTitle('Modern Sofa!')).toBe('modern sofa');
  });
});

describe('parsePrice', () => {
  it('should parse price strings', () => {
    expect(parsePrice('$1,299.00')).toBe(1299.00);
    expect(parsePrice('invalid')).toBeNull();
  });
});
```

### Integration Tests
```typescript
// tests/integration/ingestion.test.ts
import { runIngestion } from '@/lib/ingestion/runIngestion';

describe('Ingestion Pipeline', () => {
  it('should insert products successfully', async () => {
    const result = await runIngestion({
      products: mockProducts,
      source_type: 'manual'
    });
    
    expect(result.inserted).toBeGreaterThan(0);
    expect(result.failed).toBe(0);
  });
});
```

---

## Manual Testing

### Test in Browser
1. Open app in browser
2. Open DevTools Console
3. Run search query:
   ```javascript
   const results = await searchProducts({ category: 'sofa' });
   console.log(results);
   ```
4. Verify results returned
5. Verify no errors in console

### Test in Supabase Dashboard
1. Go to Table Editor
2. Check `products` table has data
3. Check `stores` table has data
4. Run SQL query:
   ```sql
   SELECT COUNT(*) FROM products WHERE is_active = true;
   ```
5. Verify count > 0
