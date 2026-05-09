import type { RoomAnalysis } from './roomAnalysis';

/**
 * DesignSession — a persisted record of a single user design interaction.
 */
export interface DesignSession {
  /** UUID v4 identifier */
  id: string;
  /** ISO 8601 timestamp, e.g. "2024-01-01T00:00:00.000Z" */
  createdAt: string;
  /** URL of the uploaded room image in storage */
  imageUrl: string;
  /** The AI analysis result for this session */
  analysis: RoomAnalysis;
  /** IDs of products the user selected or that were recommended */
  selectedProductIds: string[];
  /** URL of the AI-generated room preview image, or null if generation failed */
  previewImageUrl: string | null;
}
