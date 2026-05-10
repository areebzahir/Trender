# 🎉 Furniture Scraper System - Ready to Use!

## Current Branch: `feature/furniture-scraper-v2`

You're now on the **production-ready furniture scraping branch** with a complete ETL system for populating your Supabase database.

---

## ✅ What's Already Built

### 1. Complete Scraping System
- **28+ Canadian furniture stores** configured
- **4 scraping strategies**: IKEA (Apify), Shopify, Cheerio (static), Playwright (JS-heavy)
- **Automatic normalization**: prices, colors, materials, styles, dimensions
- **Deduplication**: by URL, SKU, or title+price
- **Job tracking**: Every scrape logged in `scrape_jobs` and `scrape_job_items`

### 2. Database Integration
All scraped data goes into your existing Supabase tables:
- ✅ `stores` - Store information
- ✅ `products` - Product catalog
- ✅ `product_attributes` - Colors, materials, styles
- ✅ `product_dimensions` - Width, height, depth (cm)
- ✅ `product_embeddings` - Placeholder for AI matching
- ✅ `scrape_jobs` - Ingestion tracking
- ✅ `scrape_job_items` - Per-product status

### 3. Configured Stores

**Major Chains:**
- IKEA Canada (Apify)
- Structube (Playwright)
- Article (Playwright)
- Wayfair Canada (Playwright)
- The Brick (Playwright)
- Leon's (Playwright)
- JYSK Canada
- Ashley HomeStore Canada
- Canadian Tire
- Walmart Canada

**Specialty Furniture:**
- EQ3
- Urban Barn
- Mobilia
- Rove Concepts
- Cozey
- Silk & Snow
- Endy

**Plus 11 more stores!**

---

## 🚀 How to Use

### Step 1: Seed Stores (One-time)
```bash
npm run seed:furniture-stores
```
This adds all 28 stores to your `stores` table.

### Step 2: Run Scrapers

**Scrape All Stores:**
```bash
# Live run (saves to database)
npm run scrape:furniture

# Dry run (test mode - no data saved)
npm run scrape:furniture:dry

# Limit products per store
npm run scrape:furniture -- --max=100
```

**Scrape Only IKEA:**
```bash
npm run scrape:ikea
npm run scrape:ikea:dry
```

**Scrape Only Shopify Stores:**
```bash
npm run scrape:shopify
npm run scrape:shopify:dry

# Specific store
npm run scrape:shopify -- --store="Structube"
```

**Scrape Specific Store:**
```bash
npm run scrape:furniture -- --store="Article"
```

### Step 3: Verify Data
```bash
npm run verify:furniture
npx tsx scripts/check-all-tables.ts
```

---

## 📋 Current Database Status

From your last check:
- **28 stores** already seeded
- **367 products** already in database
- **367 product attributes** with colors, materials, styles
- **8 product dimensions** (needs more scraping)
- **5 scrape jobs** completed

**This means the scraper has already been run!** 🎉

---

## 🔧 Configuration

### Required Environment Variables

Your `.env` file needs:

```env
# Supabase (already configured)
SUPABASE_URL=https://hbehelmqrzrnlmnhryfu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here

# Apify (for IKEA scraping)
APIFY_TOKEN=your_apify_token_here
APIFY_IKEA_ACTOR_ID=dtrungtin/ikea-scraper

# Optional tuning
SCRAPER_BATCH_SIZE=500
SCRAPER_MAX_PRODUCTS_PER_SOURCE=1000
SCRAPER_DELAY_MS=1200
```

**Get Apify Token:**
1. Sign up at https://console.apify.com/
2. Go to Settings → Integrations
3. Copy your API token
4. Add to `.env` as `APIFY_TOKEN=...`

---

## 📊 How It Works

### ETL Pipeline

**1. Extract**
- IKEA: Uses Apify actor to scrape full catalog
- Shopify: Fetches `/products.json` endpoint
- Others: Cheerio (static HTML) or Playwright (JS-rendered)

**2. Transform**
- Normalize prices (remove $, convert to number)
- Infer colors from title/description
- Infer materials from title/description
- Infer styles (modern, scandinavian, luxury, etc.)
- Parse dimensions (convert inches → cm)
- Categorize furniture type
- Determine room types

**3. Load**
- Upsert store (dedupe by domain)
- Upsert product (dedupe by URL or SKU)
- Insert/update dimensions
- Insert/update attributes
- Create embedding placeholder
- Log to scrape_jobs and scrape_job_items

### Deduplication Strategy

Products are deduplicated by:
1. **canonical_url** (primary key)
2. **store_id + sku** (fallback)
3. **store_id + normalized_title + price** (last resort)

This prevents duplicates even if the same product is scraped multiple times.

---

## 🎯 Perfect for Trender AI

Your database structure is **ideal** for AI-powered furniture recommendations:

### Room Analysis → Database Query

**User uploads room photo:**
```
Gemini detects:
- Colors: beige, natural wood, white
- Style: scandinavian, modern
- Room: living_room
- Request: "Add a modern sofa"
```

**Query your database:**
```sql
SELECT p.*, pa.*, pd.*
FROM products p
JOIN product_attributes pa ON p.id = pa.product_id
JOIN product_dimensions pd ON p.id = pd.product_id
WHERE 
  p.category = 'sofa'
  AND p.is_active = true
  AND 'modern' = ANY(pa.styles)
  AND ('beige' = ANY(pa.colors) OR 'natural_wood' = ANY(pa.colors))
  AND 'living_room' = ANY(pa.room_types)
ORDER BY p.price ASC
LIMIT 5;
```

**AI generates recommendation:**
```
"I recommend the KIVIK 3-seat sofa from IKEA Canada ($799).

Why this matches your room:
• Anthracite grey complements your warm wood tones
• Modern Scandinavian style fits your aesthetic
• 228×95 cm dimensions perfect for living rooms
• Fabric material adds softness

🔗 Buy: https://www.ikea.com/ca/...
🖼️ View in your room: [AI mockup]"
```

---

## 📁 File Structure

```
scripts/furniture-scraper/
├── index.ts                    # Main orchestrator
├── config.ts                   # Environment config
├── supabase.ts                 # Supabase client
├── logger.ts                   # Structured logging
├── sources.ts                  # 28+ store definitions
├── seedStores.ts               # Seed stores script
├── README.md                   # Complete documentation
├── SCHEMA_MAPPING.md           # Database mapping
├── normalize/                  # Data normalization
│   ├── normalizeProduct.ts
│   ├── inferColors.ts
│   ├── inferMaterials.ts
│   ├── inferStyles.ts
│   ├── parseDimensions.ts
│   └── ...
├── scrapers/                   # Scraping strategies
│   ├── scrapeIkeaApify.ts
│   ├── scrapeShopifyStore.ts
│   ├── scrapeCustomCheerio.ts
│   └── scrapeCustomPlaywright.ts
├── db/                         # Database operations
│   ├── upsertStore.ts
│   ├── upsertProduct.ts
│   ├── scrapeJobs.ts
│   └── ...
└── utils/                      # Helper functions
    ├── normalizePrice.ts
    ├── cleanText.ts
    ├── absoluteUrl.ts
    └── ...
```

---

## 🔍 Monitoring & Debugging

### Check Scrape Jobs
```sql
SELECT * FROM scrape_jobs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Failed Items
```sql
SELECT * FROM scrape_job_items 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

### Check Product Counts by Store
```sql
SELECT s.name, COUNT(p.id) as product_count
FROM stores s
LEFT JOIN products p ON p.store_id = s.id
GROUP BY s.id, s.name
ORDER BY product_count DESC;
```

---

## 🚨 Troubleshooting

### "Missing APIFY_TOKEN"
→ Sign up at https://console.apify.com/ and get your API token

### "Playwright not installed"
→ Run: `npm install playwright && npx playwright install chromium`

### "No products found"
→ Check if store's `/products.json` is accessible
→ Try different scrape strategy (cheerio → playwright)

### "Duplicate products"
→ Check `canonical_url` normalization
→ Verify URL params are being stripped

### Products not showing in frontend
→ Check `is_active = true`
→ Verify RLS policies allow public read access

---

## 📈 Next Steps

### Immediate
1. ✅ Database already populated with 367 products
2. Run more scrapers to add products from other stores
3. Add dimensions for products missing them

### Short Term
1. Set up automated scraping (daily/weekly)
2. Monitor price changes
3. Track product availability
4. Generate embeddings for AI matching

### Long Term
1. Add more stores (US, UK markets)
2. Implement real-time stock checking
3. Add product reviews/ratings
4. Build price history tracking

---

## 🎉 Summary

**You have a production-ready furniture scraping system!**

- ✅ 28 stores configured
- ✅ 367 products already scraped
- ✅ Complete ETL pipeline
- ✅ Automatic normalization
- ✅ Deduplication working
- ✅ Database fully integrated
- ✅ Ready for AI recommendations

**To add more products:**
```bash
npm run scrape:furniture
```

**To test without saving:**
```bash
npm run scrape:furniture:dry
```

All code is on the `feature/furniture-scraper-v2` branch and ready to use! 🚀
