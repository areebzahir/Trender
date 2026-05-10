/**
 * requestLogger — logs room overlay requests to furniture_request_logs.
 * SERVER-SIDE ONLY.
 */

import { createClient } from '@supabase/supabase-js';
import type { UserRoomPromptInput, RoomAnalysis, ProductCandidate } from './types';

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export interface LogPayload {
  userPrompt:       UserRoomPromptInput;
  roomAnalysis?:    RoomAnalysis | null;
  selectedIds?:     string[];
  placement?:       unknown;
  renderGuidance?:  unknown;
  status:           'success' | 'clarification_needed' | 'error';
  errorMessage?:    string;
}

export async function logRoomOverlayRequest(payload: LogPayload): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return; // silently skip if not configured

  try {
    await supabase.from('furniture_request_logs').insert({
      requested_item_text: payload.userPrompt.originalPrompt,
      parsed_category:     payload.roomAnalysis?.requestedItem?.category ?? null,
      parsed_colors:       payload.roomAnalysis?.requestedItem?.colorPreferences ?? [],
      parsed_materials:    payload.roomAnalysis?.requestedItem?.materialPreferences ?? [],
      parsed_styles:       payload.roomAnalysis?.requestedItem?.stylePreferences ?? [],
      // Store full analysis + result in raw_payload if column exists
      // Falls back gracefully if column doesn't exist
    });
  } catch {
    // Logging is non-fatal — never block the main pipeline
  }
}
