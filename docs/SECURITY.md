# Security Documentation

## API Key Management

### ✅ Secure Storage

All sensitive API keys are stored in the `.env` file which is:
1. **Excluded from Git** - Listed in `.gitignore`
2. **Never committed** - Verified with `git status --ignored`
3. **Backend-only** - Keys without `VITE_` prefix are never exposed to browser
4. **Environment-specific** - Different keys for dev/staging/production

### 🔐 API Keys Configuration

#### Backend-Only Keys (SECURE)
These keys are **ONLY** accessible in Netlify Functions (server-side):

```bash
# ✅ SECURE - Backend only
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
STABILITY_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**How they work:**
- Read via `process.env.GEMINI_API_KEY` in Netlify Functions
- **Never** bundled into frontend JavaScript
- **Never** visible in browser DevTools
- **Never** sent to client

**Used in:**
- `netlify/functions/analyze-room.ts` - Gemini/OpenAI room analysis
- `netlify/functions/generate-room-preview.ts` - DALL-E/Stability preview
- `netlify/functions/recommend-products.ts` - Supabase service role queries

#### Frontend Keys (EXPOSED - Use with Caution)
These keys are prefixed with `VITE_` and **ARE** exposed in the browser bundle:

```bash
# ⚠️ EXPOSED - Frontend accessible
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

**Security measures:**
- Supabase anon key is protected by Row Level Security (RLS)
- RLS policies restrict access to public read-only data
- Service role key is **NEVER** prefixed with `VITE_`

### 🚫 What NOT to Do

**NEVER do this:**
```bash
# ❌ WRONG - Exposes API key to browser
VITE_GEMINI_API_KEY=AIzaSy...
VITE_OPENAI_API_KEY=sk-...
```

**NEVER do this in code:**
```typescript
// ❌ WRONG - Hardcoded API key
const apiKey = "your-api-key-here"; // NEVER put real keys in code

// ❌ WRONG - Reading from frontend env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
```

**ALWAYS do this:**
```typescript
// ✅ CORRECT - Backend only
const apiKey = process.env.GEMINI_API_KEY;
```

### 📋 Git Protection Checklist

- [x] `.env` is in `.gitignore`
- [x] `.env` shows as "Ignored files" in `git status --ignored`
- [x] No API keys hardcoded in source files
- [x] No `VITE_` prefix on sensitive keys
- [x] `.env.example` has placeholder values only
- [x] All AI API calls go through Netlify Functions

### 🔍 Verification Commands

Check if `.env` is ignored:
```bash
git status --ignored
# Should show: .env under "Ignored files"
```

Search for hardcoded keys:
```bash
git grep "AIzaSy"
git grep "sk-proj"
git grep "sk-"
# Should return: no matches
```

Check what's tracked:
```bash
git ls-files | grep env
# Should only show: .env.example
```

### 🌐 Deployment Security

#### Netlify Environment Variables
Set these in Netlify Dashboard → Site Settings → Environment Variables:

**Required:**
- `GEMINI_API_KEY` - Google Gemini API key
- `OPENAI_API_KEY` - OpenAI API key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

**Optional:**
- `STABILITY_API_KEY` - Stability AI API key

**Important:**
- Netlify environment variables are **NOT** committed to git
- They are encrypted at rest
- They are only accessible during build and function execution
- Frontend variables (VITE_*) are bundled into the build

### 🛡️ Additional Security Measures

#### 1. Prompt Injection Protection
```typescript
// src/services/aiRoomAnalysisService.ts
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|above)\s+instructions?/gi,
  /you\s+are\s+now/gi,
  /disregard\s+(all|previous|above|the)/gi,
  // ... more patterns
];
```

#### 2. Input Validation
```typescript
// netlify/functions/analyze-room.ts
- Image size limit: 10 MB
- Prompt length: 1-500 characters
- MIME type validation: JPEG, PNG, WebP only
```

#### 3. Row Level Security (RLS)
```sql
-- Supabase RLS policies
CREATE POLICY "public_read_active_products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);
```

#### 4. Error Handling
```typescript
// Never expose internal errors
catch (err) {
  console.error('[analyze-room] Error:', err);
  return { error: 'Something went wrong. Please try again.' };
}
```

### 📊 Security Audit Log

| Date | Action | Status |
|------|--------|--------|
| 2026-05-09 | Added Gemini API key to .env | ✅ Secure |
| 2026-05-09 | Verified .gitignore excludes .env | ✅ Protected |
| 2026-05-09 | Removed VITE_ prefix from sensitive keys | ✅ Fixed |
| 2026-05-09 | Verified no hardcoded keys in codebase | ✅ Clean |
| 2026-05-09 | Updated .env.example with security notes | ✅ Documented |

### 🚨 Incident Response

If an API key is accidentally committed:

1. **Immediately revoke the key** in the provider's dashboard
2. **Generate a new key**
3. **Update .env and Netlify environment variables**
4. **Remove from git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```
5. **Force push** (if necessary and safe)
6. **Notify team members**

### 📞 Support

For security concerns:
1. Check this documentation
2. Review `.env.example` for correct format
3. Verify `.gitignore` includes `.env`
4. Test with `git status --ignored`

---

**Last Updated**: May 9, 2026
**Security Level**: ✅ Production Ready
**API Keys**: ✅ Secured
**Git Protection**: ✅ Verified
