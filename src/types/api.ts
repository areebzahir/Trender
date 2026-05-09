import type { RoomAnalysis } from './roomAnalysis';
import type { Product } from './product';

// ─── POST /api/analyze-room ───────────────────────────────────────────────────

export interface AnalyzeRoomRequest {
  /** Base64-encoded image string (no data URI prefix) */
  imageBase64: string;
  /** User's design prompt, 1–500 characters */
  prompt: string;
}

export interface AnalyzeRoomResponse {
  analysis: RoomAnalysis;
}

export interface AnalyzeRoomError {
  error: string;
}

// ─── POST /api/recommend-products ────────────────────────────────────────────

export interface RecommendProductsRequest {
  analysis: RoomAnalysis;
}

export interface RecommendProductsResponse {
  products: Product[];
}

// ─── POST /api/generate-room-preview ─────────────────────────────────────────

export interface GenerateRoomPreviewRequest {
  /** Base64-encoded original room image */
  imageBase64: string;
  /** URLs of selected product images to incorporate */
  productImageUrls: string[];
  /** User's design prompt */
  prompt: string;
}

export interface GenerateRoomPreviewResponse {
  /** URL of the generated preview image */
  previewUrl: string;
  /**
   * true  → the API could not place real product images; the preview is a
   *         styled room mockup labelled "Visual Inspiration Preview".
   * false → the preview contains the actual recommended products.
   */
  isFallback: boolean;
}

// ─── POST /api/save-design ───────────────────────────────────────────────────

export interface SaveDesignRequest {
  imageUrl: string;
  analysis: RoomAnalysis;
  selectedProductIds: string[];
  previewImageUrl: string | null;
}

export interface SaveDesignResponse {
  id: string;
  createdAt: string;
}

// ─── Combined result passed from RoomUploadPage → AIResultsPage ──────────────

export interface AIAnalysisResult {
  /** Base64 of the original image (used for before/after preview) */
  imageBase64: string;
  /** Stored URL of the uploaded image */
  imageUrl: string;
  analysis: RoomAnalysis;
  products: Product[];
  /** URL of the AI-generated preview, or null if generation failed/skipped */
  previewUrl: string | null;
  /** Whether the preview is a fallback mockup */
  isFallbackPreview: boolean;
  /** Saved design session ID */
  sessionId: string;
}
