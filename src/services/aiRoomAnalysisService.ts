/**
 * aiRoomAnalysisService — server-side service for AI room analysis.
 *
 * IMPORTANT: This module is intended to run inside Netlify Functions only.
 * It reads API keys from process.env — never from import.meta.env.
 * Do NOT import this file from any client-side component.
 */

import type { RoomAnalysis } from '../types/roomAnalysis';
import { ROOM_ANALYSIS_REQUIRED_FIELDS } from '../types/roomAnalysis';

// ─── Prompt injection patterns to strip ──────────────────────────────────────

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|above)\s+instructions?/gi,
  /you\s+are\s+now/gi,
  /disregard\s+(all|previous|above|the)/gi,
  /system\s*:/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /###\s*instruction/gi,
];

/**
 * Strips known prompt-injection patterns and truncates to 500 characters.
 */
export function sanitizePrompt(prompt: string): string {
  let sanitized = prompt;
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  return sanitized.trim().slice(0, 500);
}

/**
 * Validates that a prompt is non-empty, non-whitespace, and ≤ 500 characters.
 * Returns null on success, or an error string on failure.
 */
export function validatePrompt(prompt: string): string | null {
  if (!prompt || typeof prompt !== 'string') return 'Prompt is required.';
  if (prompt.trim().length === 0) return 'Prompt must not be empty or whitespace.';
  if (prompt.length > 500) return 'Prompt must be 500 characters or fewer.';
  return null;
}

/**
 * Attempts to parse a raw AI response string into a RoomAnalysis object.
 * Returns { error } if parsing fails — never throws.
 */
export function parseAnalysisResponse(rawText: string): RoomAnalysis | { error: string } {
  try {
    // Strip markdown code fences if the model wrapped the JSON
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw JSON parse result
    const parsed: any = JSON.parse(cleaned);

    // Validate all required fields are present and non-null
    for (const field of ROOM_ANALYSIS_REQUIRED_FIELDS) {
      if (parsed[field] === undefined || parsed[field] === null) {
        return { error: `AI response is missing required field: "${field}"` };
      }
    }

    // Coerce array fields in case the model returned strings
    const coerceArray = (val: unknown): string[] => {
      if (Array.isArray(val)) return val.map(String);
      if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    };

    const analysis: RoomAnalysis = {
      roomType: String(parsed.roomType),
      currentStyle: String(parsed.currentStyle),
      detectedColors: coerceArray(parsed.detectedColors),
      recommendedPalette: coerceArray(parsed.recommendedPalette),
      designGoal: String(parsed.designGoal),
      missingItems: coerceArray(parsed.missingItems),
      recommendedCategories: coerceArray(parsed.recommendedCategories),
      reasoning: String(parsed.reasoning),
    };

    return analysis;
  } catch (err) {
    return { error: `Failed to parse AI response as JSON: ${(err as Error).message}` };
  }
}

/**
 * Calls the Gemini vision API with the room image and sanitized prompt.
 * Falls back to OpenAI if GEMINI_API_KEY is not set.
 * Returns a RoomAnalysis or { error } — never throws.
 */
export async function analyzeRoom(
  imageBase64: string,
  prompt: string
): Promise<RoomAnalysis | { error: string }> {
  const sanitized = sanitizePrompt(prompt);

  const systemInstruction = `You are an expert interior design assistant. Analyze the provided room image based on the user's request. Respond ONLY with a valid JSON object matching this exact schema — no markdown, no explanation outside the JSON:
{
  "roomType": "string",
  "currentStyle": "string",
  "detectedColors": ["string"],
  "recommendedPalette": ["string"],
  "designGoal": "string",
  "missingItems": ["string"],
  "recommendedCategories": ["string"],
  "reasoning": "string"
}`;

  const userMessage = `User request: ${sanitized}`;

  // Try Gemini first
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${systemInstruction}\n\n${userMessage}` },
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: imageBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[aiRoomAnalysisService] Gemini API error ${response.status}: ${errText}`);
        // Fall through to OpenAI
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw API response
        const data: any = await response.json();
        const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        return parseAnalysisResponse(rawText);
      }
    } catch (err) {
      console.error('[aiRoomAnalysisService] Gemini network error:', err);
      // Fall through to OpenAI
    }
  }

  // Try OpenAI as fallback
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemInstruction },
            {
              role: 'user',
              content: [
                { type: 'text', text: userMessage },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
                },
              ],
            },
          ],
          max_tokens: 1024,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[aiRoomAnalysisService] OpenAI API error ${response.status}: ${errText}`);
        return { error: 'AI analysis service is temporarily unavailable. Please try again.' };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw API response
      const data: any = await response.json();
      const rawText: string = data?.choices?.[0]?.message?.content ?? '';
      return parseAnalysisResponse(rawText);
    } catch (err) {
      console.error('[aiRoomAnalysisService] OpenAI network error:', err);
      return { error: 'AI analysis service is temporarily unavailable. Please try again.' };
    }
  }

  return { error: 'No AI API key configured. Please set GEMINI_API_KEY or OPENAI_API_KEY.' };
}
