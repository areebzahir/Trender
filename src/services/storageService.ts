/**
 * storageService — server-side service for image and session storage.
 *
 * IMPORTANT: This module is intended to run inside Netlify Functions only.
 * Do NOT import this file from any client-side component.
 *
 * Storage strategy:
 * - Development (STORAGE_PROVIDER=local or unset): in-memory Map + base64 data URIs.
 * - Production: configurable via STORAGE_PROVIDER env var.
 *   Currently supported: "local" (in-memory, suitable for serverless ephemeral storage).
 *   Extend this file to add S3, Cloudinary, etc.
 */

import type { DesignSession } from '../types/designSession';
import type { RoomAnalysis } from '../types/roomAnalysis';

// ─── In-memory session store (development / serverless ephemeral) ─────────────

// NOTE: In a serverless environment each function invocation may get a fresh
// instance, so this Map is ephemeral. For production persistence, replace with
// a database call (e.g. Supabase, PlanetScale, DynamoDB).
const sessionStore = new Map<string, DesignSession>();

// ─── UUID v4 generator (no external dependency) ───────────────────────────────

function generateUUID(): string {
  // Use crypto.randomUUID if available (Node 14.17+, modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: RFC 4122 v4 UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Image storage ────────────────────────────────────────────────────────────

/**
 * Stores a base64-encoded image and returns a URL.
 *
 * In development: returns a data URI (no disk I/O needed in serverless).
 * In production: extend to upload to S3/Cloudinary and return the CDN URL.
 */
export async function storeImage(
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const provider = process.env.STORAGE_PROVIDER ?? 'local';

  if (provider === 'local') {
    // Return a data URI — works for development and serverless environments
    return `data:${mimeType};base64,${imageBase64}`;
  }

  // TODO: Add S3/Cloudinary support here when STORAGE_PROVIDER is set
  console.warn(`[storageService] Unknown STORAGE_PROVIDER "${provider}", falling back to data URI`);
  return `data:${mimeType};base64,${imageBase64}`;
}

// ─── Session persistence ──────────────────────────────────────────────────────

/**
 * Persists a design session and returns the saved record with id and createdAt.
 */
export async function saveSession(
  session: Omit<DesignSession, 'id' | 'createdAt'>
): Promise<DesignSession> {
  const saved: DesignSession = {
    ...session,
    id: generateUUID(),
    createdAt: new Date().toISOString(),
  };
  sessionStore.set(saved.id, saved);
  return saved;
}

/**
 * Retrieves a design session by ID. Returns null if not found.
 */
export async function getSession(id: string): Promise<DesignSession | null> {
  return sessionStore.get(id) ?? null;
}

/**
 * Validates that a RoomAnalysis object has all required fields.
 * Used by the save-design function before persisting.
 */
export function isValidRoomAnalysis(obj: unknown): obj is RoomAnalysis {
  if (!obj || typeof obj !== 'object') return false;
  const required: Array<keyof RoomAnalysis> = [
    'roomType', 'currentStyle', 'detectedColors', 'recommendedPalette',
    'designGoal', 'missingItems', 'recommendedCategories', 'reasoning',
  ];
  return required.every(field => field in (obj as Record<string, unknown>));
}
