/**
 * translateUserPrompt — normalizes and translates user prompts via Gemini 2.5 Flash.
 * SERVER-SIDE ONLY.
 */

import { callGemini } from './geminiClient';
import { parseGeminiJson } from './parseGeminiJson';
import { buildPromptNormalizationPrompt } from './prompts';
import { checkPromptGuardrails } from '../room-overlay/guardrails';
import type { UserRoomPromptInput } from '../room-overlay/types';

export async function translateUserPrompt(
  originalPrompt: string
): Promise<UserRoomPromptInput> {
  const { sanitizedPrompt, flags } = checkPromptGuardrails(originalPrompt);

  const promptText = buildPromptNormalizationPrompt(sanitizedPrompt);

  try {
    const raw = await callGemini([{ role: 'user', parts: [{ text: promptText }] }]);
    const parsed = parseGeminiJson<Record<string, unknown>>(raw);

    return {
      originalPrompt,
      detectedLanguage: parsed.detectedLanguage ? String(parsed.detectedLanguage) : 'en',
      translatedPrompt: parsed.translatedPrompt ? String(parsed.translatedPrompt) : sanitizedPrompt,
      normalizedPrompt: parsed.normalizedPrompt ? String(parsed.normalizedPrompt) : sanitizedPrompt,
      safetyFlags: [
        ...(Array.isArray(parsed.safetyFlags) ? parsed.safetyFlags.map(String) : []),
        ...flags,
      ],
    };
  } catch {
    // If Gemini call or parse fails, fall back gracefully — never block the pipeline
    return {
      originalPrompt,
      detectedLanguage: 'en',
      translatedPrompt: sanitizedPrompt,
      normalizedPrompt: sanitizedPrompt,
      safetyFlags: flags,
    };
  }
}
