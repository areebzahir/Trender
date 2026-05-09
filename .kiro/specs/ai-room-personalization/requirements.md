# Requirements Document

## Introduction

This feature replaces the existing Qloo-based recommendation logic in the Trender web app with a full AI room personalization flow. The user uploads a room photo and enters a natural-language prompt describing what they want (e.g. "Make this room look modern and cozy" or "Show me furniture under $800"). The system then analyzes the image with a vision AI, recommends complementary colours and matching products from the database, generates a realistic before/after room preview, and lets the user save and revisit their design session. All Qloo references, services, API calls, mock data, environment variables, and UI text are removed as part of this work.

---

## Glossary

- **AI_Room_Analyzer**: The server-side service that calls a vision AI (Gemini, OpenAI, or Claude) to analyze an uploaded room image and user prompt, returning a structured `RoomAnalysis` JSON object.
- **Product_Matcher**: The server-side service that accepts a `RoomAnalysis` object and queries the product database to return a ranked list of `Product` records.
- **Room_Preview_Generator**: The server-side service that calls an AI image-editing API to produce a realistic edited room image with recommended items placed inside it.
- **Design_Session**: A persisted record containing the uploaded image URL, `RoomAnalysis`, selected products, and generated preview image URL for a single user interaction.
- **RoomAnalysis**: The structured JSON object returned by the AI_Room_Analyzer, containing room type, current style, detected colours, recommended palette, design goal, missing items, recommended categories, and reasoning.
- **Product**: A database record with fields: `id`, `name`, `storeName`, `category`, `price`, `currency`, `productUrl`, `affiliateUrl`, `imageUrl`, `cleanImageUrl`, `colorTags`, `styleTags`, `materialTags`, `roomTags`, `dimensions`, `inStock`.
- **Room_Upload_Page**: The frontend page where the user uploads a room image and enters a prompt.
- **Results_Page**: The frontend page that displays the AI analysis, colour palette, recommended products, and before/after room preview.
- **Before_After_Preview**: The UI component that shows the original uploaded image alongside the AI-generated room preview image.
- **Product_Card**: The UI component that displays a single product with its image, name, store, price, and buy link.
- **Qloo**: The former third-party recommendation service. All references to Qloo are removed in this feature.

---

## Requirements

### Requirement 1: Remove All Qloo References

**User Story:** As a developer, I want all Qloo code, configuration, and UI text removed from the codebase, so that the app no longer depends on or references a service that is no longer in use.

#### Acceptance Criteria

1. THE System SHALL delete `src/services/qlooApi.ts` and remove all imports of `qlooService` or `QlooService` from every file in the project.
2. THE System SHALL remove the `VITE_QLOO_API_KEY` entry from `.env.example` and any `.env` files present in the repository.
3. THE System SHALL remove all UI strings containing the words "Qloo", "taste profile", "cultural taste", or "cultural intelligence" from every component file.
4. THE System SHALL remove the `gptService.ts` file if its only purpose is to generate mock Qloo-style explanations with no real API calls.
5. WHEN a build is run after removal, THE System SHALL produce zero TypeScript compilation errors related to missing Qloo imports or types.

---

### Requirement 2: Room Image Upload and Prompt Input

**User Story:** As a user, I want to upload a photo of my room and describe what I want, so that the AI can understand my space and my goals before making recommendations.

#### Acceptance Criteria

1. THE Room_Upload_Page SHALL render an image upload area that accepts JPEG, PNG, and WebP files up to 10 MB.
2. WHEN a user selects a file that exceeds 10 MB, THE Room_Upload_Page SHALL display an inline error message and reject the file without uploading it.
3. WHEN a user selects a file whose MIME type is not `image/jpeg`, `image/png`, or `image/webp`, THE Room_Upload_Page SHALL display an inline error message and reject the file.
4. THE Room_Upload_Page SHALL render a text input field for the user's design prompt with a maximum length of 500 characters.
5. WHEN the user's prompt input is empty or contains only whitespace, THE Room_Upload_Page SHALL disable the "Analyze Room" button.
6. WHEN both a valid image and a non-empty prompt are present, THE Room_Upload_Page SHALL enable the "Analyze Room" button.
7. THE Room_Upload_Page SHALL display at least four example prompt suggestions (e.g. "Make this room look modern and cozy", "Add a beige sofa and warm lighting", "Make this room look luxury under $800", "Show me furniture that matches my room colours") that the user can tap to pre-fill the prompt field.
8. WHEN the user submits the form, THE Room_Upload_Page SHALL show a loading state on the "Analyze Room" button and prevent duplicate submissions.

---

### Requirement 3: AI Room Analysis

**User Story:** As a user, I want the app to analyze my room image and prompt using AI, so that I receive a structured understanding of my room and design goals.

#### Acceptance Criteria

1. WHEN the user submits a valid image and prompt, THE AI_Room_Analyzer SHALL send the image (as base64) and prompt to a vision AI API (Gemini, OpenAI, or Claude) using a server-side API route at `POST /api/analyze-room`.
2. THE AI_Room_Analyzer SHALL never expose AI API keys to the frontend; all API keys SHALL be read from server-side environment variables only.
3. WHEN the vision AI returns a valid response, THE AI_Room_Analyzer SHALL parse and return a `RoomAnalysis` JSON object with the following fields: `roomType` (string), `currentStyle` (string), `detectedColors` (array of strings), `recommendedPalette` (array of strings), `designGoal` (string), `missingItems` (array of strings), `recommendedCategories` (array of strings), `reasoning` (string).
4. IF the vision AI returns a response that cannot be parsed as valid `RoomAnalysis` JSON, THEN THE AI_Room_Analyzer SHALL return a descriptive error object with field `error` (string) and SHALL NOT crash the server process.
5. IF the vision AI API call fails due to a network error or non-2xx HTTP status, THEN THE AI_Room_Analyzer SHALL return a descriptive error object and SHALL log the failure server-side.
6. THE `POST /api/analyze-room` route SHALL validate that the request body contains a non-empty base64 image string and a non-empty prompt string before calling the AI; IF either is missing, THEN THE route SHALL return HTTP 400 with a descriptive error message.

---

### Requirement 4: Product Database and Matching

**User Story:** As a user, I want the app to recommend real products from a database that match my room analysis, so that I can find and buy items that suit my space.

#### Acceptance Criteria

1. THE System SHALL define a `Product` TypeScript interface with fields: `id` (string), `name` (string), `storeName` (string), `category` (string), `price` (number), `currency` (string), `productUrl` (string), `affiliateUrl` (string), `imageUrl` (string), `cleanImageUrl` (string), `colorTags` (array of strings), `styleTags` (array of strings), `materialTags` (array of strings), `roomTags` (array of strings), `dimensions` (object with `width`, `height`, `depth` as strings), `inStock` (boolean).
2. THE Product_Matcher SHALL expose a server-side API route at `POST /api/recommend-products` that accepts a `RoomAnalysis` object and returns an array of matched `Product` records.
3. WHEN matching products, THE Product_Matcher SHALL filter by `category` against `recommendedCategories`, by `colorTags` against `recommendedPalette`, by `styleTags` against `currentStyle` and `designGoal`, and by `roomTags` against `roomType`.
4. WHEN the user's prompt contains a budget constraint (e.g. "under $800"), THE Product_Matcher SHALL filter out products whose `price` exceeds the stated budget.
5. WHEN no products match all filters, THE Product_Matcher SHALL relax the filter to category-only matching and return the best available results rather than an empty array.
6. THE Product_Matcher SHALL return products sorted by relevance score (number of matching tags) in descending order.
7. IF the `RoomAnalysis` input is missing required fields, THEN THE `POST /api/recommend-products` route SHALL return HTTP 400 with a descriptive error message.

---

### Requirement 5: AI Room Preview Generation

**User Story:** As a user, I want to see a realistic AI-generated preview of my room with the recommended furniture placed inside it, so that I can visualise the result before buying anything.

#### Acceptance Criteria

1. THE Room_Preview_Generator SHALL expose a server-side API route at `POST /api/generate-room-preview` that accepts the original room image (base64), selected product images, and the design prompt, and returns a generated preview image URL.
2. WHEN generating the preview, THE Room_Preview_Generator SHALL call an AI image-editing API (e.g. OpenAI DALL-E edit, Stability AI, or equivalent) to produce a realistic composite that preserves the original room's structure, lighting, shadows, and perspective.
3. IF true product-image placement is not achievable with the chosen API, THEN THE Room_Preview_Generator SHALL generate an AI-styled room mockup based on the uploaded room and design prompt, and the Results_Page SHALL clearly label the output as "Visual Inspiration Preview" and display the actual recommended products separately below it.
4. WHEN the preview generation is in progress, THE Results_Page SHALL display a loading skeleton or spinner in the Before_After_Preview area.
5. IF the preview generation API call fails, THEN THE Results_Page SHALL display an error state in the Before_After_Preview area with a "Retry" button, and SHALL NOT hide the recommended products section.
6. THE Room_Preview_Generator SHALL save the generated preview image URL to the Design_Session record upon successful generation.
7. THE Room_Preview_Generator SHALL never expose AI API keys to the frontend; all API keys SHALL be read from server-side environment variables only.

---

### Requirement 6: Before/After Preview UI

**User Story:** As a user, I want to see my original room and the AI-generated version side by side, so that I can clearly compare the before and after.

#### Acceptance Criteria

1. THE Before_After_Preview component SHALL display the original uploaded room image and the AI-generated preview image in a side-by-side or toggle layout.
2. THE Before_After_Preview component SHALL label the original image "Before" and the generated image "After".
3. WHEN the generated preview image is loading, THE Before_After_Preview component SHALL show a loading skeleton in the "After" panel.
4. WHEN the generated preview image fails to load, THE Before_After_Preview component SHALL show an error state with a "Retry" button in the "After" panel.
5. THE Before_After_Preview component SHALL be the hero/primary visual element at the top of the Results_Page, above the product recommendations.
6. THE Before_After_Preview component SHALL be fully responsive and usable on mobile screen widths of 375 px and above.

---

### Requirement 7: Recommended Colour Palette Display

**User Story:** As a user, I want to see the AI-recommended colour palette for my room, so that I can understand which colours complement my space.

#### Acceptance Criteria

1. THE Results_Page SHALL display the `recommendedPalette` array from the `RoomAnalysis` as a row of colour swatches with colour names.
2. WHEN a colour name from `recommendedPalette` maps to a known CSS colour or hex value, THE Results_Page SHALL render the swatch with that colour.
3. WHEN a colour name does not map to a known value, THE Results_Page SHALL render a neutral placeholder swatch and display the colour name as text.
4. THE Results_Page SHALL also display the `detectedColors` array as a secondary "Detected in your room" row of swatches.

---

### Requirement 8: Product Cards and Buy Links

**User Story:** As a user, I want to see recommended products displayed as clean cards with prices and buy links, so that I can easily browse and purchase items.

#### Acceptance Criteria

1. THE Results_Page SHALL render each matched `Product` as a Product_Card component.
2. THE Product_Card SHALL display: product image (`cleanImageUrl` with `imageUrl` as fallback), product name, store name, price with currency, and a "Buy Now" button linking to `affiliateUrl` (with `productUrl` as fallback).
3. WHEN `inStock` is `false`, THE Product_Card SHALL display an "Out of Stock" badge and disable the "Buy Now" button.
4. THE Product_Card SHALL display the product's `styleTags` as small badge labels.
5. THE Results_Page SHALL display product cards in a responsive grid: one column on mobile (< 640 px), two columns on tablet (640–1023 px), and three columns on desktop (≥ 1024 px).
6. WHEN no products are returned by the Product_Matcher, THE Results_Page SHALL display an empty state message explaining that no matching products were found and suggesting the user adjust their prompt.

---

### Requirement 9: Design Session Persistence

**User Story:** As a user, I want my design session to be saved, so that I can revisit my room analysis, recommended products, and generated preview later.

#### Acceptance Criteria

1. THE System SHALL expose a server-side API route at `POST /api/save-design` that accepts the uploaded image URL, `RoomAnalysis` object, selected product IDs, and generated preview image URL, and persists them as a `Design_Session` record.
2. WHEN a `Design_Session` is saved successfully, THE `POST /api/save-design` route SHALL return the saved session's `id` and `createdAt` timestamp.
3. IF any required field (`imageUrl`, `analysis`, `selectedProductIds`) is missing from the request body, THEN THE `POST /api/save-design` route SHALL return HTTP 400 with a descriptive error message.
4. THE System SHALL store the uploaded room image in a file storage service (local filesystem for development, configurable for production) and save the resulting URL in the `Design_Session` record.

---

### Requirement 10: Loading, Error, and Empty States

**User Story:** As a user, I want clear feedback during loading, on errors, and when results are empty, so that I always know what the app is doing and what to do next.

#### Acceptance Criteria

1. WHEN any API route (`/api/analyze-room`, `/api/recommend-products`, `/api/generate-room-preview`, `/api/save-design`) is processing a request, THE Results_Page SHALL display a loading indicator specific to that operation.
2. WHEN an API route returns an error, THE Results_Page SHALL display a human-readable error message and a "Try Again" button for that specific section, without hiding other sections that loaded successfully.
3. WHEN the product list is empty, THE Results_Page SHALL display an empty state illustration and a message suggesting the user refine their prompt.
4. WHEN the room preview generation fails, THE Results_Page SHALL display the recommended products section regardless, so the user still receives value.
5. THE System SHALL never display raw error stack traces or internal error messages to the user in the production UI.

---

### Requirement 11: Security and Input Validation

**User Story:** As a developer, I want all inputs validated and all API keys kept server-side, so that the app is secure and cannot be exploited through malformed inputs or exposed credentials.

#### Acceptance Criteria

1. THE System SHALL validate uploaded image MIME type and file size on the server side before passing the image to any AI API; IF validation fails, THEN THE server SHALL return HTTP 400.
2. THE System SHALL validate the user prompt on the server side: IF the prompt is empty, exceeds 500 characters, or contains only whitespace, THEN THE server SHALL return HTTP 400.
3. THE System SHALL read all AI API keys (Gemini, OpenAI, Claude, image generation) exclusively from server-side environment variables and SHALL NOT include them in any client-side bundle or response payload.
4. THE System SHALL sanitize the user prompt before including it in any AI API request to prevent prompt injection attacks.
5. IF any AI API returns a response that is not valid JSON when JSON is expected, THEN THE System SHALL catch the parse error, log it server-side, and return a structured error response to the client rather than crashing.

---

### Requirement 12: Code Quality and Architecture

**User Story:** As a developer, I want the codebase to be clean, modular, and production-ready, so that it is maintainable and scalable.

#### Acceptance Criteria

1. THE System SHALL implement the following named service modules: `aiRoomAnalysisService`, `productRecommendationService`, `roomPreviewGenerationService`, and `storageService`, each in its own file under `src/services/`.
2. THE System SHALL use TypeScript strict mode for all new and modified files, with no use of `any` type except where explicitly justified by a comment.
3. THE System SHALL remove all unused imports, unused variables, and dead code from every file modified as part of this feature.
4. THE System SHALL keep individual component files under 300 lines; WHERE a component exceeds this limit, THE System SHALL extract sub-components into separate files.
5. THE System SHALL preserve the existing routing structure in `src/App.tsx` and `src/pages/Index.tsx` and SHALL NOT break existing navigation flows (landing → choice → upload/quiz → results → swipe).
6. THE System SHALL add a new app state `'ai-results'` to the `AppState` type in `src/pages/Index.tsx` to represent the AI personalization results page, without removing existing states.
