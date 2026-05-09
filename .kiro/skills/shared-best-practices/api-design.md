# API Design Best Practices

**Purpose:** Build clean, secure, consistent APIs.

---

## REST-Style Routes

Use clear, predictable URL patterns:

```
GET  /api/products/search      # Search products
GET  /api/stores/search        # Search stores
POST /api/admin/ingestion      # Admin-only ingestion
GET  /api/products/:id         # Get single product
```

**Conventions:**
- Use plural nouns (`/products`, not `/product`)
- Use query params for filters (`?category=sofa&max_price=2000`)
- Use path params for IDs (`/products/123`)
- Use POST for mutations
- Use GET for reads

---

## Query Parameter Validation

Always validate and sanitize query params:

```typescript
// Bad - no validation
const category = req.query.category;
const price = req.query.max_price;

// Good - validated
const category = req.query.category?.toString() ?? '';
const maxPrice = req.query.max_price 
  ? parseFloat(req.query.max_price.toString())
  : null;

if (maxPrice !== null && (isNaN(maxPrice) || maxPrice < 0)) {
  return Response.json({ error: 'Invalid max_price' }, { status: 400 });
}
```

---

## Pagination & Limits

Always provide defaults and maximums:

```typescript
const limit = Math.min(
  parseInt(req.query.limit?.toString() ?? '20'),
  100  // Maximum
);
const offset = parseInt(req.query.offset?.toString() ?? '0');

const { data } = await supabase
  .from('products')
  .select('*')
  .range(offset, offset + limit - 1);
```

**Return pagination metadata:**
```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150
  }
}
```

---

## Never Return Raw Private Data

**Bad:**
```typescript
// Exposes scrape job internals, raw payloads, internal IDs
return Response.json(await supabase.from('products').select('*'));
```

**Good:**
```typescript
// Clean, public-safe response
const { data } = await supabase
  .from('products')
  .select('id, title, price, currency, image_url, category');

return Response.json({
  data: data.map(p => ({
    id: p.id,
    title: p.title,
    price: p.price,
    currency: p.currency,
    image_url: p.image_url,
    category: p.category
  }))
});
```

**Never expose:**
- `raw_payload`
- `scrape_job_id`
- `source_platform` (unless intentional)
- `normalized_title` (internal dedup field)
- `canonical_url` (internal dedup field)
- Internal error messages with stack traces

---

## Consistent JSON Response Shape

Use a consistent structure:

**Success:**
```json
{
  "data": [...],
  "count": 10
}
```

**Error:**
```json
{
  "error": "Invalid category parameter"
}
```

**With metadata:**
```json
{
  "data": [...],
  "count": 10,
  "pagination": { "limit": 20, "offset": 0 }
}
```

---

## Error Messages

Provide useful but not sensitive errors:

**Bad:**
```json
{
  "error": "Error: column 'scrape_job_id' does not exist at line 42 in upsertProduct.ts"
}
```

**Good:**
```json
{
  "error": "Failed to process product data"
}
```

**Better (for development):**
```json
{
  "error": "Failed to process product data",
  "details": process.env.NODE_ENV === 'development' ? err.message : undefined
}
```

---

## Server-Side vs Client-Side

### Admin Routes (Server-Side Only)
```typescript
// POST /api/admin/ingestion
// Requires service role key in Authorization header

const authHeader = req.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');

if (token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

// Use service role client
const supabase = createClient(url, serviceRoleKey);
```

### Public Routes (Client-Side Safe)
```typescript
// GET /api/products/search
// Uses anon key, RLS enforced

const supabase = createClient(url, anonKey);

const { data } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true);  // RLS also enforces this
```

---

## Rate Limiting

For admin/ingestion endpoints, consider rate limiting:

```typescript
// Simple in-memory rate limiter (production: use Redis)
const rateLimits = new Map<string, number>();

function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const key = `${ip}:${Math.floor(now / windowMs)}`;
  const count = rateLimits.get(key) ?? 0;
  
  if (count >= maxRequests) return false;
  
  rateLimits.set(key, count + 1);
  return true;
}
```

---

## CORS Headers

For Edge Functions, include CORS headers:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle preflight
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}

// Include in response
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  status: 200
});
```

---

## Input Validation

Validate request body:

```typescript
async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  
  if (!Array.isArray(body.products)) {
    return Response.json({ error: 'products must be an array' }, { status: 400 });
  }
  
  if (body.products.length === 0) {
    return Response.json({ error: 'products array cannot be empty' }, { status: 400 });
  }
  
  // Process...
}
```

---

## Response Status Codes

Use appropriate HTTP status codes:

- `200 OK` — Successful GET/POST
- `201 Created` — Resource created
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Missing/invalid auth
- `403 Forbidden` — Authenticated but not allowed
- `404 Not Found` — Resource doesn't exist
- `500 Internal Server Error` — Server error

```typescript
// Success
return Response.json({ data }, { status: 200 });

// Created
return Response.json({ id: newProduct.id }, { status: 201 });

// Bad request
return Response.json({ error: 'Invalid category' }, { status: 400 });

// Unauthorized
return Response.json({ error: 'Unauthorized' }, { status: 401 });

// Server error
return Response.json({ error: 'Internal server error' }, { status: 500 });
```

---

## Keep Response Shape Stable

Don't change response structure in breaking ways:

**Bad:**
```typescript
// Version 1
return { products: [...] };

// Version 2 (breaking change)
return { data: [...] };
```

**Good:**
```typescript
// Version 1
return { data: [...] };

// Version 2 (additive, non-breaking)
return { data: [...], metadata: {...} };
```

---

## Documentation

Document API routes clearly:

```typescript
/**
 * GET /api/products/search
 * 
 * Search active furniture products.
 * 
 * Query params:
 *   q          - Free text search
 *   category   - Product category (sofa, sectional, etc.)
 *   city       - Store city
 *   province   - Store province (default: ON)
 *   min_price  - Minimum price
 *   max_price  - Maximum price
 *   colors     - Comma-separated colors
 *   materials  - Comma-separated materials
 *   styles     - Comma-separated styles
 *   limit      - Max results (default 20, max 100)
 *   offset     - Pagination offset
 * 
 * Returns:
 *   {
 *     data: ProductSearchResult[],
 *     count: number
 *   }
 */
```
