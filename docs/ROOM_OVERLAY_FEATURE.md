# Room Overlay Feature - Complete Documentation

## Overview

The Room Overlay Feature is Trender's core AI-powered functionality that allows users to:
1. Upload a photo of their room
2. Describe what they want (e.g., "Add a modern cozy sofa")
3. Get AI-powered room analysis
4. Receive personalized furniture recommendations from **367 real products across 28 Canadian stores**
5. See a visual preview of their transformed room

## Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS + Framer Motion
- **Backend**: Netlify Functions (serverless)
- **Database**: Supabase PostgreSQL (367 products from 28 stores)
- **AI Services**: 
  - Gemini 1.5 Flash (room analysis)
  - OpenAI GPT-4o (fallback for room analysis)
  - OpenAI DALL-E 3 (room preview generation)
  - Stability AI (fallback for preview generation)

### Data Flow

```
User uploads room photo + prompt
         ↓
RoomUploadPage component
         ↓
1. POST /api/analyze-room
   - Gemini analyzes room image
   - Returns RoomAnalysis (colors, style, categories, etc.)
         ↓
2. POST /api/recommend-products
   - Queries Supabase for 500 active products
   - Runs AI matching algorithm
   - Returns top 20 matched products
         ↓
3. POST /api/generate-room-preview (non-blocking)
   - DALL-E 3 generates styled room mockup
   - Returns preview URL (or fallback)
         ↓
4. POST /api/save-design (non-blocking)
   - Saves session to storage
   - Returns session ID
         ↓
AIResultsPage displays:
   - Before/After preview
   - Room analysis summary
   - Color palette
   - Recommended products with buy links
```

## File Structure

### Frontend Components
```
src/components/
├── RoomUploadPage.tsx          # Main upload interface
├── AIResultsPage.tsx            # Results display page
├── BeforeAfterPreview.tsx       # Before/after image comparison
├── ColorPalette.tsx             # Color palette visualization
└── ProductCard.tsx              # Individual product display
```

### Backend Services
```
src/services/
├── aiRoomAnalysisService.ts           # Gemini/OpenAI room analysis
├── productRecommendationService.ts    # AI matching algorithm
├── roomPreviewGenerationService.ts    # DALL-E/Stability preview generation
└── storageService.ts                  # Session persistence
```

### Netlify Functions (API Endpoints)
```
netlify/functions/
├── analyze-room.ts              # POST /api/analyze-room
├── recommend-products.ts        # POST /api/recommend-products
├── generate-room-preview.ts     # POST /api/generate-room-preview
└── save-design.ts               # POST /api/save-design
```

### Type Definitions
```
src/types/
├── roomAnalysis.ts              # RoomAnalysis interface
├── product.ts                   # Product interface
├── api.ts                       # API request/response types
└── designSession.ts             # Session storage types
```

## Database Schema

### Products Table
```sql
products (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10, 2),
  currency TEXT DEFAULT 'CAD',
  image_url TEXT,
  product_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  ...
)
```

### Product Attributes Table
```sql
product_attributes (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  colors TEXT[],           -- e.g., ['beige', 'cream', 'warm']
  materials TEXT[],        -- e.g., ['velvet', 'wood', 'metal']
  styles TEXT[],           -- e.g., ['modern', 'scandinavian']
  room_types TEXT[],       -- e.g., ['living room', 'bedroom']
  ...
)
```

### Stores Table
```sql
stores (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  city TEXT,
  province TEXT DEFAULT 'ON',
  country TEXT DEFAULT 'CA',
  ...
)
```

## AI Matching Algorithm

The product recommendation service uses a **multi-dimensional scoring system**:

### Scoring Weights
1. **Category Match** (3 points) - Highest priority
   - Matches `analysis.recommendedCategories` with `product.category`
   
2. **Color Match** (1 point each, max 3)
   - Matches `analysis.recommendedPalette` with `product.colorTags`
   
3. **Style Match** (1 point each, max 3)
   - Matches `analysis.currentStyle` + `analysis.designGoal` with `product.styleTags`
   
4. **Room Match** (2 points)
   - Matches `analysis.roomType` with `product.roomTags`
   
5. **Material Match** (1 point each, max 2)
   - Matches `analysis.reasoning` with `product.materialTags`

### Filtering Strategy
1. **Full Match**: All 4 dimensions (category + color + style + room) + budget
2. **Partial Match**: Category + budget (if full match returns 0 results)
3. **Last Resort**: Budget only (return something rather than nothing)

### Budget Extraction
Automatically extracts budget from prompts like:
- "under $800"
- "less than $1000"
- "budget of $500"
- "max $2000"

## API Endpoints

### POST /api/analyze-room

**Request:**
```json
{
  "imageBase64": "base64_encoded_image_string",
  "prompt": "Make this room look modern and cozy"
}
```

**Response:**
```json
{
  "analysis": {
    "roomType": "living room",
    "currentStyle": "minimal",
    "detectedColors": ["white", "grey", "beige"],
    "recommendedPalette": ["warm beige", "cream", "terracotta"],
    "designGoal": "modern cozy aesthetic",
    "missingItems": ["sofa", "coffee table", "rug"],
    "recommendedCategories": ["sofa", "coffee_table", "rug"],
    "reasoning": "The room has good natural light..."
  }
}
```

### POST /api/recommend-products

**Request:**
```json
{
  "analysis": { /* RoomAnalysis object */ }
}
```

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Lenae Velvet Modular Sofa",
      "storeName": "Article",
      "category": "sofa",
      "price": 2299,
      "currency": "CAD",
      "productUrl": "https://...",
      "imageUrl": "https://...",
      "colorTags": ["red", "burgundy"],
      "styleTags": ["modern", "scandinavian"],
      "materialTags": ["velvet", "wood"],
      "roomTags": ["living room"],
      "inStock": true
    }
  ]
}
```

### POST /api/generate-room-preview

**Request:**
```json
{
  "imageBase64": "base64_encoded_image_string",
  "productImageUrls": ["url1", "url2", "url3"],
  "prompt": "Make this room look modern and cozy"
}
```

**Response:**
```json
{
  "previewUrl": "https://...",
  "isFallback": true
}
```

### POST /api/save-design

**Request:**
```json
{
  "imageUrl": "data:image/jpeg;base64,...",
  "analysis": { /* RoomAnalysis object */ },
  "selectedProductIds": ["uuid1", "uuid2"],
  "previewImageUrl": "https://..."
}
```

**Response:**
```json
{
  "id": "session-uuid",
  "createdAt": "2026-05-09T12:00:00Z"
}
```

## Security Features

### Input Validation
- **Image size limit**: 10 MB
- **Prompt length**: 1-500 characters
- **Prompt injection protection**: Strips known attack patterns
- **MIME type validation**: Only JPEG, PNG, WebP

### API Key Security
- All AI API keys stored in Netlify environment variables
- Service role key never exposed to frontend
- RLS (Row Level Security) enabled on all Supabase tables

### Error Handling
- Never exposes stack traces to users
- Graceful fallbacks for all AI services
- Non-blocking preview generation (failure doesn't break flow)

## Environment Variables

### Required for Production
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services (at least one required)
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key

# Optional (for preview generation)
STABILITY_API_KEY=your_stability_key
```

### Optional
```bash
STORAGE_PROVIDER=local  # or 's3', 'cloudinary'
NODE_ENV=production
```

## Current Database Status

### Products
- **Total Products**: 367
- **Active Products**: 367
- **Stores**: 28 Canadian furniture retailers

### Store Coverage
- IKEA Canada
- Wayfair Canada
- The Brick
- Leon's Furniture
- Structube
- Article
- EQ3
- Urban Barn
- West Elm
- CB2
- Crate & Barrel
- Pottery Barn
- Restoration Hardware
- HomeSense
- Jysk
- Ashley Furniture
- La-Z-Boy
- Mobilia
- Bouclair
- Lowe's Canada
- Home Depot Canada
- Canadian Tire
- Costco Canada
- Walmart Canada
- Amazon.ca
- Wayfair.ca
- Overstock.ca
- AllModern

### Product Categories
- Sofas & Sectionals
- Chairs & Seating
- Tables (Coffee, Dining, Side)
- Storage & Shelving
- Lighting
- Rugs & Textiles
- Decor & Accessories
- Beds & Mattresses

## Testing

### Manual Testing Checklist
1. ✅ Upload valid room image (JPEG, PNG, WebP)
2. ✅ Upload oversized image (>10 MB) - should reject
3. ✅ Submit empty prompt - should reject
4. ✅ Submit prompt with budget constraint - should filter results
5. ✅ Verify AI analysis returns valid JSON
6. ✅ Verify products are fetched from Supabase (not mock data)
7. ✅ Verify product recommendations match room analysis
8. ✅ Verify preview generation (or graceful fallback)
9. ✅ Verify session is saved
10. ✅ Verify buy links work

### Property-Based Tests
Located in `src/tests/properties/`:
- `analysisParser.test.ts` - JSON parsing robustness
- `productMatcher.test.ts` - Matching algorithm correctness
- `promptSanitization.test.ts` - Injection protection
- `uploadValidation.test.ts` - File validation

## Known Limitations

### Preview Generation
- **Current**: DALL-E 3 generates styled room mockups (not true product placement)
- **Reason**: True inpainting requires complex masking and perspective transformation
- **Workaround**: Labeled as "Visual Inspiration Preview"
- **Future**: Implement proper product placement with perspective correction

### Product Matching
- **Current**: Tag-based matching (no semantic embeddings yet)
- **Reason**: Embedding generation not yet implemented
- **Future**: Use pgvector for semantic similarity search

### Session Storage
- **Current**: In-memory Map (ephemeral in serverless)
- **Reason**: Simple development setup
- **Future**: Persist to Supabase `design_sessions` table

## Future Enhancements

### Phase 1: Improve Matching
- [ ] Generate embeddings for all products
- [ ] Implement vector similarity search
- [ ] Add user preference learning

### Phase 2: Better Previews
- [ ] Implement true product placement with perspective correction
- [ ] Use Stable Diffusion inpainting
- [ ] Add multiple preview variations

### Phase 3: User Features
- [ ] User authentication
- [ ] Save favorite products
- [ ] Share designs
- [ ] Design history

### Phase 4: Scale
- [ ] Add more stores (target: 100+ stores)
- [ ] Add more products (target: 10,000+ products)
- [ ] Add international stores
- [ ] Multi-language support

## Troubleshooting

### "No matching products found"
- Check if Supabase has active products
- Verify product_attributes table is populated
- Try broader prompt (e.g., "modern furniture" instead of "mid-century teak credenza")

### "Preview generation failed"
- Check if OPENAI_API_KEY or STABILITY_API_KEY is set
- Verify API keys are valid
- Check API rate limits
- This is non-fatal - products still display

### "AI analysis service is temporarily unavailable"
- Check if GEMINI_API_KEY or OPENAI_API_KEY is set
- Verify API keys are valid
- Check API rate limits
- Check network connectivity

### Products not loading from Supabase
- Verify SUPABASE_SERVICE_ROLE_KEY is set in Netlify environment
- Check Supabase RLS policies allow service role access
- Verify products table has is_active = true records

## Deployment

### Netlify Configuration
```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Environment Variables (Netlify)
Set these in Netlify Dashboard → Site Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `STABILITY_API_KEY` (optional)

## Performance

### Current Metrics
- **Room Analysis**: ~3-5 seconds (Gemini 1.5 Flash)
- **Product Recommendation**: ~1-2 seconds (Supabase query + matching)
- **Preview Generation**: ~10-15 seconds (DALL-E 3)
- **Total Pipeline**: ~15-20 seconds

### Optimization Opportunities
- Cache product catalog in memory (reduce Supabase queries)
- Pre-generate embeddings (enable vector search)
- Use CDN for product images
- Implement progressive loading

## Support

For questions or issues:
1. Check this documentation
2. Review code comments in source files
3. Check Supabase logs for database errors
4. Check Netlify function logs for API errors
5. Review browser console for frontend errors

---

**Last Updated**: May 9, 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready
