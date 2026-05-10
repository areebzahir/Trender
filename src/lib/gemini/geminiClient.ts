/**
 * geminiClient — instantiates the Google Gemini SDK client.
 * SERVER-SIDE ONLY. Never import from React components.
 */

import { GoogleGenAI } from '@google/genai';
import { getGeminiConfig } from './geminiConfig';
import { GeminiConfigError } from './geminiErrors';

let _client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (_client) return _client;

  let config;
  try {
    config = getGeminiConfig();
  } catch (err) {
    throw new GeminiConfigError(
      err instanceof Error ? err.message : 'Failed to load Gemini config.'
    );
  }

  _client = new GoogleGenAI({ apiKey: config.apiKey });
  return _client;
}

/**
 * Calls a Gemini model and returns the raw text response.
 * Automatically falls back to Pro model if enabled and Flash fails.
 *
 * @param forceJson - set true to force JSON output via responseMimeType
 */
export async function callGemini(
  parts: Parameters<GoogleGenAI['models']['generateContent']>[0]['contents'],
  opts?: { forceModel?: string; forceJson?: boolean }
): Promise<string> {
  const config = getGeminiConfig();
  const client = getGeminiClient();
  const model = opts?.forceModel ?? config.model;
  const forceJson = opts?.forceJson ?? true; // default ON — all our calls expect JSON

  try {
    const response = await client.models.generateContent({
      model,
      contents: parts,
      config: {
        temperature:     config.temperature,
        maxOutputTokens: config.maxOutputTokens,
        // Force JSON output so Gemini never returns prose
        ...(forceJson ? { responseMimeType: 'application/json' } : {}),
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) throw new Error('Empty response from Gemini.');
    return text;

  } catch (err) {
    if (
      config.enableProFallback &&
      model !== config.fallbackModel
    ) {
      console.warn(`[geminiClient] Flash failed, falling back to ${config.fallbackModel}:`, err);
      return callGemini(parts, { forceModel: config.fallbackModel, forceJson });
    }
    throw err;
  }
}
