# Clean Architecture Principles

**Purpose:** Maintain clear separation of concerns and modular design.

---

## Separation of Concerns

### Database Logic ≠ API Routes
- Database operations belong in service files (`upsertProduct.ts`, `upsertStore.ts`)
- API routes should call service functions, not contain SQL or business logic
- Keep database schema knowledge isolated to database service files

### Normalization ≠ Provider Logic
- Normalization utilities (`normalizeProduct.ts`) are generic and reusable
- Provider adapters (`apifyProvider.ts`, `serpApiShoppingProvider.ts`) map source-specific formats
- Providers call normalization utilities, not the other way around

### Orchestration ≠ Source-Specific Logic
- `runIngestion.ts` orchestrates the pipeline (create job, upsert, track status)
- Providers handle source-specific data extraction
- Orchestration should work with any provider

### Frontend ≠ Backend
- Frontend uses `src/lib/supabaseClient.ts` (anon key only)
- Backend/ingestion uses `src/lib/ingestion/supabaseAdmin.ts` (service role key)
- Never import backend ingestion code into frontend components
- Never expose service role key to browser

---

## Dependency Direction

```
Frontend Components
    ↓
Frontend Services (furnitureSearchService.ts)
    ↓
Supabase Client (anon key)

Backend Ingestion Scripts
    ↓
Ingestion Orchestrator (runIngestion.ts)
    ↓
Providers (apifyProvider, serpApiProvider, csvProvider)
    ↓
Normalization (normalizeProduct.ts)
    ↓
Upsert Services (upsertProduct, upsertStore)
    ↓
Supabase Admin (service role key)
```

**Rule:** Dependencies flow downward. Lower layers never import from higher layers.

---

## Explicit Dependencies

- Import what you need explicitly
- Do not rely on global state
- Pass dependencies as function parameters where appropriate
- Make it clear what each module depends on

---

## Future Flexibility

### Easy Provider Replacement
- Adding a new scraper source should only require:
  1. Create new provider file
  2. Map raw data to `NormalizedFurnitureProduct`
  3. Call `runIngestion()`
- No changes to database schema
- No changes to orchestration logic
- No changes to normalization utilities

### Example: Adding a New Provider
```typescript
// src/lib/ingestion/providers/wayfairProvider.ts
import { toNormalizedProduct } from '../normalizeProduct';

export function wayfairItemToNormalized(item: WayfairItem) {
  return toNormalizedProduct({
    title: item.productName,
    product_url: item.url,
    price: item.price,
    // ... map Wayfair fields
    source_platform: 'custom_crawler',
    store: { name: 'Wayfair', ... },
    raw_payload: item
  });
}
```

Then use it:
```typescript
import { wayfairItemToNormalized } from './providers/wayfairProvider';
const products = wayfairResults.map(wayfairItemToNormalized);
await runIngestion({ products, source_type: 'custom_crawler' });
```

---

## Avoid Circular Imports

- If A imports B, B should not import A
- Use shared types file to break circular dependencies
- Extract common interfaces to `types.ts`

---

## Avoid God Files

- No single file should exceed 500 lines
- Split large files by responsibility
- One file = one clear purpose
- Example: Don't put all providers in one file

---

## API Route Design

API routes should be thin wrappers:

**Bad:**
```typescript
// API route contains business logic
export async function POST(req) {
  const body = await req.json();
  // 100 lines of validation, normalization, database logic here
}
```

**Good:**
```typescript
// API route delegates to service
export async function POST(req) {
  const body = await req.json();
  const result = await runIngestion(body);
  return Response.json(result);
}
```

---

## Testability

- Pure functions are easier to test
- Keep side effects (DB writes, API calls) isolated
- Make it easy to mock dependencies
- Small focused functions are easier to verify

---

## File Organization

```
src/
  lib/
    supabaseClient.ts          # Frontend client (anon key)
    ingestion/
      supabaseAdmin.ts         # Backend client (service role)
      types.ts                 # Shared interfaces
      normalizeProduct.ts      # Generic normalization
      upsertStore.ts           # Store upsert logic
      upsertProduct.ts         # Product upsert logic
      createScrapeJob.ts       # Job tracking
      runIngestion.ts          # Orchestrator
      providers/
        apifyProvider.ts       # Apify-specific
        serpApiShoppingProvider.ts  # SerpApi-specific
        csvImportProvider.ts   # CSV-specific
  services/
    furnitureSearchService.ts  # Frontend search service
```

**Rule:** Related files are grouped together. Unrelated concerns are separated.
