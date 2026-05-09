# Implementation Plan: AI Room Personalization

## Overview

Replace the Qloo-based recommendation flow with a full AI room personalization pipeline. The implementation proceeds in dependency order: clean up legacy code first, establish shared types, build the service layer and Netlify Functions, then build the UI components, wire navigation, and finally validate correctness with property-based tests and a TypeScript compilation check.

All new code targets TypeScript strict mode. Netlify Functions live under `netlify/functions/`. Client-side services live under `src/services/`. Shared types live under `src/types/`.

---

## Tasks

- [x] 1. Remove all Qloo and mock-only legacy code
  - [x] 1.1 Delete `src/services/qlooApi.ts` and remove all its imports
    - Delete the file `src/services/qlooApi.ts`
    - Search every file under `src/` for `import.*qlooApi`, `qlooService`, `QlooService`, `QlooTasteProfile`, `QlooRecommendation` and remove those import lines and any usage
    - _Requirements: 1.1_

  - [x] 1.2 Delete `src/services/gptService.ts` (mock-only, no real API calls)
    - Delete the file `src/services/gptService.ts`
    - Search every file under `src/` for `import.*gptService`, `gptService`, `GPTService`, `GPTExplanation`, `RoomVisualization` and remove those import lines and any usage
    - _Requirements: 1.4_

  - [x] 1.3 Remove Qloo-related UI strings from all component files
    - Search all `.tsx` files for the strings "Qloo", "taste profile", "cultural taste", "cultural intelligence" and remove or replace those strings
    - _Requirements: 1.3_

  - [x] 1.4 Update `.env.example` — remove Qloo key, remove `VITE_` prefix from AI keys, add new server-side keys
    - Remove `VITE_QLOO_API_KEY` entry
    - Remove `VITE_GEMINI_API_KEY` and `VITE_OPENAI_API_KEY` (these must not be in the client bundle)
    - Add server-side-only entries: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `STABILITY_API_KEY`, `STORAGE_PROVIDER`
    - _Requirements: 1.2, 11.3_

  - [x] 1.5 Remove `VITE_GEMINI_API_KEY` usage from `src/services/geminiService.ts`
    - The existing `geminiService.ts` reads `import.meta.env.VITE_GEMINI_API_KEY` — this key must move server-side
    - Refactor `geminiService.ts` to remove the `import.meta.env` reference; the service will no longer be called from the client bundle (it will be superseded by `aiRoomAnalysisService.ts` inside a Netlify Function)
    - _Requirements: 11.3_

- [x] 2. Define shared TypeScript types
  - [x] 2.1 Create `src/types/roomAnalysis.ts` with the `RoomAnalysis` interface
    - Export `RoomAnalysis` with fields: `roomType`, `currentStyle`, `detectedColors`, `recommendedPalette`, `designGoal`, `missingItems`, `recommendedCategories`, `reasoning` (all typed as specified in the design)
    - _Requirements: 3.3, 4.1_

  - [x] 2.2 Create `src/types/product.ts` with the `Product` interface
    - Export `Product` with all 16 fields from the design: `id`, `name`, `storeName`, `category`, `price`, `currency`, `productUrl`, `affiliateUrl`, `imageUrl`, `cleanImageUrl`, `colorTags`, `styleTags`, `materialTags`, `roomTags`, `dimensions` (object), `inStock`
    - _Requirements: 4.1_

  - [x] 2.3 Create `src/types/designSession.ts` with the `DesignSession` interface
    - Export `DesignSession` with fields: `id`, `createdAt`, `imageUrl`, `analysis`, `selectedProductIds`, `previewImageUrl`
    - _Requirements: 9.1_

  - [x] 2.4 Create `src/types/api.ts` with all API request/response interfaces
    - Export: `AnalyzeRoomRequest`, `AnalyzeRoomResponse`, `AnalyzeRoomError`, `RecommendProductsRequest`, `RecommendProductsResponse`, `GenerateRoomPreviewRequest`, `GenerateRoomPreviewResponse`, `SaveDesignRequest`, `SaveDesignResponse`
    - Export `AIAnalysisResult` (the combined result passed from `RoomUploadPage` to `AIResultsPage`)
    - _Requirements: 3.1, 4.2, 5.1, 9.1_

  - [x] 2.5 Create `src/types/index.ts` barrel file that re-exports all types
    - Re-export everything from `roomAnalysis.ts`, `product.ts`, `designSession.ts`, `api.ts`
    - _Requirements: 12.1_

- [x] 3. Build the product database
  - [x] 3.1 Create `src/data/products.ts` with the full `Product` interface and sample data
    - Import `Product` from `src/types/product.ts`
    - Migrate the six existing `FurnitureItem` records from `src/data/sampleFurniture.ts` into the new `Product` shape, mapping fields: `brand` → `storeName`, `buyLink` → `productUrl` and `affiliateUrl`, `images[0]` → `imageUrl` and `cleanImageUrl`, `style` → `styleTags`, `materials` → `materialTags`, add `colorTags` from `colorOptions[].name`, add `roomTags` (e.g. `["living room"]`), add `currency: "USD"`
    - Add at least four additional `Product` records covering different categories (e.g. lighting, tables, storage, decor) to give the matcher meaningful variety
    - Export `products: Product[]` as the default catalogue
    - _Requirements: 4.1, 4.3_

- [x] 4. Implement the service layer
  - [x] 4.1 Create `src/services/aiRoomAnalysisService.ts`
    - Implement `sanitizePrompt(prompt: string): string` — strips known injection phrases (case-insensitive regex for `ignore (previous|above) instructions`, `you are now`, `disregard`, `system:`, `<\|im_start\|>`, `<\|im_end\|>`), then truncates to 500 chars
    - Implement `parseAnalysisResponse(rawText: string): RoomAnalysis | { error: string }` — attempts `JSON.parse`, validates all eight required fields are present and non-null, returns `{ error }` on any failure without throwing
    - Implement `analyzeRoom(imageBase64: string, prompt: string): Promise<RoomAnalysis | { error: string }>` — reads `process.env.GEMINI_API_KEY` (or `OPENAI_API_KEY`) at call time, calls the vision AI, delegates to `parseAnalysisResponse`; on non-2xx or network error returns `{ error }` and logs server-side
    - No `any` types except where unavoidable (comment required)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 11.4_

  - [x] 4.2 Create `src/services/productRecommendationService.ts`
    - Implement `extractBudget(prompt: string): number | null` — parses phrases like "under $800", "less than $500", "budget of $1200" from the prompt
    - Implement `scoreProduct(product: Product, analysis: RoomAnalysis): number` — counts matching tags across `colorTags` vs `recommendedPalette`, `styleTags` vs `currentStyle`/`designGoal`, `materialTags` vs `reasoning`, `roomTags` vs `roomType`, `category` vs `recommendedCategories`
    - Implement `recommendProducts(analysis: RoomAnalysis, catalogue: Product[], budgetLimit?: number): Product[]` — filters by all four dimensions, applies budget filter if `budgetLimit` is set, falls back to category-only if no products pass all filters, returns sorted by `scoreProduct` descending
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 4.3 Create `src/services/roomPreviewGenerationService.ts`
    - Implement `generateRoomPreview(imageBase64: string, productImageUrls: string[], prompt: string): Promise<{ previewUrl: string; isFallback: boolean } | { error: string }>` — reads `process.env.OPENAI_API_KEY` or `process.env.STABILITY_API_KEY`, calls the image-generation AI, returns `isFallback: true` if product placement was not achievable; on failure returns `{ error }` without throwing
    - _Requirements: 5.1, 5.2, 5.3, 5.7_

  - [x] 4.4 Create `src/services/storageService.ts`
    - Implement `storeImage(imageBase64: string, mimeType: string): Promise<string>` — in development writes to `./tmp/uploads/` with a UUID filename and returns a relative URL; reads `process.env.STORAGE_PROVIDER` to select provider in production
    - Implement `saveSession(session: Omit<DesignSession, 'id' | 'createdAt'>): Promise<DesignSession>` — generates a UUID v4 `id`, sets `createdAt` to `new Date().toISOString()`, stores in an in-memory `Map` (development) or configurable store
    - Implement `getSession(id: string): Promise<DesignSession | null>` — retrieves from the same store
    - _Requirements: 9.1, 9.2, 9.4_

- [x] 5. Implement the Netlify Functions
  - [x] 5.1 Create `netlify/functions/analyze-room.ts`
    - Import `Handler` from `@netlify/functions`
    - Validate request body: `imageBase64` must be a non-empty string; `prompt` must be non-empty, ≤ 500 chars, not purely whitespace — return HTTP 400 with `{ error }` if any check fails
    - Call `analyzeRoom` from `aiRoomAnalysisService`; on service error return HTTP 500 with `{ error: "Something went wrong. Please try again." }` (never propagate internal messages)
    - On success return HTTP 200 with `{ analysis: RoomAnalysis }`
    - _Requirements: 3.1, 3.2, 3.6, 11.1, 11.2_

  - [x] 5.2 Create `netlify/functions/recommend-products.ts`
    - Validate that `analysis` is present and contains all eight `RoomAnalysis` fields — return HTTP 400 if invalid
    - Import `products` catalogue from `src/data/products.ts`; call `recommendProducts` from `productRecommendationService`
    - Return HTTP 200 with `{ products: Product[] }`
    - _Requirements: 4.2, 4.7_

  - [x] 5.3 Create `netlify/functions/generate-room-preview.ts`
    - Validate: `imageBase64` non-empty, `productImageUrls` is an array, `prompt` non-empty — return HTTP 400 if invalid
    - Call `generateRoomPreview` from `roomPreviewGenerationService`; on error return HTTP 500 with generic message
    - Return HTTP 200 with `{ previewUrl, isFallback }`
    - _Requirements: 5.1, 5.7_

  - [x] 5.4 Create `netlify/functions/save-design.ts`
    - Validate: `imageUrl` non-empty string, `analysis` valid `RoomAnalysis`, `selectedProductIds` is an array of strings — return HTTP 400 if any check fails
    - Call `storeImage` if needed, then `saveSession` from `storageService`
    - Return HTTP 200 with `{ id, createdAt }`
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 6. Checkpoint — verify service layer and functions compile
  - Run `npx tsc --noEmit` and fix any TypeScript errors in tasks 1–5 before proceeding to UI work
  - Ensure all four Netlify function files export a `handler` symbol
  - _Requirements: 1.5, 12.2_

- [x] 7. Build the `RoomUploadPage` component
  - [x] 7.1 Create `src/components/RoomUploadPage.tsx` — image drop zone and prompt input
    - Accept props `{ onAnalysisComplete: (result: AIAnalysisResult) => void; onBack: () => void }`
    - Render an `ImageDropZone` sub-component: drag-and-drop area + file input accepting `image/jpeg,image/png,image/webp`, max 10 MB
    - On file select: validate MIME type (reject with inline error if not jpeg/png/webp) and size (reject with inline error if > 10 MB); store the `File` object in state
    - Render a prompt `<textarea>` with `maxLength={500}`; track character count
    - Disable the "Analyze Room" button when prompt is empty or whitespace-only, or no valid image is selected
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 7.2 Add `PromptSuggestions` sub-component inside `RoomUploadPage`
    - Render at least four tappable suggestion chips: "Make this room look modern and cozy", "Add a beige sofa and warm lighting", "Make this room look luxury under $800", "Show me furniture that matches my room colours"
    - On tap, pre-fill the prompt textarea with the suggestion text
    - _Requirements: 2.7_

  - [x] 7.3 Implement the form submission pipeline in `RoomUploadPage`
    - On "Analyze Room" click: convert the `File` to base64, show loading state on the button, disable the button to prevent duplicate submissions
    - Call `POST /api/analyze-room` with `{ imageBase64, prompt }`; on error show inline error message (no stack traces)
    - On success call `POST /api/recommend-products` with `{ analysis }`
    - Call `POST /api/generate-room-preview` with `{ imageBase64, productImageUrls, prompt }`
    - Call `POST /api/save-design` with `{ imageUrl, analysis, selectedProductIds, previewImageUrl }`
    - Assemble `AIAnalysisResult` and call `onAnalysisComplete(result)`
    - _Requirements: 2.8, 3.1, 4.2, 5.1, 9.1, 10.1, 10.5_

- [x] 8. Build the `BeforeAfterPreview` component
  - Create `src/components/BeforeAfterPreview.tsx`
  - Accept props: `{ beforeImageUrl, afterImageUrl, isLoading, isError, isFallbackMode, onRetry }`
  - Render "Before" and "After" panels side by side (stacked on mobile ≥ 375 px, side-by-side on tablet+)
  - "Before" panel: always shows the original uploaded image with "Before" label
  - "After" panel: shows loading skeleton when `isLoading`, error state with "Retry" button when `isError`, the generated image when loaded; when `isFallbackMode` is true overlay a "Visual Inspiration Preview" label
  - This component is the hero element — place it at the top of `AIResultsPage`
  - _Requirements: 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 9. Extend the `ColourPalette` component
  - Modify `src/components/ColorPalette.tsx` to accept the new `ColourPaletteProps` interface: `{ recommendedPalette: string[]; detectedColors: string[] }`
  - Render two labelled rows: "Recommended for your room" (from `recommendedPalette`) and "Detected in your room" (from `detectedColors`)
  - Each swatch: attempt to resolve the colour name to a CSS named colour or hex; if unresolvable render a neutral `#CCCCCC` swatch and display the colour name as text
  - Preserve backward compatibility with the existing `colors` prop for other usages in the codebase
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 10. Build the `ProductCard` component
  - Create `src/components/ProductCard.tsx`
  - Accept props: `{ product: Product }`
  - Render: product image (`cleanImageUrl` with `imageUrl` as fallback, with `alt` = product name), product name, store name, price formatted as `${currency} ${price}` (e.g. "USD 2,299"), a "Buy Now" anchor with `href={affiliateUrl || productUrl}` and `target="_blank" rel="noopener noreferrer"`
  - When `inStock` is `false`: render an "Out of Stock" badge and set `disabled` on the "Buy Now" button (use `<button disabled>` or `aria-disabled`)
  - Render each entry in `styleTags` as a small `<Badge>` element
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 11. Build the `AIResultsPage` component
  - Create `src/components/AIResultsPage.tsx`
  - Accept props: `{ result: AIAnalysisResult; onBack: () => void; onStartOver: () => void }`
  - Render in order: `BeforeAfterPreview` (hero), `ColourPalette` (with `recommendedPalette` and `detectedColors` from `result.analysis`), product grid
  - Product grid: responsive CSS grid — 1 column on mobile (< 640 px), 2 columns on tablet (640–1023 px), 3 columns on desktop (≥ 1024 px); render each product as a `ProductCard`
  - When `result.products` is empty: render an `EmptyState` sub-component with an illustration and message "No matching products found — try adjusting your prompt"
  - Maintain per-section error state (`analyzeError`, `productsError`, `previewError`, `saveError`); an error in one section must not hide other sections
  - Render "Back" and "Start Over" buttons that call the respective props
  - _Requirements: 8.1, 8.5, 8.6, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 12. Update `Index.tsx` — add `'ai-results'` state and wire navigation
  - Add `'ai-results'` to the `AppState` union type
  - Add `const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null)`
  - Add handler `handleAIAnalysisComplete(result: AIAnalysisResult)` — sets `aiResult` and navigates to `'ai-results'`
  - Add handler `handleBackFromAIResults()` — navigates back to `'upload'`
  - Add handler `handleStartOver()` — clears `aiResult` and navigates to `'landing'`
  - In the `'upload'` branch, render `RoomUploadPage` (new component) instead of the existing `RoomUpload` — pass `onAnalysisComplete={handleAIAnalysisComplete}` and `onBack={handleBackToChoice}`
  - Add a new branch for `'ai-results'` that renders `AIResultsPage` with `result={aiResult!}`, `onBack={handleBackFromAIResults}`, `onStartOver={handleStartOver}`
  - Preserve all existing state branches and handlers unchanged
  - _Requirements: 12.5, 12.6_

- [x] 13. Checkpoint — full TypeScript compilation and smoke tests
  - Run `npx tsc --noEmit` and fix all remaining errors
  - Verify no files under `src/` contain the strings `qlooApi`, `qlooService`, `QlooService`, `gptService`, `GPTService`, or `VITE_QLOO_API_KEY`
  - Verify no files under `src/` contain `VITE_GEMINI_API_KEY` or `VITE_OPENAI_API_KEY` (keys must be server-side only)
  - Verify all four Netlify function files exist: `netlify/functions/analyze-room.ts`, `netlify/functions/recommend-products.ts`, `netlify/functions/generate-room-preview.ts`, `netlify/functions/save-design.ts`
  - _Requirements: 1.5, 11.3_

- [x] 14. Write property-based tests using fast-check
  - [x] 14.1 Install `fast-check` and `vitest` as dev dependencies if not already present
    - Add `fast-check` and `vitest` to `devDependencies` in `package.json`
    - Create `vitest.config.ts` if it does not exist
    - _Requirements: 12.1_

  - [x] 14.2 Create `src/tests/properties/uploadValidation.test.ts` — Properties 1–4
    - **Property 1: File size rejection** — for any byte size > 10,485,760, the upload validation function rejects with a non-empty error message
      - `// Feature: ai-room-personalization, Property 1: File size rejection`
      - **Validates: Requirements 2.2, 11.1**
    - **Property 2: MIME type rejection** — for any MIME type not in `["image/jpeg","image/png","image/webp"]`, the validation rejects with a non-empty error message
      - `// Feature: ai-room-personalization, Property 2: MIME type rejection`
      - **Validates: Requirements 2.3, 11.1**
    - **Property 3: Whitespace prompt disables submission** — for any string of only whitespace chars, `isPromptValid` returns `false`
      - `// Feature: ai-room-personalization, Property 3: Whitespace prompt disables submission`
      - **Validates: Requirements 2.5, 11.2**
    - **Property 4: Valid inputs enable submission** — for any valid MIME type, size ≤ 10 MB, and non-empty non-whitespace prompt, `isFormReady` returns `true`
      - `// Feature: ai-room-personalization, Property 4: Valid inputs enable submission`
      - **Validates: Requirements 2.6**

  - [x] 14.3 Create `src/tests/properties/analysisParser.test.ts` — Properties 5–7
    - **Property 5: RoomAnalysis parser completeness** — for any valid JSON string containing all eight required fields, `parseAnalysisResponse` returns a `RoomAnalysis` with all eight fields present and non-null
      - `// Feature: ai-room-personalization, Property 5: RoomAnalysis parser completeness`
      - **Validates: Requirements 3.3**
    - **Property 6: Malformed AI response returns error object** — for any string that is not valid JSON or is missing required fields, `parseAnalysisResponse` returns `{ error: string }` without throwing
      - `// Feature: ai-room-personalization, Property 6: Malformed AI response returns error object`
      - **Validates: Requirements 3.4, 11.5**
    - **Property 7: Server-side prompt validation rejects invalid inputs** — for any prompt that is empty, whitespace-only, or > 500 chars, `validatePrompt` returns a failure result without throwing
      - `// Feature: ai-room-personalization, Property 7: Server-side prompt validation rejects invalid inputs`
      - **Validates: Requirements 3.6, 11.2**

  - [x] 14.4 Create `src/tests/properties/productMatcher.test.ts` — Properties 8–9
    - **Property 8: Product relevance sort order** — for any `RoomAnalysis` and non-empty catalogue, `recommendProducts` returns an array where `scoreProduct(products[i]) >= scoreProduct(products[i+1])` for every adjacent pair
      - `// Feature: ai-room-personalization, Property 8: Product relevance sort order`
      - **Validates: Requirements 4.6**
    - **Property 9: Budget filter correctness** — for any budget `B > 0` and any catalogue, every product in the result has `price <= B`
      - `// Feature: ai-room-personalization, Property 9: Budget filter correctness`
      - **Validates: Requirements 4.4**

  - [x] 14.5 Create `src/tests/properties/promptSanitization.test.ts` — Property 10
    - **Property 10: Prompt sanitization removes injection patterns** — for any prompt containing known injection substrings, `sanitizePrompt` output does not contain those patterns
      - `// Feature: ai-room-personalization, Property 10: Prompt sanitization removes injection patterns`
      - **Validates: Requirements 11.4**

  - [x] 14.6 Create `src/tests/properties/colourPalette.test.ts` — Properties 11–12
    - **Property 11: Colour palette rendering completeness** — for any array of colour name strings passed as `recommendedPalette`, the rendered `ColourPalette` contains exactly one swatch per entry with the colour name as visible text
      - `// Feature: ai-room-personalization, Property 11: Colour palette rendering completeness`
      - **Validates: Requirements 7.1, 7.4**
    - **Property 12: Unknown colour name renders placeholder** — for any colour name not in the CSS/hex lookup table, the rendered swatch has a neutral background and displays the colour name as text
      - `// Feature: ai-room-personalization, Property 12: Unknown colour name renders placeholder`
      - **Validates: Requirements 7.3**

  - [x] 14.7 Create `src/tests/properties/productCard.test.ts` — Properties 13–14
    - **Property 13: ProductCard renders all required fields** — for any `Product` record, the rendered `ProductCard` contains the image, name, store name, formatted price, a "Buy Now" anchor with correct `href`, and one badge per `styleTags` entry
      - `// Feature: ai-room-personalization, Property 13: ProductCard renders all required fields`
      - **Validates: Requirements 8.2, 8.4**
    - **Property 14: Out-of-stock products disable buy button** — for any `Product` where `inStock` is `false`, the rendered `ProductCard` shows an "Out of Stock" badge and the "Buy Now" button has `disabled`
      - `// Feature: ai-room-personalization, Property 14: Out-of-stock products disable buy button`
      - **Validates: Requirements 8.3**

  - [x] 14.8 Create `src/tests/properties/storageService.test.ts` — Properties 15–16
    - **Property 15: Save-design round trip** — for any valid `SaveDesignRequest`, calling `saveSession` then `getSession` with the returned `id` yields a `DesignSession` deeply equal to the original request values
      - `// Feature: ai-room-personalization, Property 15: Save-design round trip`
      - **Validates: Requirements 9.1, 9.2**
    - **Property 16: Save-design response shape** — for any valid `SaveDesignRequest`, the response contains a non-empty `id` string and a `createdAt` string that parses as a valid ISO 8601 date
      - `// Feature: ai-room-personalization, Property 16: Save-design response shape`
      - **Validates: Requirements 9.2**

  - [x] 14.9 Create `src/tests/properties/errorIsolation.test.ts` — Properties 17–18
    - **Property 17: Error isolation — other sections remain visible** — for any single-section error, `AIResultsPage` renders successfully-loaded sections and shows "Try Again" only in the errored section
      - `// Feature: ai-room-personalization, Property 17: Error isolation — other sections remain visible`
      - **Validates: Requirements 10.2, 10.4**
    - **Property 18: No stack traces in user-facing error messages** — for any internally thrown error, the string rendered in the UI does not match `/at\s+\w+\s*\(/` and does not contain file path separators in a path context
      - `// Feature: ai-room-personalization, Property 18: No stack traces in user-facing error messages`
      - **Validates: Requirements 10.5**

- [x] 15. Final checkpoint — run tests and verify zero Qloo references
  - Run `npx vitest --run` and confirm all property tests pass (minimum 100 iterations each)
  - Run `npx tsc --noEmit` and confirm zero errors
  - Confirm no occurrences of `qlooApi`, `qlooService`, `QlooService`, `gptService`, `VITE_QLOO_API_KEY`, `VITE_GEMINI_API_KEY`, or `VITE_OPENAI_API_KEY` remain anywhere under `src/` or `netlify/`
  - _Requirements: 1.1, 1.2, 1.5, 11.3_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 6 and 13) ensure incremental validation before moving to the next phase
- Property tests validate universal correctness properties; unit tests validate specific examples and edge cases
- The existing navigation flow (landing → choice → upload/quiz → results → swipe) is preserved throughout — only the `'upload'` branch gains a new component and a new `'ai-results'` branch is added
- All AI API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `STABILITY_API_KEY`) must only appear in Netlify Function files and environment variables — never in `src/`
