# IKEA Canada Product Ingestion

## Overview

This document describes the IKEA Canada product ingestion system for the Trender furniture catalog. The system uses IKEA's unofficial public APIs to collect comprehensive product data.

## Current Status

⚠️ **IMPORTANT**: This is a proof-of-concept implementation with sample product IDs. IKEA's API structure has changed and requires additional reverse engineering to discover all products programmatically.

### What Works
- ✅ Database schema ready for IKEA products
- ✅ Ingestion script framework complete
- ✅ Product normalization and upsert logic
- ✅ Verification script for data quality
- ✅ Comprehensive documentation

### What Needs Work
- ⚠️ Product discovery API endpoint needs updating
- ⚠️ Full catalog scraping requires web scraping or Apify
- ⚠️ Sample product IDs provided for testing

## Recommended Approaches

### Option 1: Use Apify IKEA Scraper (Recommended)

**Pros:**
- Maintained and updated regularly
- Handles all IKEA regions including Canada
- Extracts complete product data
- No need to reverse engineer APIs
- Handles rate limiting and anti-bot measures

**Cons:**
- Paid service ($0.002-0.01 per product)
- External dependency

**Apify Actors to consider:**
- `happyendpoint/ikea-scraper` - Most complete
- `shahidirfan/ikea-product-scraper` - Good alternative
- `mynewhome/ikea` - Another option

**Implementation:**
1. Sign up for Apify account
2. Get API token
3. Add to `.env`: `APIFY_API_TOKEN=your_token`
4. Use existing `apifyProvider.ts` in `src/lib/ingestion/providers/`
5. Adapt to call IKEA scraper actor

### Option 2: Web Scraping with Puppeteer/Playwright

**Pros:**
- Free and open-source
- Full control over scraping logic
- Can scrape any IKEA region

**Cons:**
- Requires browser automation
- Slower than API calls
- More fragile (breaks when HTML changes)
- Higher resource usage

**Implementation:**
1. Install Puppeteer: `npm install puppeteer`
2. Scrape category pages to discover product IDs
3. Use existing API calls for product details
4. Handle pagination and rate limiting

### Option 3: Manual Product List + API

**Pros:**
- Works with current implementation
- Fast for known products
- Good for testing

**Cons:**
- Limited to manually curated products
- Not scalable for full catalog

**Current Implementation:**
- Sample product IDs provided in script
- Works for proof-of-concept
- Good for initial testing

## Scraper Selection

### Chosen Solution: Hybrid API + Web Scraping

**Why this approach:**
- IKEA provides unofficial but publicly accessible REST APIs
- Product details API works well
- Product discovery requires web scraping or Apify
- Balance between cost and functionality

**Alternative approaches considered:**
- `ikea-availability-checker` npm package - Only checks stock, doesn't scrape full product catalog
- `vrslev/ikea-api-client` - Archived/unmaintained (Oct 2024)
- Pure web scraping - Slower and more fragile
- Apify only - Costs money but most reliable

### IKEA API Endpoints Used

1. **Product Details API** ✅ WORKS
   ```
   GET https://api.ingka.ikea.com/pip/product/ca/en/{itemNo}
   ```
   - Returns detailed product information
   - Includes descriptions, dimensions, materials, colors, image galleries

2. **Availability API** ✅ WORKS
   ```
   GET https://api.ingka.ikea.com/cia/availabilities/ru/ca?itemNos={itemNo}&expand=StoresList
   ```
   - Returns real-time stock availability across stores
   - Includes restock dates and probabilities

3. **Product Search/Discovery API** ❌ NEEDS WORK
   - Original endpoint no longer works
   - Requires web scraping or Apify to discover product IDs

**Authentication:**
- Uses public API key: `b6c117e5-ae61-4ef5-b4cc-e0b1e37f0631`
- Sent via `X-Client-ID` header
- No registration or account required

## Data Collected

### Core Product Fields
- ✅ Product name/title
- ✅ Description (short and long)
- ✅ Category and subcategory
- ✅ Price (regular and sale)
- ✅ Currency (CAD)
- ✅ Product URL
- ✅ Primary image URL
- ✅ Image gallery URLs
- ✅ Item/article number (SKU)
- ✅ Brand (IKEA)

### Additional Fields
- ✅ Dimensions (width, height, depth, length)
- ✅ Colors (from API)
- ✅ Materials (from API)
- ✅ Availability status (in_stock, out_of_stock, unknown)
- ✅ Product type/subcategory
- ✅ Source = "ikea_ca"
- ✅ Scraped timestamp

### Metadata
- Raw API responses stored in `raw_payload` JSONB field
- Embedding text prepared for future AI matching
- All data normalized to Trender schema

## Usage

### Prerequisites

```bash
# Install dependencies
npm install

# Ensure environment variables are set
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Commands

**Dry run (test without inserting):**
```bash
npm run ingest:ikea-ca:dry
```

**Dry run with limit:**
```bash
npm run ingest:ikea-ca -- --dry-run --limit=3
```

**Live ingestion (sample products):**
```bash
npm run ingest:ikea-ca
```

**Ingest specific category:**
```bash
npm run ingest:ikea-ca -- --category=sofas
```

**Ingest with product limit:**
```bash
npm run ingest:ikea-ca -- --limit=5
```

### Verify Data Quality

After ingestion, verify the data:

```bash
npm run verify:furniture
```

Filter by source:
```bash
npm run verify:furniture -- --source=custom_crawler
```

## Sample Products Included

The script includes sample product IDs for testing:

- **Sofas**: KIVIK, EKTORP, FRIHETEN, VIMLE, LANDSKRONA
- **Armchairs**: POÄNG, STRANDMON, EKERÖ, VEDBO
- **Coffee Tables**: LACK, HEMNES, STOCKHOLM, VITTSJÖ
- **Dining Tables**: INGATORP, EKEDALEN, MÖRBYLÅNGA, LISABO, NORDVIKEN
- **Beds**: MALM, HEMNES, TARVA, SONGESAND, BRIMNES

These are real IKEA Canada products that can be used to test the ingestion pipeline.

## Next Steps for Full Implementation

### 1. Choose Your Approach

**For Production (Recommended):**
- Use Apify IKEA scraper
- Budget: ~$50-100 for full IKEA Canada catalog
- Time: 1-2 hours to implement
- Maintenance: Low (Apify handles updates)

**For Free/Open Source:**
- Implement Puppeteer web scraping
- Time: 4-8 hours to implement
- Maintenance: Medium (breaks when IKEA updates site)

### 2. Implement Product Discovery

**If using Apify:**
```typescript
// Add to scripts/ingest-ikea-ca.ts
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
const run = await client.actor('happyendpoint/ikea-scraper').call({
  country: 'ca',
  language: 'en',
  categories: ['sofas', 'armchairs', 'tables'],
});

const { items } = await client.dataset(run.defaultDatasetId).listItems();
// Process items...
```

**If using Puppeteer:**
```typescript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://www.ikea.com/ca/en/cat/sofas-10663/');

const productIds = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('[data-product-id]'))
    .map(el => el.getAttribute('data-product-id'));
});
```

### 3. Update the Ingestion Script

Replace the `SAMPLE_PRODUCTS` constant with dynamic product discovery.

### 4. Run Full Ingestion

```bash
npm run ingest:ikea-ca
```

### 5. Verify and Monitor

```bash
npm run verify:furniture
```

## Database Tables Affected

### `stores`
- IKEA Canada store record
- Domain: `ikea.com`
- Store type: `chain`

### `products`
- Core product catalog
- Deduplication by `canonical_url` and `store_id + sku`
- Full-text search indexed

### `product_dimensions`
- Physical dimensions for room-fit calculations
- Parsed from IKEA measurement strings
- Unit: `cm` (IKEA Canada uses metric)

### `product_attributes`
- Colors, materials, styles, room types
- Extracted from IKEA API
- GIN indexed for array search

### `product_embeddings`
- Embedding text prepared
- Actual embeddings generated separately
- Used for AI-powered product matching

## Known Limitations

### API Limitations
- No official API documentation
- API structure may change without notice
- Product discovery endpoint needs updating
- Some products may have incomplete data

### Current Implementation Limitations
- Only sample products included
- Requires additional work for full catalog
- No automatic product discovery yet

### Future Improvements
- [ ] Implement full product discovery (Apify or Puppeteer)
- [ ] Incremental updates (only new/changed products)
- [ ] Multi-region support (US, UK, etc.)
- [ ] Image download and local storage
- [ ] Automatic embedding generation
- [ ] Price change tracking
- [ ] Stock alert system

## Troubleshooting

### "Missing Supabase credentials"
- Ensure `.env` file exists
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Never use `VITE_` prefix for service role key

### "Failed to fetch product: 404"
- Product ID may be invalid or discontinued
- Try with different product IDs
- Check IKEA Canada website for valid products

### Products missing images/prices
- Some IKEA products don't have complete data in API
- Check `stats.missingImages` and `stats.missingPrices` in output
- Run verification script to audit

## Support

**Issues:**
- Check this documentation first
- Run verification script to diagnose
- Check Supabase logs for errors
- Review console output for warnings

## License & Legal

**IKEA Trademark:**
- IKEA® is a registered trademark of Inter-IKEA Systems B.V.
- This tool is not affiliated with or endorsed by IKEA
- For educational and personal use only

**Data Usage:**
- Product data is publicly available on IKEA.com
- Scraping for personal/educational use
- Respect IKEA's robots.txt and terms of service
- Do not overload IKEA servers

## Changelog

### v1.0.0 (2026-05-09)
- Initial release
- IKEA Canada support
- Sample product IDs for testing
- Full API integration for product details
- Dry run mode
- Verification script
- Comprehensive documentation
- Note: Full product discovery requires additional implementation
