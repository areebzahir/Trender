# Trender Furniture Scraper

Production-quality furniture scraping and ingestion system for Trender.
Populates the existing Supabase database with real Canadian/Ontario furniture products.

---

## What This Scraper Does

1. Seeds 28+ Canadian/Ontario furniture stores into the `stores` table
2. Scrapes product data from each store using the appropriate strategy
3. Normalizes all data (prices, URLs, colors, materials, styles, dimensions)
4. Upserts products into the existing `products` table (no duplicates)
5. Saves attributes to `product_attributes` (colors, materials, styles, room types)
6. Saves dimensions to `product_dimensions` (width, height, depth in cm)
7. Logs every scrape run in `scrape_jobs` and `scrape_job_items`
8. Marks products for future embedding generation in `product_embeddings`

---

## How It Uses Existing Supabase Tables

| Table                | What Gets Written                                      |
|----------------------|--------------------------------------------------------|
| `stores`             | Store name, website, domain, country, province         |
| `products`           | Title, price, URL, image, category, brand, raw data    |
| `product_attributes` | Colors, materials, styles, room types, tags            |
| `product_dimensions` | Width, height, depth (cm), raw dimension text          |
| `product_embeddings` | Placeholder row with source_text (embedding = NULL)    |
| `scrape_jobs`        | Job status, counts, errors per scrape run              |
| `scrape_job_items`   | Per-product status (inserted/updated/skipped/failed)   |

Tables NOT modified: `room_photos`, `furniture_request_logs`

See `SCHEMA_MAPPING.md` for the full field-to-column mapping.

---

## Required Environment Variables

Add these to your `.env` file (copy from `.env.example`):

```env
# Supabase — backend only, never expose to frontend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Apify — for IKEA scraping
APIFY_TOKEN=your_apify_token_here
APIFY_IKEA_ACTOR_ID=dtrungtin/ikea-scraper

# Scraper tuning (optional)
SCRAPER_BATCH_SIZE=500
SCRAPER_MAX_PRODUCTS_PER_SOURCE=1000
SCRAPER_DELAY_MS=1200
```

**Security**: `SUPABASE_SERVICE_ROLE_KEY` must NEVER be prefixed with `VITE_`.
It is only used in backend scripts, never in browser code.

---

## How to Install Dependencies

```bash
npm install
```

For Playwright (JS-heavy stores like Wayfair, The Brick):
```bash
npm install playwright
npx playwright install chromium
```

---

## How to Seed Stores

Seeds all 28 Canadian/Ontario furniture stores into the `stores` table.
Safe to run multiple times — upserts by domain.

```bash
npm run seed:furniture-stores
```

---

## How to Run All Scrapers

```bash
# Live run (saves to Supabase)
npm run scrape:furniture

# Dry run (no data saved — just shows what would be scraped)
npm run scrape:furniture:dry

# Run only Shopify stores
npm run scrape:furniture -- --strategy=shopify_products_json

# Run a specific store
npm run scrape:furniture -- --store="Article"

# Limit products per store
npm run scrape:furniture -- --max=100
```

---

## How to Run Only IKEA

Requires `APIFY_TOKEN` and `APIFY_IKEA_ACTOR_ID` in `.env`.

```bash
npm run scrape:ikea
npm run scrape:ikea:dry
```

Get an Apify token at: https://console.apify.com/account/integrations
Find IKEA actors at: https://apify.com/store?search=ikea

---

## How to Run Shopify Stores

```bash
npm run scrape:shopify
npm run scrape:shopify:dry

# Specific store
npm run scrape:shopify -- --store="Structube"
```

Shopify stores use the public `/products.json` endpoint.
No authentication required.

---

## How to Add a New Store

1. Open `scripts/furniture-scraper/sources.ts`
2. Add an entry to `STORE_SOURCES`:

```typescript
{
  name: 'My New Store',
  website: 'https://www.mynewstore.ca/',
  domain: 'mynewstore.ca',
  country: 'CA',
  province: 'ON',
  city: 'Toronto',
  storeType: 'local_shop',
  scrapeStrategy: 'shopify_products_json', // or custom_cheerio, custom_playwright
  scrapeNotes: 'Shopify store',
  isActive: true,
}
```

3. If using `custom_cheerio`, add selectors to `STORE_SELECTORS` in `scrapeCustomCheerio.ts`
4. If using `custom_playwright`, add config to `PLAYWRIGHT_CONFIGS` in `scrapeCustomPlaywright.ts`
5. Run `npm run seed:furniture-stores` to add the store to Supabase
6. Run `npm run scrape:furniture -- --store="My New Store"` to scrape it

---

## How scrape_jobs and scrape_job_items Work

Every scraper run creates a `scrape_jobs` row:
- Status transitions: `queued` → `running` → `completed` / `failed`
- Counts: `total_found`, `total_inserted`, `total_updated`, `total_failed`
- Error message stored if the job fails

For each product processed, a `scrape_job_items` row is created:
- Status: `inserted`, `updated`, `skipped`, or `failed`
- `raw_payload` contains the original scraped data for debugging
- `error_message` explains why a product was skipped or failed

---

## How Products, Attributes, and Dimensions Get Populated

**products table**:
- Upserted by `canonical_url` (primary dedup key)
- Falls back to `store_id + sku` or `store_id + normalized_title + price`
- `last_seen_at` updated on every scrape
- `raw_payload` stores the full original source data

**product_attributes table**:
- Colors inferred from title + description + option values
- Materials inferred from title + description
- Styles inferred from title + description + tags
- Room types inferred from product category
- `extracted_by = 'rule_based'`

**product_dimensions table**:
- Parsed from dimension strings in various formats
- Inches automatically converted to cm
- Original text preserved in `raw_dimensions_text`

---

## Troubleshooting

**"Missing SUPABASE_SERVICE_ROLE_KEY"**
→ Add `SUPABASE_SERVICE_ROLE_KEY=...` to your `.env` file (not `.env.example`)

**"Missing APIFY_IKEA_ACTOR_ID"**
→ Find an IKEA actor at https://apify.com/store?search=ikea
→ Add `APIFY_IKEA_ACTOR_ID=dtrungtin/ikea-scraper` to `.env`

**"No Shopify products found"**
→ The store may not use Shopify, or may have disabled `/products.json`
→ Try `custom_cheerio` or `custom_playwright` strategy instead

**"No Cheerio selectors configured for domain.com"**
→ Add selectors to `STORE_SELECTORS` in `scrapeCustomCheerio.ts`

**"Playwright not installed"**
→ Run: `npm install playwright && npx playwright install chromium`

**Products not appearing in frontend**
→ Check `is_active = true` and `availability != 'out_of_stock'`
→ Run `node scripts/connect-supabase.mjs` to verify table counts

**Duplicate products**
→ The scraper deduplicates by `canonical_url`. If you see duplicates,
  check if the same product has different URLs (e.g. with/without tracking params)

---

## File Structure

```
scripts/furniture-scraper/
├── index.ts                    # Main orchestrator
├── config.ts                   # Environment config
├── supabase.ts                 # Supabase admin client
├── logger.ts                   # Structured logger
├── sources.ts                  # Store definitions (28+ stores)
├── seedStores.ts               # Seed stores into Supabase
├── SCHEMA_MAPPING.md           # Field → column mapping docs
├── README.md                   # This file
├── normalize/
│   ├── normalizeProduct.ts     # Main normalization entry point
│   ├── inferFurnitureType.ts   # Infer furniture type from text
│   ├── inferRoomType.ts        # Infer room type from category
│   ├── inferStyles.ts          # Infer style + aesthetic tags
│   ├── inferColors.ts          # Infer normalized colors
│   ├── inferMaterials.ts       # Infer normalized materials
│   └── parseDimensions.ts      # Parse dimension strings → cm
├── scrapers/
│   ├── scrapeIkeaApify.ts      # IKEA via Apify
│   ├── scrapeShopifyStore.ts   # Shopify /products.json
│   ├── scrapeCustomCheerio.ts  # Static sites (Cheerio)
│   └── scrapeCustomPlaywright.ts # JS-heavy sites (Playwright)
├── db/
│   ├── upsertStore.ts          # Store upsert wrapper
│   ├── upsertProduct.ts        # Product upsert (re-export)
│   ├── scrapeJobs.ts           # Job lifecycle (re-export)
│   ├── scrapeJobItems.ts       # Item logging
│   └── enqueueEmbeddings.ts    # Embedding queue monitor
└── utils/
    ├── sleep.ts                # Async sleep
    ├── chunk.ts                # Array chunking
    ├── cleanText.ts            # HTML stripping
    ├── absoluteUrl.ts          # URL resolution + normalization
    ├── normalizePrice.ts       # Price parsing
    └── validateProduct.ts      # Product validation
```
