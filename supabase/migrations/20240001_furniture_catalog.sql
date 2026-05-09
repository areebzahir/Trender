-- ============================================================
-- Trender Furniture Catalog - Supabase Migration
-- Version: 1.0.0
-- Description: Full schema for Ontario/Canada furniture catalog,
--              ingestion tracking, search, and future AI matching.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy full-text search

-- ============================================================
-- UTILITY: updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: stores
-- Canadian/Ontario furniture retailers
-- ============================================================
CREATE TABLE IF NOT EXISTS stores (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  website           TEXT,
  domain            TEXT,                          -- normalized domain e.g. "article.com"
  phone             TEXT,
  email             TEXT,
  address           TEXT,
  city              TEXT,
  province          TEXT DEFAULT 'ON',
  postal_code       TEXT,
  country           TEXT DEFAULT 'CA',
  latitude          NUMERIC(10, 7),
  longitude         NUMERIC(10, 7),
  store_type        TEXT NOT NULL DEFAULT 'unknown'
                      CHECK (store_type IN ('local_shop','chain','marketplace','manufacturer','unknown')),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  -- scrape metadata
  discovered_by     TEXT,                          -- 'google_maps', 'serpapi', 'manual', 'apify'
  source_url        TEXT,
  source_platform   TEXT,
  scrape_allowed    BOOLEAN DEFAULT TRUE,
  scrape_notes      TEXT,
  -- deduplication
  normalized_domain TEXT GENERATED ALWAYS AS (
    LOWER(REGEXP_REPLACE(COALESCE(domain, ''), '^www\.', ''))
  ) STORED,
  -- timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS stores_normalized_domain_idx
  ON stores (normalized_domain)
  WHERE normalized_domain IS NOT NULL AND normalized_domain <> '';

CREATE INDEX IF NOT EXISTS stores_city_idx       ON stores (city);
CREATE INDEX IF NOT EXISTS stores_province_idx   ON stores (province);
CREATE INDEX IF NOT EXISTS stores_store_type_idx ON stores (store_type);
CREATE INDEX IF NOT EXISTS stores_is_active_idx  ON stores (is_active);

CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: store_locations
-- Multiple physical locations per store chain
-- ============================================================
CREATE TABLE IF NOT EXISTS store_locations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  label         TEXT,                              -- e.g. "Mississauga Location"
  address       TEXT,
  city          TEXT,
  province      TEXT DEFAULT 'ON',
  postal_code   TEXT,
  country       TEXT DEFAULT 'CA',
  latitude      NUMERIC(10, 7),
  longitude     NUMERIC(10, 7),
  phone         TEXT,
  email         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  hours         JSONB,                             -- { mon: "9-6", tue: "9-6", ... }
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS store_locations_store_id_idx ON store_locations (store_id);
CREATE INDEX IF NOT EXISTS store_locations_city_idx     ON store_locations (city);

CREATE TRIGGER store_locations_updated_at
  BEFORE UPDATE ON store_locations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: scrape_jobs
-- Track every ingestion run
-- ============================================================
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type     TEXT NOT NULL
                    CHECK (source_type IN ('apify','serpapi','custom_crawler','csv','manual')),
  source_name     TEXT,                            -- e.g. "apify/google-maps-scraper"
  target_url      TEXT,
  status          TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued','running','completed','failed','cancelled')),
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  total_found     INTEGER DEFAULT 0,
  total_inserted  INTEGER DEFAULT 0,
  total_updated   INTEGER DEFAULT 0,
  total_failed    INTEGER DEFAULT 0,
  error_message   TEXT,
  raw_config      JSONB,                           -- actor config, query params, etc.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scrape_jobs_status_idx      ON scrape_jobs (status);
CREATE INDEX IF NOT EXISTS scrape_jobs_source_type_idx ON scrape_jobs (source_type);
CREATE INDEX IF NOT EXISTS scrape_jobs_created_at_idx  ON scrape_jobs (created_at DESC);

CREATE TRIGGER scrape_jobs_updated_at
  BEFORE UPDATE ON scrape_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: products
-- Core furniture product catalog
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id              UUID REFERENCES stores(id) ON DELETE SET NULL,
  -- core fields
  title                 TEXT NOT NULL,
  description           TEXT,
  category              TEXT NOT NULL DEFAULT 'unknown'
                          CHECK (category IN (
                            'sofa','sectional','loveseat','armchair','accent_chair',
                            'coffee_table','side_table','dining_table','dining_chair',
                            'bed_frame','mattress','nightstand','dresser','wardrobe',
                            'tv_stand','media_console','desk','office_chair','bookshelf',
                            'storage_cabinet','rug','lighting','mirror','decor','unknown'
                          )),
  subcategory           TEXT,
  brand                 TEXT,
  sku                   TEXT,
  model_number          TEXT,
  -- URLs
  product_url           TEXT,
  canonical_url         TEXT,                      -- normalized/deduped URL
  image_url             TEXT,                      -- primary image
  additional_images     TEXT[],                    -- extra images array
  -- pricing
  price                 NUMERIC(10, 2),
  original_price        NUMERIC(10, 2),
  currency              TEXT NOT NULL DEFAULT 'CAD',
  on_sale               BOOLEAN DEFAULT FALSE,
  -- availability
  availability          TEXT DEFAULT 'unknown'
                          CHECK (availability IN ('in_stock','out_of_stock','limited','unknown')),
  condition             TEXT NOT NULL DEFAULT 'new'
                          CHECK (condition IN ('new','used','open_box','unknown')),
  delivery_info         TEXT,
  pickup_available      BOOLEAN,
  location_availability TEXT[],                    -- cities/regions where available
  -- ingestion metadata
  source_platform       TEXT,                      -- 'apify', 'serpapi', 'csv', 'manual'
  scrape_job_id         UUID REFERENCES scrape_jobs(id) ON DELETE SET NULL,
  raw_payload           JSONB,                     -- original source data
  -- deduplication helpers
  normalized_title      TEXT,                      -- lowercased, stripped title
  -- lifecycle
  first_seen_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_price_seen_at    TIMESTAMPTZ,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deduplication indexes
CREATE UNIQUE INDEX IF NOT EXISTS products_canonical_url_idx
  ON products (canonical_url)
  WHERE canonical_url IS NOT NULL AND canonical_url <> '';

CREATE UNIQUE INDEX IF NOT EXISTS products_store_sku_idx
  ON products (store_id, sku)
  WHERE store_id IS NOT NULL AND sku IS NOT NULL AND sku <> '';

-- Search indexes
CREATE INDEX IF NOT EXISTS products_store_id_idx      ON products (store_id);
CREATE INDEX IF NOT EXISTS products_category_idx      ON products (category);
CREATE INDEX IF NOT EXISTS products_is_active_idx     ON products (is_active);
CREATE INDEX IF NOT EXISTS products_price_idx         ON products (price);
CREATE INDEX IF NOT EXISTS products_availability_idx  ON products (availability);
CREATE INDEX IF NOT EXISTS products_source_platform_idx ON products (source_platform);

-- Full-text search index
CREATE INDEX IF NOT EXISTS products_fts_idx ON products
  USING GIN (
    to_tsvector('english',
      COALESCE(title, '') || ' ' ||
      COALESCE(description, '') || ' ' ||
      COALESCE(category, '') || ' ' ||
      COALESCE(brand, '')
    )
  );

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: product_dimensions
-- Physical dimensions for room-fit calculations
-- ============================================================
CREATE TABLE IF NOT EXISTS product_dimensions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  width               NUMERIC(8, 2),
  height              NUMERIC(8, 2),
  depth               NUMERIC(8, 2),
  length              NUMERIC(8, 2),
  seat_height         NUMERIC(8, 2),
  weight              NUMERIC(8, 2),
  unit                TEXT NOT NULL DEFAULT 'inches'Areeb
areeb_z
Invisible

Haaziq — 3/19/2026 9:19 PM



Haaziq — 3/19/2026 9:30 PM


Areeb
 started a call that lasted a few seconds. — 3/19/2026 9:51 PM
Haaziq — 3/26/2026 6:01 PM


Image
Haaziq — 3/26/2026 6:16 PM
Image
Areeb
 started a call that lasted a few seconds. — 5/6/2026 5:25 PM
Areeb
 started a call that lasted 2 minutes. — 5/6/2026 5:36 PM
Haaziq
 started a call that lasted an hour. — 5/6/2026 6:11 PM
Haaziq — 9:20 PM
call me whenever your ready
Areeb
 started a call that lasted 27 minutes. — 9:21 PM
Areeb
 started a call. — 9:53 PM
Areeb — 9:58 PM
sammynuts309@gmail.com
Haaziq — 10:01 PM
e
You are working on my existing Trender app.

IMPORTANT:

Only construct the Supabase database + ingestion architecture right now.

-- Note: Use environment variables for API keys. Never commit secrets to git.
-- Set SUPABASE_SERVICE_ROLE_KEY in your .env file for backend operations.
-- Set VITE_SUPABASE_ANON_KEY in your .env file for frontend operations.

message.txt
6 KB
Take full ownership of applying the Supabase SQL/database changes yourself.

IMPORTANT:
I already gave you the Supabase environment variables/API keys in this project.
Use them yourself to connect to Supabase and apply the migration.
Do NOT just generate SQL and tell me to paste it manually.

message.txt
5 KB
Before coding, create a visible 10-agent execution board with one task list per agent, then start all independent agents immediately and only pause for integration after parallel work is done.
Haaziq — 10:23 PM
Before continuing the Trender furniture database task, create and attach a high-quality “famous/best-practice skill pack” to every agent.

What I mean by “famous skill files”:
Use well-known software engineering best practices and proven patterns from professional teams, including:
- Clean Architecture
- SOLID principles

message.txt
10 KB
Areeb — 10:34 PM
https://www.forbes.com/30-under-30-nominations/
Forbes
Haaziq — 11:10 PM
You are working on my Trender app. Your task is ONLY to find and integrate an open-source IKEA scraper/data ingestion pipeline into my existing Supabase database.

Goal:
Find an open-source IKEA scraper that can collect IKEA Canada furniture/product data including:
- product name
- description

message.txt
7 KB
﻿
You are working on my Trender app. Your task is ONLY to find and integrate an open-source IKEA scraper/data ingestion pipeline into my existing Supabase database.

Goal:
Find an open-source IKEA scraper that can collect IKEA Canada furniture/product data including:
- product name
- description
- category
- price
- currency
- product URL
- image URL / image gallery URLs
- item/article number/SKU
- dimensions if available
- color/material if available
- availability/stock if available
- source = "ikea_ca"
- scraped_at timestamp

Important:
Use an open-source scraper first. A candidate repo to inspect is:
- scraper-bank/Ikea.com-Scrapers on GitHub, which says it provides Python and Node.js IKEA scrapers using Playwright/Puppeteer and can extract product/search/category data. Validate this before using it. :contentReference[oaicite:0]{index=0}

Also check if there are better maintained options from GitHub or npm. The scraper must support or be adaptable to IKEA Canada pages.

Do NOT build the full app right now.
Do NOT change frontend UI.
Do NOT build image stitching yet.
Only create the database ingestion system and populate Supabase with IKEA product data.

My stack:
- Supabase Postgres
- Existing Trender web app
- Use environment variables for Supabase credentials
- Do not hardcode keys
- If keys already exist in the project, use them safely

Tasks:

1. Audit current Supabase/database structure
- Inspect my existing Supabase schema/migrations if available.
- Do not duplicate tables if similar tables already exist.
- If furniture/products tables already exist, extend them carefully.
- If missing, create clean production-ready tables.

2. Create/extend these tables if needed:

stores:
- id uuid primary key
- name text
- slug text unique
- website_url text
- country text
- region text
- city text nullable
- source text
- created_at timestamptz
- updated_at timestamptz

furniture_products:
- id uuid primary key
- store_id uuid references stores(id)
- source text
- external_id text
- sku text
- name text
- slug text
- description text
- category text
- subcategory text
- product_url text
- primary_image_url text
- price numeric
- currency text default 'CAD'
- sale_price numeric nullable
- color text nullable
- material text nullable
- dimensions jsonb nullable
- attributes jsonb nullable
- availability jsonb nullable
- embedding_text text nullable
- is_active boolean default true
- scraped_at timestamptz
- created_at timestamptz
- updated_at timestamptz

furniture_product_images:
- id uuid primary key
- product_id uuid references furniture_products(id) on delete cascade
- image_url text
- alt_text text nullable
- position int
- created_at timestamptz

furniture_categories:
- id uuid primary key
- name text
- slug text unique
- parent_id uuid nullable references furniture_categories(id)
- source text
- created_at timestamptz

3. Add useful constraints/indexes
- unique(source, external_id)
- index on category
- index on store_id
- index on price
- index on source
- index on is_active
- trigram/full-text search index for product name/description/category if possible
- product_url should be unique where possible
- image_url should not duplicate per product

4. Build scraper ingestion script
Create a script in the backend/scripts folder, for example:

scripts/ingest-ikea-ca.ts

The script should:
- Use the selected open-source IKEA scraper or adapt its logic
- Target IKEA Canada only
- Pull product/category pages
- Extract product data
- Normalize data into my Supabase schema
- Upsert products instead of duplicating
- Upsert images separately
- Add source = "ikea_ca"
- Add store record for IKEA Canada if it does not exist
- Store all raw/non-standard fields in attributes jsonb
- Handle missing prices/images gracefully
- Log progress clearly
- Save failed URLs to a retry file/log
- Include rate limiting and retry logic
- Avoid overloading the site
- Support dry-run mode
- Support category filtering
- Support max product limit for testing

Example commands:
npm run ingest:ikea-ca
npm run ingest:ikea-ca -- --dry-run
npm run ingest:ikea-ca -- --limit=50
npm run ingest:ikea-ca -- --category=sofas

5. Add package scripts
Add scripts to package.json:
- "ingest:ikea-ca": "tsx scripts/ingest-ikea-ca.ts"
- "ingest:ikea-ca:dry": "tsx scripts/ingest-ikea-ca.ts --dry-run"

6. Add environment variables
Use:
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY

Never expose service role key to frontend.
Only use the service role key in server-side scripts.

7. Add validation
Before inserting, validate:
- product has name
- product has product_url
- product has at least one image URL if available
- price is numeric if present
- image URLs are valid URLs
- product URLs are valid URLs
- source/external_id exists or derive external_id from product URL/article number

8. Add image-focused fields for Trender
Because Trender needs to visually place furniture into rooms, make sure every product can support:
- primary_image_url
- all gallery images
- category
- dimensions
- material/color
- product_url
- price
- attributes jsonb for extra metadata

9. Add future AI matching support
Create embedding_text for each product like:
"{name}. {category}. {description}. Color: {color}. Material: {material}. Dimensions: {dimensions}. Price: {price} CAD."

Do not generate embeddings yet unless my project already has embedding support.
Just prepare the field.

10. Create a README
Create:
docs/ikea-ingestion.md

Include:
- scraper chosen
- why it was chosen
- what data it collects
- how to run it
- required env vars
- dry run command
- how upserts work
- what tables are affected
- known limitations

11. Testing
Create tests or at minimum a verification script:
scripts/verify-furniture-data.ts

It should check:
- total IKEA products inserted
- products missing images
- products missing prices
- duplicate product URLs
- duplicate image URLs
- sample 10 random products with name, price, image, URL

12. Quality requirements
- TypeScript preferred if my backend is TypeScript
- Clean code
- No messy one-off script
- No duplicated schema
- No frontend changes
- No fake data
- No broken placeholder URLs
- No inserting products without URLs
- Add comments where needed
- Make it production-ready enough that I can later add other stores like Structube, Wayfair, Article, EQ3, The Brick, Leon’s, etc.

13. Final deliverables
At the end, give me:
- the scraper repo/library selected
- files created/changed
- SQL migration added
- how many IKEA products were inserted
- how many products have images
- how many failed/skipped
- exact commands to run again
- any limitations

Run the process in this order:
1. inspect existing schema
2. find/select scraper
3. create/adjust SQL migration
4. build ingestion script
5. run dry run with 20 products
6. fix errors
7. run real ingest with a safe limit first
8. verify database
9. document everything
message.txt
7 KB
                        CHECK (unit IN ('inches','cm','mm')),
  raw_dimensions_text TEXT,                        -- original string e.g. "104.5\" W x 34.25\" H x 38\" D"
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id)
);

CREATE TRIGGER product_dimensions_updated_at
  BEFORE UPDATE ON product_dimensions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: product_attributes
-- Style, color, material, room type tags
-- ============================================================
CREATE TABLE IF NOT EXISTS product_attributes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  colors            TEXT[],
  materials         TEXT[],
  styles            TEXT[],
  room_types        TEXT[],
  tags              TEXT[],
  -- AI extraction confidence (0.0 - 1.0)
  color_confidence     NUMERIC(3, 2),
  material_confidence  NUMERIC(3, 2),
  style_confidence     NUMERIC(3, 2),
  -- source of extraction
  extracted_by      TEXT DEFAULT 'manual',         -- 'manual', 'gemini', 'openai', 'rule_based'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id)
);

-- GIN indexes for array search
CREATE INDEX IF NOT EXISTS product_attributes_colors_idx     ON product_attributes USING GIN (colors);
CREATE INDEX IF NOT EXISTS product_attributes_materials_idx  ON product_attributes USING GIN (materials);
CREATE INDEX IF NOT EXISTS product_attributes_styles_idx     ON product_attributes USING GIN (styles);
CREATE INDEX IF NOT EXISTS product_attributes_room_types_idx ON product_attributes USING GIN (room_types);

CREATE TRIGGER product_attributes_updated_at
  BEFORE UPDATE ON product_attributes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: product_embeddings
-- pgvector embeddings for semantic similarity search
-- Vector size: 1536 (OpenAI text-embedding-3-small / ada-002)
-- To use Gemini embedding-001 (768 dims), change to vector(768)
-- Document: EMBEDDING_DIMENSIONS env var controls this at generation time
-- ============================================================
CREATE TABLE IF NOT EXISTS product_embeddings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  -- The text that was embedded (for debugging/re-embedding)
  source_text TEXT,
  -- Embedding vector — 1536 dims for OpenAI, change to 768 for Gemini
  embedding   vector(1536),
  model       TEXT DEFAULT 'text-embedding-3-small',  -- track which model generated it
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id)
);

-- HNSW index for fast approximate nearest-neighbor search
CREATE INDEX IF NOT EXISTS product_embeddings_hnsw_idx
  ON product_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE TRIGGER product_embeddings_updated_at
  BEFORE UPDATE ON product_embeddings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: scrape_job_items
-- Per-item tracking within a scrape job
-- ============================================================
CREATE TABLE IF NOT EXISTS scrape_job_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id        UUID NOT NULL REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  external_id   TEXT,                              -- ID from source (Apify item ID, SerpApi product_id)
  product_url   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','inserted','updated','skipped','failed')),
  error_message TEXT,
  raw_payload   JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scrape_job_items_job_id_idx ON scrape_job_items (job_id);
CREATE INDEX IF NOT EXISTS scrape_job_items_status_idx ON scrape_job_items (status);

-- ============================================================
-- TABLE: room_photos
-- Future: user-uploaded room images for mockup editing
-- ============================================================
CREATE TABLE IF NOT EXISTS room_photos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID,                           -- nullable until auth is added
  image_url        TEXT NOT NULL,
  room_type        TEXT,                           -- 'living_room', 'bedroom', etc.
  detected_style   TEXT[],                         -- AI-detected styles (future)
  detected_colors  TEXT[],                         -- AI-detected dominant colors (future)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS room_photos_user_id_idx ON room_photos (user_id);

-- ============================================================
-- TABLE: furniture_request_logs
-- Future: log user natural-language furniture requests for AI matching
-- ============================================================
CREATE TABLE IF NOT EXISTS furniture_request_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID,
  room_photo_id       UUID REFERENCES room_photos(id) ON DELETE SET NULL,
  requested_item_text TEXT NOT NULL,
  parsed_category     TEXT,
  parsed_colors       TEXT[],
  parsed_materials    TEXT[],
  parsed_styles       TEXT[],
  min_price           NUMERIC(10, 2),
  max_price           NUMERIC(10, 2),
  city                TEXT,
  province            TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS furniture_request_logs_user_id_idx    ON furniture_request_logs (user_id);
CREATE INDEX IF NOT EXISTS furniture_request_logs_created_at_idx ON furniture_request_logs (created_at DESC);

-- ============================================================
-- FUNCTION: match_furniture_products
-- Vector similarity search with optional filters
-- Usage: SELECT * FROM match_furniture_products(embedding, 10, 'sofa', 2000, 'ON')
-- ============================================================
CREATE OR REPLACE FUNCTION match_furniture_products(
  query_embedding  vector(1536),
  match_count      INT DEFAULT 10,
  filter_category  TEXT DEFAULT NULL,
  filter_max_price NUMERIC DEFAULT NULL,
  filter_province  TEXT DEFAULT NULL
)
RETURNS TABLE (
  id          UUID,
  title       TEXT,
  description TEXT,
  price       NUMERIC,
  currency    TEXT,
  image_url   TEXT,
  product_url TEXT,
  store_name  TEXT,
  city        TEXT,
  province    TEXT,
  similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.price,
    p.currency,
    p.image_url,
    p.product_url,
    s.name   AS store_name,
    s.city,
    s.province,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM product_embeddings pe
  JOIN products p ON p.id = pe.product_id
  LEFT JOIN stores s ON s.id = p.store_id
  WHERE
    p.is_active = TRUE
    AND (filter_category IS NULL OR p.category = filter_category)
    AND (filter_max_price IS NULL OR p.price <= filter_max_price)
    AND (filter_province IS NULL OR s.province = filter_province)
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE stores               ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_locations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_dimensions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_embeddings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_job_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_photos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE furniture_request_logs ENABLE ROW LEVEL SECURITY;

-- Public: read active stores only
CREATE POLICY "public_read_active_stores"
  ON stores FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Public: read active products only
CREATE POLICY "public_read_active_products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Public: read product dimensions for active products
CREATE POLICY "public_read_product_dimensions"
  ON product_dimensions FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_dimensions.product_id AND p.is_active = TRUE
    )
  );

-- Public: read product attributes for active products
CREATE POLICY "public_read_product_attributes"
  ON product_attributes FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_attributes.product_id AND p.is_active = TRUE
    )
  );

-- Public: read store locations for active stores
CREATE POLICY "public_read_store_locations"
  ON store_locations FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stores s
      WHERE s.id = store_locations.store_id AND s.is_active = TRUE
    )
  );

-- Public: NO access to scrape_jobs, scrape_job_items, product_embeddings
-- (service role bypasses RLS automatically)

-- Authenticated users: manage their own room photos
CREATE POLICY "users_manage_own_room_photos"
  ON room_photos FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Authenticated users: manage their own request logs
CREATE POLICY "users_manage_own_request_logs"
  ON furniture_request_logs FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role: full access to everything (bypasses RLS by default in Supabase)
-- No explicit policy needed — service_role bypasses RLS.
