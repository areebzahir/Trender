# Documentation Best Practices

**Purpose:** Create clear, useful, maintainable documentation.

---

## What to Document

### Schema
- Table purposes
- Column meanings
- Relationships
- Indexes and why they exist
- RLS policies
- Constraints

### Ingestion Flow
- High-level pipeline diagram
- Extract → Transform → Load steps
- Provider architecture
- Deduplication logic
- Error handling

### Environment Variables
- Required vs optional
- Where each is used (frontend vs backend)
- How to obtain (API keys, etc.)
- Security notes

### Setup Instructions
- How to run migrations
- How to seed mock data
- How to test search
- How to deploy Edge Functions

### Provider Integration
- How to add Apify
- How to add SerpApi
- How to add custom crawlers
- How to add CSV import

### Limitations
- What's not built yet
- Known issues
- Performance constraints
- Future improvements

### Next Steps
- What to build next
- How future features will use this foundation
- Roadmap items

---

## Documentation Structure

```
docs/
  furniture-database-ingestion.md  # Main documentation
  
  sections:
    - Overview
    - Environment Variables
    - Database Schema
    - Ingestion Flow
    - How to Add Apify
    - How to Add SerpApi
    - How to Add Custom Crawlers
    - How Deduplication Works
    - How Search Works
    - How Vector Search Works
    - How Future Room Editing Will Use This
    - What NOT to Expose to Frontend
    - How to Run Migration
    - How to Insert Mock Data
    - How to Test Product Search
    - Issues & Limitations
    - Next Steps
```

---

## Writing Style

### Be Concise
**Bad:**
```
In order to be able to run the migration, you will need to first navigate 
to the Supabase dashboard, and then you should click on the SQL Editor tab, 
and after that you can paste the SQL migration file contents into the editor.
```

**Good:**
```
To run the migration:
1. Open Supabase SQL Editor
2. Paste migration file contents
3. Click "Run"
```

### Be Practical
**Bad:**
```
The database schema follows third normal form principles and implements 
a robust relational model with proper foreign key constraints.
```

**Good:**
```
The database has 10 tables:
- `stores` — furniture retailers
- `products` — furniture catalog
- `product_dimensions` — width, height, depth
- ...
```

### Use Examples
**Bad:**
```
You can search products by various filters.
```

**Good:**
```
Search products:
```typescript
const results = await searchProducts({
  category: 'sofa',
  city: 'Toronto',
  max_price: 2000,
  styles: ['modern', 'minimalist']
});
```
```

---

## Code Examples

### Include Complete Examples
```typescript
// Bad - incomplete
const results = await searchProducts(...);

// Good - complete
import { searchProducts } from '@/services/furnitureSearchService';

const results = await searchProducts({
  category: 'sofa',
  province: 'ON',
  max_price: 2000
});

console.log(results);  // Array of ProductSearchResult
```

### Show Expected Output
```typescript
const results = await searchProducts({ category: 'sofa' });

// Returns:
// [
//   {
//     id: '123',
//     title: 'Modern Beige Sofa',
//     price: 1799.00,
//     currency: 'CAD',
//     image_url: 'https://...',
//     category: 'sofa',
//     store_name: 'Maple & Oak',
//     city: 'Toronto',
//     province: 'ON'
//   },
//   ...
// ]
```

---

## Diagrams

### Use ASCII Diagrams for Flow
```
Raw source data
      │
      ▼
Provider (apifyProvider / serpApiProvider / csvProvider)
      │  maps raw fields to intermediate shape
      ▼
normalizeProduct.ts → toNormalizedProduct()
      │  normalizes title, URL, price, colors, materials, styles
      ▼
runIngestion()
      │
      ├─ createScrapeJob()       → scrape_jobs row
      ├─ upsertStore()           → stores row (dedup by domain)
      ├─ upsertProduct()         → products row (dedup by URL/SKU)
      │    ├─ product_dimensions
      │    ├─ product_attributes
      │    └─ product_embeddings (placeholder)
      └─ completeScrapeJob()     → update job status + counts
```

### Use Tables for Comparisons
```
| Feature | Apify | SerpApi | Custom Crawler |
|---------|-------|---------|----------------|
| Setup   | Easy  | Easy    | Complex        |
| Cost    | $$    | $       | Free           |
| Quality | High  | High    | Varies         |
```

---

## Environment Variables

Document clearly:

```markdown
## Environment Variables

### Frontend (safe for browser)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend (NEVER expose to browser)
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
APIFY_API_TOKEN=your_apify_token
SERPAPI_KEY=your_serpapi_key
OPENAI_API_KEY=your_openai_key
```

### Optional (for future features)
```bash
EMBEDDING_PROVIDER=openai
EMBEDDING_DIMENSIONS=1536
```
```

---

## Step-by-Step Instructions

Number steps clearly:

```markdown
## How to Run Migration

1. Open your Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
   ```

2. Copy the entire contents of:
   ```
   supabase/migrations/20240001_furniture_catalog.sql
   ```

3. Paste into the SQL Editor

4. Click **"Run"** or press `Ctrl+Enter`

5. Wait for: **"Success. No rows returned"**

6. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
```

---

## Troubleshooting Section

Include common issues:

```markdown
## Troubleshooting

### Migration fails with "extension does not exist"
**Solution:** Run `CREATE EXTENSION IF NOT EXISTS "vector";` first.

### Search returns empty results
**Possible causes:**
1. No mock data inserted → Run seed SQL
2. RLS blocking access → Check you're using correct key
3. Filters too restrictive → Try broader search

### "Unauthorized" error on admin endpoint
**Solution:** Ensure you're using service role key, not anon key.
```

---

## API Documentation

Document endpoints clearly:

```markdown
## API Routes

### GET /api/products/search

Search active furniture products.

**Query Parameters:**
- `q` (string) — Free text search
- `category` (string) — Product category (sofa, sectional, etc.)
- `city` (string) — Store city
- `province` (string) — Store province (default: ON)
- `min_price` (number) — Minimum price
- `max_price` (number) — Maximum price
- `colors` (string) — Comma-separated colors
- `materials` (string) — Comma-separated materials
- `styles` (string) — Comma-separated styles
- `limit` (number) — Max results (default 20, max 100)
- `offset` (number) — Pagination offset

**Example:**
```bash
curl "https://your-project.supabase.co/functions/v1/search-products?category=sofa&max_price=2000"
```

**Response:**
```json
{
  "data": [
    {
      "id": "123",
      "title": "Modern Beige Sofa",
      "price": 1799.00,
      "currency": "CAD",
      "image_url": "https://...",
      "category": "sofa",
      "store_name": "Maple & Oak",
      "city": "Toronto",
      "province": "ON"
    }
  ],
  "count": 1
}
```
```

---

## Keep Docs Up-to-Date

- Update docs when code changes
- Remove outdated information
- Add new features to docs
- Keep examples working
- Test instructions periodically

---

## Don't Over-Document

**Don't document:**
- Obvious code
- Implementation details that change frequently
- Temporary workarounds
- Internal debugging notes

**Do document:**
- Public APIs
- Setup/deployment
- Architecture decisions
- Non-obvious behavior
- Security considerations

---

## Use Markdown Features

### Headers
```markdown
# Main Title
## Section
### Subsection
```

### Code Blocks
```markdown
```typescript
const example = 'code';
```
```

### Lists
```markdown
- Bullet point
- Another point

1. Numbered
2. List
```

### Links
```markdown
[Link text](https://example.com)
```

### Tables
```markdown
| Column 1 | Column 2 |
|----------|----------|
| Value 1  | Value 2  |
```

### Callouts
```markdown
**Note:** Important information

**Warning:** Be careful here

**Tip:** Helpful suggestion
```

---

## Documentation Checklist

- [ ] Overview/introduction
- [ ] Environment variables documented
- [ ] Database schema explained
- [ ] Ingestion flow documented
- [ ] Setup instructions clear
- [ ] API endpoints documented
- [ ] Code examples included
- [ ] Expected output shown
- [ ] Troubleshooting section
- [ ] Limitations noted
- [ ] Next steps outlined
- [ ] No outdated information
- [ ] No broken links
- [ ] Examples tested and working
