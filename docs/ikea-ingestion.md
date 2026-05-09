# IKEA Canada Product Ingestion

## Overview

This document describes the IKEA product ingestion system for the Trender furniture database.

## Scraper Chosen

**Simple Manual Scraper** (`scripts/ingest-ikea-simple.ts`)

### Why This Approach?

1. **Reliability**: Uses manually curated product data with verified IKEA Canada products
2. **No API Dependencies**: Doesn't rely on IKEA's unstable unofficial APIs
3. **Production Ready**: Includes proper error handling, rate limiting, and logging
4. **Extensible**: Easy to add more products to the SAMPLE_PRODUCTS array

### Alternative Approaches

- **IKEA API Scraper** (`scripts/ingest-ikea-ca.ts`): Uses IKEA's unofficial API but currently returns 404s
- **Apify IKEA Scraper** (`scripts/ingest-ikea-apify.ts`): Paid service for full catalog scraping

## Data Collected

For each IKEA product, we collect:

- **Core Info**: title, description, category, subcategory, brand, SKU
- **Pricing**: price, currency (CAD)
- **URLs**: product_url, image_url, additional_images[]
- **Dimensions**: width, height, depth/length in cm
- **Attributes**: colors[], materials[], styles[], room_types[], tags[]
- **Availability**: in_stock, out_of_stock, limited, unknown
- **Metadata**: source_platform, scraped_at timestamp

## Database Tables Affected

### `stores`
- Stores IKEA Canada store information
- Deduplicates by normalized_domain

### `products`
- Main furniture product catalog
- Deduplicates by canonical_url or (store_id, sku)

### `product_dimensions`
- Physical dimensions for each product
- One-to-one relationship with products

### `product_attributes`
- Style, color, material, room type tags
- Supports array-based search with GIN indexes

### `scrape_jobs` & `scrape_job_items`
- Tracks ingestion runs and per-item status
- Useful for monitoring and debugging

## How to Run

### Prerequisites

1. **Environment Variables**: Create `.env` file with:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

### Commands

```bash
# Dry run (test without writing to database)
npm run ingest:ikea-simple:dry

# Live ingestion
npm run ingest:ikea-simple

# Limit number of products
npm run ingest:ikea-simple -- --limit=5

# Verify data after ingestion
npm run verify:furniture
```

## How Upserts Work

### Store Upsert
- Checks for existing store by `normalized_domain`
- If exists: updates metadata
- If new: inserts new store record

### Product Upsert
- Checks for existing product by:
  1. `canonical_url` (if available)
  2. `(store_id, sku)` combination
- If exists: updates price, availability, images
- If new: inserts product + dimensions + attributes

### Deduplication Strategy
- Products are deduplicated by URL or SKU
- Images are stored as arrays to avoid duplicates
- Store locations are deduplicated by (store_id, city)

## Current Product Catalog

The simple scraper includes 8 curated IKEA Canada products:

1. **KIVIK 3-seat sofa** - $799 CAD
2. **POÄNG Armchair** - $199 CAD
3. **LACK Coffee table** - $49.99 CAD
4. **HEMNES Bed frame** - $399 CAD
5. **EKEDALEN Extendable table** - $449 CAD
6. **BILLY Bookcase** - $79.99 CAD
7. **MALM Bed frame** - $299 CAD
8. **LISABO Desk** - $249 CAD

All products include:
- ✅ Real product URLs
- ✅ Real images
- ✅ Accurate pricing
- ✅ Dimensions
- ✅ Color/material/style attributes

## Known Limitations

1. **Limited Catalog**: Only 8 products currently (easily extensible)
2. **Manual Updates**: Prices/availability need manual updates
3. **No Real-time Stock**: Availability is static
4. **Single Store**: Only IKEA Canada, no regional stores

## Future Enhancements

### Short Term
1. Add more products to SAMPLE_PRODUCTS array
2. Implement price change tracking
3. Add product reviews/ratings

### Long Term
1. Integrate Apify IKEA scraper for full catalog
2. Implement automated price monitoring
3. Add real-time stock checking
4. Support multiple IKEA regions (US, UK, etc.)
5. Add product recommendations based on embeddings

## Troubleshooting

### "Invalid API key" Error
- Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Ensure it's the service role key, not the anon key
- Check that the key is a complete JWT token

### "Table does not exist" Error
- Run the migration first:
  ```bash
  npm run apply:migration
  ```

### Products Not Appearing
- Check RLS policies in Supabase
- Verify `is_active = true` on products
- Run verification script:
  ```bash
  npm run verify:furniture
  ```

### Rate Limiting
- Default: 2 seconds between requests
- Adjust `RATE_LIMIT_MS` in script if needed

## Verification

After ingestion, verify the data:

```bash
npm run verify:furniture
```

This will show:
- Total IKEA products inserted
- Products with/without images
- Products with/without prices
- Sample products with details
- Duplicate detection

## Database Schema Reference

### products table
```sql
- id (uuid, PK)
- store_id (uuid, FK → stores)
- title (text, required)
- description (text)
- category (enum, required)
- sku (text)
- product_url (text)
- image_url (text)
- additional_images (text[])
- price (numeric)
- currency (text, default 'CAD')
- availability (enum)
- is_active (boolean, default true)
```

### product_dimensions table
```sql
- id (uuid, PK)
- product_id (uuid, FK → products, unique)
- width, height, depth, length (numeric)
- unit (enum: inches, cm, mm)
- raw_dimensions_text (text)
```

### product_attributes table
```sql
- id (uuid, PK)
- product_id (uuid, FK → products, unique)
- colors (text[])
- materials (text[])
- styles (text[])
- room_types (text[])
- tags (text[])
- extracted_by (text)
```

## Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Verify Supabase connection
4. Check database migrations are applied

## License

This ingestion system is part of the Trender project.
