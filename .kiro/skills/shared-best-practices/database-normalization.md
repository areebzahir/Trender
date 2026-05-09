# Database Normalization Best Practices

**Purpose:** Design clean, maintainable, scalable database schemas.

---

## Separate Stable Entities

Don't put everything in one table:

**Bad:**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  title TEXT,
  price NUMERIC,
  store_name TEXT,
  store_city TEXT,
  store_province TEXT,
  width NUMERIC,
  height NUMERIC,
  depth NUMERIC,
  colors TEXT,
  materials TEXT,
  styles TEXT
);
```

**Good:**
```sql
-- Core entities
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  name TEXT,
  city TEXT,
  province TEXT
);

CREATE TABLE products (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  title TEXT,
  price NUMERIC
);

-- Related data
CREATE TABLE product_dimensions (
  product_id UUID REFERENCES products(id),
  width NUMERIC,
  height NUMERIC,
  depth NUMERIC
);

CREATE TABLE product_attributes (
  product_id UUID REFERENCES products(id),
  colors TEXT[],
  materials TEXT[],
  styles TEXT[]
);
```

**Benefits:**
- Easier to query specific aspects
- Easier to update dimensions without touching product
- Cleaner schema
- Better for future features

---

## When to Use Arrays

Arrays are good for:
- Flexible tags (colors, materials, styles)
- Multiple values that don't need their own table
- Values that are queried together

```sql
CREATE TABLE product_attributes (
  product_id UUID,
  colors TEXT[],      -- ['beige', 'cream', 'white']
  materials TEXT[],   -- ['wood', 'fabric', 'metal']
  styles TEXT[]       -- ['modern', 'minimalist']
);

-- Query with array overlap
SELECT * FROM product_attributes
WHERE colors && ARRAY['beige', 'cream'];
```

**When NOT to use arrays:**
- When you need foreign keys
- When you need to join to another table
- When values have their own attributes

---

## When to Use JSONB

JSONB is good for:
- Raw source payloads (debugging, re-processing)
- Flexible metadata that varies by source
- Configuration objects
- Data that doesn't need to be queried frequently

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  price NUMERIC,
  raw_payload JSONB  -- Original scraper data
);
```

**When NOT to use JSONB:**
- Stable, queryable fields (use proper columns)
- Fields you need to index efficiently
- Fields you need foreign keys on
- Fields you query frequently

---

## Canonical Fields for Deduplication

Add normalized fields for deduplication:

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  normalized_title TEXT,  -- Lowercase, no punctuation
  product_url TEXT,
  canonical_url TEXT,     -- Normalized URL (no tracking params)
  sku TEXT,
  store_id UUID
);

-- Unique indexes for deduplication
CREATE UNIQUE INDEX products_canonical_url_idx
  ON products (canonical_url)
  WHERE canonical_url IS NOT NULL;

CREATE UNIQUE INDEX products_store_sku_idx
  ON products (store_id, sku)
  WHERE store_id IS NOT NULL AND sku IS NOT NULL;
```

---

## Separate Concerns

### Stores vs Store Locations

```sql
-- Store entity (brand/company)
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  name TEXT,
  website TEXT,
  domain TEXT,
  store_type TEXT
);

-- Physical locations (multiple per store)
CREATE TABLE store_locations (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  label TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  latitude NUMERIC,
  longitude NUMERIC
);
```

**Why separate:**
- One store (e.g., "IKEA") can have many locations
- Store-level data (website, domain) doesn't repeat
- Location-level data (address, lat/lng) is specific

### Products vs Dimensions vs Attributes

```sql
-- Core product
CREATE TABLE products (
  id UUID PRIMARY KEY,
  store_id UUID,
  title TEXT,
  price NUMERIC,
  category TEXT
);

-- Physical dimensions
CREATE TABLE product_dimensions (
  product_id UUID REFERENCES products(id),
  width NUMERIC,
  height NUMERIC,
  depth NUMERIC,
  unit TEXT
);

-- Style attributes
CREATE TABLE product_attributes (
  product_id UUID REFERENCES products(id),
  colors TEXT[],
  materials TEXT[],
  styles TEXT[]
);
```

**Why separate:**
- Not all products have dimensions
- Dimensions can be updated independently
- Attributes can be updated independently
- Cleaner queries (select only what you need)

---

## Scrape Jobs vs Products

```sql
-- Job tracking
CREATE TABLE scrape_jobs (
  id UUID PRIMARY KEY,
  source_type TEXT,
  status TEXT,
  total_found INT,
  total_inserted INT,
  total_updated INT,
  total_failed INT
);

-- Products reference jobs
CREATE TABLE products (
  id UUID PRIMARY KEY,
  scrape_job_id UUID REFERENCES scrape_jobs(id),
  -- ... product fields
);
```

**Why separate:**
- Jobs track operational metadata
- Products are business entities
- Jobs can be deleted without deleting products
- Easy to query "which products came from this job"

---

## Embeddings Separation

```sql
-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  -- ... other fields
);

-- Embeddings (large vectors)
CREATE TABLE product_embeddings (
  product_id UUID REFERENCES products(id),
  source_text TEXT,
  embedding vector(1536),
  model TEXT
);
```

**Why separate:**
- Embeddings are large (6KB+ per row)
- Not all products have embeddings
- Embeddings can be regenerated
- Easier to query products without loading embeddings

---

## Avoid Duplicate Rows

Use unique constraints:

```sql
-- Prevent duplicate products by URL
CREATE UNIQUE INDEX products_canonical_url_idx
  ON products (canonical_url)
  WHERE canonical_url IS NOT NULL;

-- Prevent duplicate store + SKU
CREATE UNIQUE INDEX products_store_sku_idx
  ON products (store_id, sku)
  WHERE store_id IS NOT NULL AND sku IS NOT NULL;

-- Prevent duplicate stores by domain
CREATE UNIQUE INDEX stores_normalized_domain_idx
  ON stores (normalized_domain)
  WHERE normalized_domain IS NOT NULL;
```

---

## Consistent Normalization

Keep normalization logic consistent:

```typescript
// Color normalization
const COLOR_MAP = {
  'gray': 'grey',
  'charcoal': 'grey',
  'off-white': 'cream',
  'ivory': 'cream'
};

// Material normalization
const MATERIAL_MAP = {
  'solid wood': 'wood',
  'faux leather': 'faux_leather',
  'stainless steel': 'metal'
};

// Style normalization
const STYLE_MAP = {
  'mid-century': 'mid_century',
  'scandi': 'scandinavian',
  'boho': 'bohemian'
};
```

**Store normalized values in database:**
```sql
INSERT INTO product_attributes (colors, materials, styles)
VALUES (
  ARRAY['grey', 'cream'],  -- Not 'gray', 'off-white'
  ARRAY['wood', 'faux_leather'],  -- Not 'solid wood', 'faux leather'
  ARRAY['mid_century', 'scandinavian']  -- Not 'mid-century', 'scandi'
);
```

---

## Support Future Features

Design for future room mockup feature:

```sql
-- Room photos (future)
CREATE TABLE room_photos (
  id UUID PRIMARY KEY,
  user_id UUID,
  image_url TEXT,
  room_type TEXT,
  detected_style TEXT[],
  detected_colors TEXT[]
);

-- User requests (future)
CREATE TABLE furniture_request_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  room_photo_id UUID REFERENCES room_photos(id),
  requested_item_text TEXT,
  parsed_category TEXT,
  parsed_colors TEXT[],
  parsed_styles TEXT[],
  min_price NUMERIC,
  max_price NUMERIC
);
```

**Why include now:**
- Schema is ready when feature is built
- No migration needed later
- Shows intent/roadmap

---

## Denormalization When Appropriate

Sometimes denormalization is OK:

```sql
-- Store city/province on product for faster queries
CREATE TABLE products (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  store_city TEXT,      -- Denormalized from stores
  store_province TEXT   -- Denormalized from stores
);
```

**When to denormalize:**
- Frequently queried together
- Rarely changes
- Significant performance benefit
- Acceptable data duplication

**When NOT to denormalize:**
- Data changes frequently
- Increases complexity significantly
- No measurable performance benefit

---

## Normalization Levels

### 1NF (First Normal Form)
- No repeating groups
- Atomic values

**Bad:**
```sql
colors TEXT  -- 'red, blue, green'
```

**Good:**
```sql
colors TEXT[]  -- ARRAY['red', 'blue', 'green']
```

### 2NF (Second Normal Form)
- 1NF + No partial dependencies

**Bad:**
```sql
CREATE TABLE order_items (
  order_id UUID,
  product_id UUID,
  product_name TEXT,  -- Depends only on product_id, not (order_id, product_id)
  quantity INT
);
```

**Good:**
```sql
CREATE TABLE order_items (
  order_id UUID,
  product_id UUID REFERENCES products(id),  -- product_name comes from products table
  quantity INT
);
```

### 3NF (Third Normal Form)
- 2NF + No transitive dependencies

**Bad:**
```sql
CREATE TABLE products (
  id UUID,
  store_id UUID,
  store_name TEXT,  -- Depends on store_id, not directly on product id
  store_city TEXT
);
```

**Good:**
```sql
CREATE TABLE products (
  id UUID,
  store_id UUID REFERENCES stores(id)  -- store_name comes from stores table
);
```

---

## Practical Balance

Don't over-normalize:

**Too normalized:**
```sql
CREATE TABLE colors (id UUID, name TEXT);
CREATE TABLE product_colors (product_id UUID, color_id UUID);
```

**Practical:**
```sql
CREATE TABLE product_attributes (
  product_id UUID,
  colors TEXT[]  -- Simple array is fine for tags
);
```

**Rule of thumb:**
- Normalize entities (stores, products, users)
- Use arrays for simple tags
- Use JSONB for flexible metadata
- Denormalize for performance when needed
