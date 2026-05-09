# Supabase & Postgres Best Practices

**Purpose:** Build a robust, scalable Supabase/Postgres database.

---

## Primary Keys

Always use UUID:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- ...
);
```

**Why UUID:**
- Globally unique (safe for distributed systems)
- No sequential ID leakage
- Easier to merge data from multiple sources

---

## Timestamps

Every table needs:
```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

**Use `TIMESTAMPTZ`** (timestamp with timezone), not `TIMESTAMP`.

---

## Updated_at Trigger

Create once, reuse everywhere:
```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## Indexes

### When to Index
- Foreign keys (for joins)
- Columns used in WHERE clauses frequently
- Columns used in ORDER BY
- Full-text search columns
- Array columns (use GIN)
- Vector columns (use HNSW)

### When NOT to Index
- Small tables (< 1000 rows)
- Columns rarely queried
- Columns with low cardinality (few unique values)
- Write-heavy tables where index maintenance cost > query benefit

### Index Types
```sql
-- B-tree (default, good for equality and range queries)
CREATE INDEX products_price_idx ON products (price);

-- GIN (good for arrays, JSONB, full-text search)
CREATE INDEX product_attributes_colors_idx ON product_attributes USING GIN (colors);

-- HNSW (good for vector similarity)
CREATE INDEX product_embeddings_hnsw_idx 
  ON product_embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- Full-text search
CREATE INDEX products_fts_idx ON products 
  USING GIN (to_tsvector('english', title || ' ' || description));
```

---

## JSONB for Flexibility

Use JSONB for:
- Raw source payloads (debugging, re-processing)
- Flexible metadata that varies by source
- Configuration objects

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  price NUMERIC(10, 2),
  raw_payload JSONB  -- Original data from scraper
);
```

**Don't use JSONB for:**
- Stable, queryable fields (use proper columns)
- Fields you need to index efficiently
- Fields you need foreign keys on

---

## Normalized Tables

Separate concerns into different tables:

```sql
-- Core entity
CREATE TABLE products (...);

-- Related dimensions
CREATE TABLE product_dimensions (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  width NUMERIC,
  height NUMERIC,
  ...
);

-- Related attributes
CREATE TABLE product_attributes (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  colors TEXT[],
  materials TEXT[],
  ...
);
```

**Benefits:**
- Cleaner schema
- Easier to query specific aspects
- Easier to update dimensions without touching product row
- Better for future features (e.g., dimension-based filtering)

---

## Foreign Keys

Always use foreign keys for referential integrity:

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  scrape_job_id UUID REFERENCES scrape_jobs(id) ON DELETE SET NULL
);
```

### CASCADE Rules

**ON DELETE CASCADE** — Delete child rows when parent is deleted:
```sql
product_id UUID REFERENCES products(id) ON DELETE CASCADE
```
Use for: dimensions, attributes (tightly coupled to product)

**ON DELETE SET NULL** — Set foreign key to NULL when parent is deleted:
```sql
store_id UUID REFERENCES stores(id) ON DELETE SET NULL
```
Use for: optional relationships (product can exist without store)

**ON DELETE RESTRICT** — Prevent deletion if children exist:
```sql
store_id UUID REFERENCES stores(id) ON DELETE RESTRICT
```
Use for: critical relationships (don't allow accidental deletion)

---

## Avoid Destructive Migrations

- Never `DROP TABLE` in production without backup
- Use `IF NOT EXISTS` when creating objects
- Use `IF EXISTS` when dropping objects
- Test migrations on staging first
- Keep migrations idempotent where possible

```sql
-- Safe
CREATE TABLE IF NOT EXISTS products (...);
CREATE INDEX IF NOT EXISTS products_price_idx ON products (price);

-- Dangerous
DROP TABLE products;  -- Could lose data
```

---

## Check for Existing Schema

Before creating objects, check if they exist:

```sql
-- Check if extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Check if table exists
CREATE TABLE IF NOT EXISTS products (...);

-- Check if function exists
CREATE OR REPLACE FUNCTION set_updated_at() ...
```

---

## pgvector Setup

Enable once per database:
```sql
CREATE EXTENSION IF NOT EXISTS "vector";
```

Create vector column:
```sql
CREATE TABLE product_embeddings (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  embedding vector(1536),  -- OpenAI: 1536, Gemini: 768
  ...
);
```

Create HNSW index for fast similarity search:
```sql
CREATE INDEX product_embeddings_hnsw_idx
  ON product_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

**Parameters:**
- `m` = max connections per layer (higher = better recall, more memory)
- `ef_construction` = search depth during index build (higher = better quality, slower build)

---

## Row Level Security (RLS)

Enable RLS on all public-facing tables:

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

Create policies:
```sql
-- Public can read active products only
CREATE POLICY "public_read_active_products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Public cannot write
-- (No INSERT/UPDATE/DELETE policies = blocked by default)

-- Service role bypasses RLS automatically
```

---

## Service Role Key Security

**NEVER:**
- Expose service role key in frontend code
- Commit service role key to git
- Use service role key in browser
- Prefix service role key with `VITE_` or `NEXT_PUBLIC_`

**ALWAYS:**
- Use service role key only in server-side code
- Use anon key for frontend
- Store service role key in `.env` (gitignored)
- Use environment variables, not hardcoded strings

---

## Query Builders vs Raw SQL

**Prefer Supabase client/query builders:**
```typescript
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('category', 'sofa')
  .lte('price', 2000);
```

**Use raw SQL only when necessary:**
- Complex joins
- Window functions
- CTEs (Common Table Expressions)
- Database functions
- Migrations

**If using raw SQL, use parameterized queries:**
```typescript
// Bad - SQL injection risk
const { data } = await supabase.rpc('search', { 
  query: `SELECT * FROM products WHERE title = '${userInput}'` 
});

// Good - parameterized
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('title', userInput);
```

---

## Computed Columns

Use generated columns for derived values:

```sql
CREATE TABLE stores (
  domain TEXT,
  normalized_domain TEXT GENERATED ALWAYS AS (
    LOWER(REGEXP_REPLACE(COALESCE(domain, ''), '^www\.', ''))
  ) STORED
);
```

**Benefits:**
- Always up-to-date
- Can be indexed
- No manual updates needed

---

## Check Constraints

Enforce data integrity at database level:

```sql
CREATE TABLE products (
  category TEXT NOT NULL CHECK (category IN (
    'sofa', 'sectional', 'loveseat', 'armchair', ...
  )),
  availability TEXT CHECK (availability IN (
    'in_stock', 'out_of_stock', 'limited', 'unknown'
  )),
  price NUMERIC(10, 2) CHECK (price >= 0)
);
```

---

## Unique Constraints

Prevent duplicates:

```sql
-- Unique canonical URL
CREATE UNIQUE INDEX products_canonical_url_idx
  ON products (canonical_url)
  WHERE canonical_url IS NOT NULL AND canonical_url <> '';

-- Unique store + SKU
CREATE UNIQUE INDEX products_store_sku_idx
  ON products (store_id, sku)
  WHERE store_id IS NOT NULL AND sku IS NOT NULL;
```

**Use partial indexes** (`WHERE` clause) to allow NULLs while enforcing uniqueness on non-NULL values.

---

## Array Columns

Use arrays for flexible tags:

```sql
CREATE TABLE product_attributes (
  colors TEXT[],
  materials TEXT[],
  styles TEXT[]
);

-- Query with array overlap
SELECT * FROM product_attributes
WHERE colors && ARRAY['beige', 'cream'];

-- Index for array queries
CREATE INDEX product_attributes_colors_idx 
  ON product_attributes USING GIN (colors);
```

---

## Transaction Safety

For multi-step operations, use transactions:

```typescript
const { data, error } = await supabase.rpc('upsert_product_with_relations', {
  product_data: {...},
  dimensions_data: {...},
  attributes_data: {...}
});
```

Or handle in application code with proper error handling:
```typescript
try {
  const { data: product } = await supabase.from('products').insert(...);
  await supabase.from('product_dimensions').insert({ product_id: product.id, ... });
  await supabase.from('product_attributes').insert({ product_id: product.id, ... });
} catch (err) {
  // Rollback or handle partial failure
}
```
