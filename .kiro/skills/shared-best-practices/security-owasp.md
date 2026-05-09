# Security & OWASP Best Practices

**Purpose:** Build secure systems that protect user data and prevent common vulnerabilities.

---

## Never Leak Secrets

### What Are Secrets?
- API keys (Apify, SerpApi, OpenAI, Gemini)
- Service role keys (Supabase)
- Database URLs and passwords
- Authentication tokens
- Encryption keys
- OAuth client secrets

### Rules
1. **Never commit secrets to git**
   - Use `.env` files (gitignored)
   - Use environment variables
   - Use secret management services (AWS Secrets Manager, etc.)

2. **Never log secrets**
   ```typescript
   // Bad
   console.log('API Key:', process.env.OPENAI_API_KEY);
   
   // Good
   console.log('API Key:', process.env.OPENAI_API_KEY ? '[REDACTED]' : 'missing');
   ```

3. **Never expose secrets in frontend**
   ```typescript
   // Bad - exposed to browser
   const VITE_SERVICE_ROLE_KEY = "sb_secret_...";
   
   // Good - server-side only
   const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
   ```

4. **Never include secrets in error messages**
   ```typescript
   // Bad
   throw new Error(`Failed to connect with key: ${apiKey}`);
   
   // Good
   throw new Error('Failed to connect to API');
   ```

---

## Input Validation & Sanitization

### Validate All External Input

**Sources of untrusted input:**
- API request bodies
- Query parameters
- URL path parameters
- Scraper/provider data
- CSV uploads
- User-uploaded files

**Validation pattern:**
```typescript
function validateProductInput(raw: unknown): ProductInput | null {
  // Type check
  if (!raw || typeof raw !== 'object') return null;
  
  const obj = raw as Record<string, unknown>;
  
  // Required fields
  if (!obj.title || typeof obj.title !== 'string') return null;
  if (!obj.product_url || typeof obj.product_url !== 'string') return null;
  
  // Sanitize strings
  const title = obj.title.trim().substring(0, 500);  // Max length
  const url = obj.product_url.trim();
  
  // Validate URL format
  try {
    new URL(url);
  } catch {
    return null;  // Invalid URL
  }
  
  return { title, product_url: url, ... };
}
```

### Sanitize HTML/User Content

If displaying user-generated content:
```typescript
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(userInput);
```

---

## SQL Injection Prevention

### Use Query Builders
```typescript
// Safe - parameterized
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('category', userInput);  // Automatically escaped
```

### Never Concatenate User Input into SQL
```typescript
// DANGEROUS - SQL injection
const query = `SELECT * FROM products WHERE title = '${userInput}'`;

// Safe - parameterized
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('title', userInput);
```

---

## Authentication & Authorization

### Protect Admin Routes

```typescript
// Check authorization header
const authHeader = req.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '').trim();

if (!token || token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Use RLS for Data Access Control

```sql
-- Public can only read active products
CREATE POLICY "public_read_active_products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Public cannot write
-- (No INSERT/UPDATE/DELETE policies = blocked)
```

---

## Rate Limiting

Prevent abuse of admin/ingestion endpoints:

```typescript
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);
  
  if (!record || now > record.resetAt) {
    requestCounts.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;  // Rate limit exceeded
  }
  
  record.count++;
  return true;
}

// Usage
const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
if (!checkRateLimit(ip)) {
  return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

---

## Don't Trust Scraper Data

Scraper/provider data is untrusted:

```typescript
// Bad - trusting raw data
const product = {
  title: scraperData.title,  // Could be malicious
  price: scraperData.price,  // Could be invalid
};

// Good - validate and sanitize
const product = {
  title: validateString(scraperData.title, 500),
  price: parsePrice(scraperData.price),  // Returns number | null
};
```

---

## Prevent XSS (Cross-Site Scripting)

### Escape Output
```typescript
// In React, JSX automatically escapes
<div>{product.title}</div>  // Safe

// If using dangerouslySetInnerHTML, sanitize first
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
```

### Content Security Policy
```typescript
// In API responses or HTML headers
headers: {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'",
}
```

---

## Secure File Uploads

If accepting CSV/file uploads:

```typescript
// Validate file type
const allowedTypes = ['text/csv', 'application/csv'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type');
}

// Validate file size
const maxSize = 10 * 1024 * 1024;  // 10MB
if (file.size > maxSize) {
  throw new Error('File too large');
}

// Scan content
const content = await file.text();
if (content.includes('<script>')) {
  throw new Error('Invalid file content');
}
```

---

## Scraping Compliance

### Respect Website Terms
- Read and follow `robots.txt`
- Respect rate limits
- Don't bypass CAPTCHAs or login walls
- Don't scrape sites that explicitly prohibit it

### Don't Collect PII
- Avoid scraping personal data
- Don't store user emails, phone numbers, addresses unless necessary
- Follow GDPR/privacy regulations

### Use Ethical Scraping
- Prefer official APIs over scraping
- Use Apify/SerpApi which handle compliance
- Add delays between requests
- Identify your bot with User-Agent

```typescript
// Good User-Agent
headers: {
  'User-Agent': 'TrenderBot/1.0 (furniture catalog; contact@trender.com)'
}
```

---

## Error Handling Without Information Leakage

```typescript
try {
  await processProduct(product);
} catch (err) {
  // Log full error server-side
  console.error('Product processing failed:', {
    productId: product.id,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined
  });
  
  // Return generic error to client
  return Response.json(
    { error: 'Failed to process product' },
    { status: 500 }
  );
}
```

---

## Secure Environment Variables

### Naming Convention
```bash
# Frontend (safe to expose)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Backend (NEVER expose)
SUPABASE_SERVICE_ROLE_KEY=...
APIFY_API_TOKEN=...
SERPAPI_KEY=...
OPENAI_API_KEY=...
```

### Loading
```typescript
// Frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// Backend
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate
if (!serviceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}
```

---

## HTTPS Only

- Always use HTTPS in production
- Never send secrets over HTTP
- Use secure cookies (`Secure`, `HttpOnly`, `SameSite`)

---

## Dependency Security

```bash
# Check for vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Update dependencies regularly
npm update
```

---

## Logging Best Practices

### What to Log
- Operation start/end
- Success/failure status
- Error messages (sanitized)
- Performance metrics
- User actions (anonymized)

### What NOT to Log
- Passwords
- API keys
- Service role keys
- Credit card numbers
- Personal identifiable information (PII)
- Full request/response bodies with secrets

```typescript
// Bad
console.log('Request:', JSON.stringify(req));  // May contain secrets

// Good
console.log('Request:', {
  method: req.method,
  url: req.url,
  headers: {
    'content-type': req.headers.get('content-type'),
    // Don't log Authorization header
  }
});
```

---

## Security Checklist

- [ ] No secrets in git
- [ ] No secrets in logs
- [ ] No secrets in error messages
- [ ] No secrets in frontend code
- [ ] All external input validated
- [ ] SQL injection prevented (use query builders)
- [ ] XSS prevented (escape output)
- [ ] Admin routes protected
- [ ] RLS enabled on public tables
- [ ] Rate limiting on sensitive endpoints
- [ ] HTTPS in production
- [ ] Dependencies up-to-date
- [ ] Error messages don't leak sensitive info
