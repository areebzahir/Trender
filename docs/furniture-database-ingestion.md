# Trender — Furniture Database & Ingestion Architecture

## Overview

This document covers the Supabase database schema, ingestion pipeline, search system, and future extension points for the Trender furniture catalog.

---

## Environment Variables

| Variable | Where Used | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend + Edge Functions | Public, safe for browser |
| `VITE_SUPABASE_ANON_KEY` | Frontend only | Public anon key, RLS enforced |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions + ingestion scripts only | **NEVER expose to frontend or commit to git** |
| `SUPABASE_URL` | Edge Functions (Deno.env) | Set automatically by Supabase |
| `SUPABASE_ANON_KEY` | Edge Functions (Deno.env) | Set automatically by Supabase |
| `APIFY_API_TOKEN` | Ingestion scripts only | Server-side only |
| `SERPAPI_KEY` | Ingestion scripts only | Server-side only |
| `OPENAI_API_KEY` | Embedding generation only | Server-side only |
| `EMBEDDING_PROVIDER` | `openai` or `gemini` | Controls embedding model |
| `EMBEDDING_DIMENSIONS` | `1536` (OpenAI) or `768` (Gemini) | Must match vector column size |

---

## Database Schema

### `stores`
Canadian/Ontario furniture retailers. Deduplicated by `normalized_domain` (computed column).

### `store_locations`
Multiple physical locations per store chain. Foreign key to `stores`.

### `products`
Core product catalog. Deduplicated by:
1. `canonical_url` (strongest)
2. `store_id + sku`
3. `store_id + normalized_title + price` (fallback)

### `product_dimensions`
Physical dimensions (width, height, depth, seat_height). One row per product. Critical for future room-fit calculations.

### `product_attributes`
Colors, materials, styles, room types as arrays. GIN-indexed for fast array overlap queries.

### `product_embeddings`
pgvector embeddings (1536 dims for OpenAI, 768 for Gemini). HNSW index for fast ANN search. `source_text` stores the text that was embedded for re-embedding support.

### `scrape_jobs`
Tracks every ingestion run with status, counts, and config.

### `scrape_job_items`
Per-item tracking within a job (inserted/updated/skipped/failed).

### `room_photos`
Future: user-uploaded room images. Stores detected style and colors for AI matching.

### `furniture_request_logs`
Future: logs user natural-language requests with parsed intent fields.

---

## Ingestion Flow

```
Raw source data
      │
      ▼
Provider (apifyProvider / serpApiShoppingProvider / csvImportProvider)
      │  maps raw fields to intermediate shape
      ▼
normalizeProduct.ts → toNormalizedProduct()
      │  normalizes title, URL, price, colors, materials, styles, category
      ▼
runIngestion()
      │
      ├─ createScrapeJob()       → scrape_jobs row
      ├─ upsertStore()           → stores row (dedup by domain)
      ├─ upsertProduct()         → products row (dedup by canonical_url / sku)
      │    ├─ product_dimensions
      │    ├─ product_attributes
      │    └─ product_embeddings (source_text placeholder, embedding = null)
      └─ completeScrapeJob()     → update job status + counts
```

---

## How to Add Apify

1. Find the actor on [Apify Store](https://apify.com/store) (e.g. `apify/google-maps-scraper`, `apify/web-scraper`).
2. Run the actor via Apify API or console. Download results as JSON.
3. Pass results to `processApifyResults(items, 'product_scraper', storeOverride)` in `apifyProvider.ts`.
4. Call `runIngestion({ products, source_type: 'apify', source_name: 'actor-name' })`.

For Google Maps store discovery:
```ts
import { apifyGoogleMapsToStore } from '@/lib/ingestion/providers/apifyProvider';
import { upsertStore } from '@/lib/ingestion/upsertStore';

for (const item of googleMapsResults) {
  const store = apifyGoogleMapsToStore(item);
  await upsertStore(store);
}
```

---

## How to Add SerpApi

1. Get a SerpApi key from [serpapi.com](https://serpapi.com).
2. Query the Google Shopping endpoint:
   ```
   GET https://serpapi.com/search?engine=google_shopping&q=sofa+ontario&location=Ontario,Canada&api_key=KEY
   ```
3. Pass the response to `processSerpApiShoppingResults(response, 'Toronto', 'ON')`.
4. Call `runIngestion({ products, source_type: 'serpapi', source_name: 'google_shopping' })`.

---

## How to Add a Custom Crawler

1. Create a new file in `src/lib/ingestion/providers/` (e.g. `ikea Provider.ts`).
2. Define the raw item shape as an interface.
3. Write a mapper function that calls `toNormalizedProduct()`.
4. Export a batch processor function.
5. Call `runIngestion()` with `source_type: 'custom_crawler'`.

---

## How Products Are Deduplicated

Priority order:
1. **`canonical_url`** — URL normalized (tracking params stripped, trailing slash removed). Strongest signal.
2. **`store_id + sku`** — If SKU is available from the source.
3. **`store_id + normalized_title + price`** — Fallback for sources without SKUs.

Stores are deduplicated by `normalized_domain` (computed column, `www.` stripped, lowercased).

---

## How Search Works

### Frontend (anon key, RLS enforced)
```ts
import { searchProducts } from '@/services/furnitureSearchService';

const results = await searchProducts({
  q: 'beige couch',
  category: 'sofa',
  city: 'Toronto',
  province: 'ON',
  max_price: 2000,
  styles: ['modern', 'minimalist'],
});
```

### Edge Functions
- `GET /functions/v1/search-products` — product search with all filters
- `GET /functions/v1/search-stores` — store search by city/province/type

### Vector Similarity (future)
Once embeddings are generated, use the `match_furniture_products` SQL function:
```sql
SELECT * FROM match_furniture_products(
  query_embedding := '[0.1, 0.2, ...]'::vector,
  match_count     := 10,
  filter_category := 'sofa',
  filter_province := 'ON'
);
```

---

## How to Generate Embeddings

The `product_embeddings` table stores `source_text` (pre-built) and `embedding = null` as a placeholder.

To generate embeddings (create `src/lib/ingestion/generateEmbeddings.ts`):
```ts
// For each product_embeddings row where embedding IS NULL:
// 1. Fetch source_text
// 2. Call OpenAI: openai.embeddings.create({ model: 'text-embedding-3-small', input: source_text })
// 3. Update embedding column with the returned vector
```

The vector size in the schema is `1536` (OpenAI). To use Gemini (`768` dims), change the column:
```sql
ALTER TABLE product_embeddings ALTER COLUMN embedding TYPE vector(768);
```

---

## How Future Room Image Editing Will Use This Data

When the room mockup feature is built:
1. User uploads a room photo → stored in `room_photos`.
2. User requests a furniture item (e.g. "add a modern beige couch").
3. Request is logged in `furniture_request_logs` with parsed intent.
4. The app queries `products` filtered by category/style/color/price.
5. **`product_dimensions`** is used to scale the product image to fit the room proportionally.
6. **`image_url`** (and `additional_images`) provides the product photo for compositing.
7. Vector similarity via `match_furniture_products` ranks results by semantic closeness.

---

## What NOT to Expose to Frontend

- `SUPABASE_SERVICE_ROLE_KEY` — bypasses all RLS, full DB access
- `APIFY_API_TOKEN` — paid scraping credits
- `SERPAPI_KEY` — paid API credits
- `OPENAI_API_KEY` — paid embedding/generation credits
- Raw `scrape_jobs` data — internal operational details
- `raw_payload` columns — may contain PII or sensitive source data

The frontend only ever uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## Running the Migration

1. Go to your Supabase project → SQL Editor.
2. Paste and run `supabase/migrations/20240001_furniture_catalog.sql`.
3. Then run `supabase/seed/mock_ontario_furniture.sql` for test data.

Or with Supabase CLI:
```bash
supabase db push
supabase db seed
```

---

## Testing Checklist

- [ ] Insert mock store → verify in `stores` table
- [ ] Insert mock products → verify in `products`, `product_dimensions`, `product_attributes`
- [ ] Insert duplicate product URL → verify only one row exists (dedup works)
- [ ] `searchProducts({ category: 'sofa' })` returns sofa products
- [ ] `searchProducts({ city: 'Toronto' })` returns Toronto products
- [ ] `searchProducts({ styles: ['modern'] })` returns modern products
- [ ] `searchStores({ province: 'ON' })` returns Ontario stores
- [ ] Anon key cannot INSERT into `products` (RLS blocks it)
- [ ] Service role key is not present in any `VITE_` prefixed variable
