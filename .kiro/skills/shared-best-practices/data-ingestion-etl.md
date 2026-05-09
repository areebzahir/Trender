# Data Ingestion & ETL Best Practices

**Purpose:** Build robust, scalable data ingestion pipelines.

---

## ETL Flow

**Extract → Transform → Load**

```
1. EXTRACT
   ↓ Raw data from source (Apify, SerpApi, CSV, API)
   
2. TRANSFORM
   ↓ Validate → Normalize → Deduplicate
   
3. LOAD
   ↓ Upsert to database → Track status
```

---

## Extract Phase

### Support Multiple Sources

```typescript
// Modular provider architecture
interface DataProvider {
  extract(): Promise<RawItem[]>;
  normalize(item: RawItem): NormalizedProduct;
}

class ApifyProvider implements DataProvider { ... }
class SerpApiProvider implements DataProvider { ... }
class CSVProvider implements DataProvider { ... }
```

### Save Raw Payloads

Always save original data for debugging:

```typescript
const product = {
  title: normalized.title,
  price: normalized.price,
  // ... normalized fields
  raw_payload: originalScraperData,  // Save for debugging
  source_platform: 'apify',
  source_url: 'https://...'
};
```

**Benefits:**
- Debug normalization issues
- Re-process data with improved logic
- Audit trail
- Compliance/legal requirements

---

## Transform Phase

### Validation

Check data quality before inserting:

```typescript
function validateProduct(raw: unknown): ValidationResult {
  const errors: string[] = [];
  
  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Invalid object'] };
  }
  
  const obj = raw as Record<string, unknown>;
  
  // Required fields
  if (!obj.title || typeof obj.title !== 'string') {
    errors.push('Missing or invalid title');
  }
  
  if (!obj.product_url || typeof obj.product_url !== 'string') {
    errors.push('Missing or invalid product_url');
  }
  
  // Validate URL format
  if (obj.product_url) {
    try {
      new URL(obj.product_url as string);
    } catch {
      errors.push('Invalid URL format');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Normalization

Convert inconsistent data to consistent format:

```typescript
// Price normalization
"$1,299.00" → 1299.00
"CAD 899" → 899.00
"1299" → 1299.00

// Color normalization
"gray" → "grey"
"off-white" → "cream"
"charcoal" → "grey"

// Category inference
"Modern Sofa - Beige" → category: "sofa"
"L-Shape Sectional" → category: "sectional"
```

### Deduplication

Prevent duplicate products:

```typescript
// Priority order for deduplication:
// 1. Canonical URL (strongest)
// 2. Store ID + SKU
// 3. Store ID + Normalized Title + Price (fallback)

async function findExistingProduct(product: NormalizedProduct): Promise<string | null> {
  // Try canonical URL
  if (product.canonical_url) {
    const { data } = await supabase
      .from('products')
      .select('id')
      .eq('canonical_url', product.canonical_url)
      .maybeSingle();
    if (data) return data.id;
  }
  
  // Try store + SKU
  if (product.store_id && product.sku) {
    const { data } = await supabase
      .from('products')
      .select('id')
      .eq('store_id', product.store_id)
      .eq('sku', product.sku)
      .maybeSingle();
    if (data) return data.id;
  }
  
  // Try store + normalized title + price
  if (product.store_id && product.normalized_title && product.price) {
    const { data } = await supabase
      .from('products')
      .select('id')
      .eq('store_id', product.store_id)
      .eq('normalized_title', product.normalized_title)
      .eq('price', product.price)
      .maybeSingle();
    if (data) return data.id;
  }
  
  return null;  // No duplicate found
}
```

---

## Load Phase

### Upsert Pattern

Insert new, update existing:

```typescript
const existingId = await findExistingProduct(product);

if (existingId) {
  // Update existing
  await supabase
    .from('products')
    .update({
      ...product,
      last_seen_at: new Date().toISOString()
    })
    .eq('id', existingId);
  
  return { status: 'updated', product_id: existingId };
} else {
  // Insert new
  const { data } = await supabase
    .from('products')
    .insert({
      ...product,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  return { status: 'inserted', product_id: data.id };
}
```

---

## Job Tracking

### Create Scrape Job

Every ingestion run must create a job:

```typescript
const job = await supabase
  .from('scrape_jobs')
  .insert({
    source_type: 'apify',
    source_name: 'google-maps-scraper',
    target_url: 'https://...',
    status: 'queued',
    raw_config: { actorId: '...', input: {...} }
  })
  .select('id')
  .single();

const jobId = job.data.id;
```

### Track Progress

```typescript
// Mark running
await supabase
  .from('scrape_jobs')
  .update({ status: 'running', started_at: new Date().toISOString() })
  .eq('id', jobId);

// Process items...
let inserted = 0, updated = 0, failed = 0;

for (const item of items) {
  try {
    const result = await upsertProduct(item);
    if (result.status === 'inserted') inserted++;
    if (result.status === 'updated') updated++;
  } catch (err) {
    failed++;
    // Log error
  }
}

// Mark completed
await supabase
  .from('scrape_jobs')
  .update({
    status: 'completed',
    finished_at: new Date().toISOString(),
    total_found: items.length,
    total_inserted: inserted,
    total_updated: updated,
    total_failed: failed
  })
  .eq('id', jobId);
```

### Track Item Status

```typescript
await supabase
  .from('scrape_job_items')
  .insert({
    job_id: jobId,
    product_url: item.product_url,
    status: 'inserted',  // or 'updated', 'skipped', 'failed'
    error_message: null,
    raw_payload: item.raw_payload
  });
```

---

## Error Handling

### Fail Gracefully

Don't let one bad item fail the entire job:

```typescript
const results = {
  inserted: 0,
  updated: 0,
  failed: 0,
  errors: [] as Array<{ title: string; error: string }>
};

for (const item of items) {
  try {
    const result = await upsertProduct(item);
    if (result.status === 'inserted') results.inserted++;
    if (result.status === 'updated') results.updated++;
  } catch (err) {
    results.failed++;
    results.errors.push({
      title: item.title ?? 'unknown',
      error: err instanceof Error ? err.message : String(err)
    });
    
    // Continue processing other items
  }
}

return results;
```

### Log Useful Errors

```typescript
console.error('Product upsert failed:', {
  title: product.title,
  product_url: product.product_url,
  error: err.message,
  source_platform: product.source_platform,
  job_id: jobId
});
```

---

## Modular Providers

### Provider Interface

```typescript
export interface IngestionProvider {
  name: string;
  normalize(raw: unknown): NormalizedFurnitureProduct;
}

export class ApifyProvider implements IngestionProvider {
  name = 'apify';
  
  normalize(raw: unknown): NormalizedFurnitureProduct {
    // Apify-specific mapping
    return toNormalizedProduct({...});
  }
}

export class SerpApiProvider implements IngestionProvider {
  name = 'serpapi';
  
  normalize(raw: unknown): NormalizedFurnitureProduct {
    // SerpApi-specific mapping
    return toNormalizedProduct({...});
  }
}
```

### Easy to Add New Providers

```typescript
// Adding a new provider is simple:
export class WayfairProvider implements IngestionProvider {
  name = 'wayfair';
  
  normalize(raw: unknown): NormalizedFurnitureProduct {
    const item = raw as WayfairItem;
    return toNormalizedProduct({
      title: item.productName,
      product_url: item.url,
      price: item.price,
      // ... map Wayfair fields
      source_platform: 'custom_crawler',
      store: { name: 'Wayfair', ... },
      raw_payload: item
    });
  }
}

// Use it
const provider = new WayfairProvider();
const products = wayfairData.map(item => provider.normalize(item));
await runIngestion({ products, source_type: 'custom_crawler' });
```

---

## Source Metadata

Always track where data came from:

```typescript
const product = {
  // ... product fields
  source_platform: 'apify',  // or 'serpapi', 'csv', 'manual'
  scrape_job_id: jobId,
  discovered_by: 'google_maps_scraper',
  source_url: 'https://...',
  first_seen_at: new Date().toISOString(),
  last_seen_at: new Date().toISOString()
};
```

**Benefits:**
- Debug data quality issues
- Track which sources are most reliable
- Re-scrape from specific sources
- Audit trail

---

## Idempotency

Ingestion should be safe to run multiple times:

```typescript
// Running the same ingestion twice should:
// - Not create duplicate products (deduplication)
// - Update existing products with latest data
// - Not fail if data already exists

// Example: Re-running Apify actor results
const products = apifyResults.map(normalize);
await runIngestion({ products, source_type: 'apify' });

// Second run with same data:
await runIngestion({ products, source_type: 'apify' });
// Result: 0 inserted, N updated (not N duplicates)
```

---

## Performance

### Batch Operations

```typescript
// Bad - one at a time
for (const product of products) {
  await upsertProduct(product);
}

// Better - batch where possible
const batch = products.slice(0, 100);
await supabase.from('products').upsert(batch);
```

### Parallel Processing

```typescript
// Process in parallel with concurrency limit
async function processInParallel<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  concurrency = 5
) {
  const chunks = [];
  for (let i = 0; i < items.length; i += concurrency) {
    chunks.push(items.slice(i, i + concurrency));
  }
  
  for (const chunk of chunks) {
    await Promise.all(chunk.map(fn));
  }
}

await processInParallel(products, upsertProduct, 10);
```

---

## Testing

### Test Each Phase

```typescript
// Test extraction
const rawData = await provider.extract();
expect(rawData.length).toBeGreaterThan(0);

// Test normalization
const normalized = provider.normalize(rawData[0]);
expect(normalized.title).toBeDefined();
expect(normalized.canonical_url).toBeDefined();

// Test deduplication
const existing = await findExistingProduct(normalized);
expect(existing).toBeNull();  // First insert

await upsertProduct(normalized);
const duplicate = await findExistingProduct(normalized);
expect(duplicate).toBeDefined();  // Found existing
```

---

## Monitoring

Track ingestion health:

```typescript
// Metrics to track:
// - Jobs per day
// - Success rate
// - Average items per job
// - Average processing time
// - Error rate by source
// - Duplicate rate

const metrics = {
  job_id: jobId,
  source_type: 'apify',
  total_items: items.length,
  inserted: results.inserted,
  updated: results.updated,
  failed: results.failed,
  duration_ms: Date.now() - startTime,
  success_rate: (results.inserted + results.updated) / items.length
};

console.log('Ingestion metrics:', metrics);
```
