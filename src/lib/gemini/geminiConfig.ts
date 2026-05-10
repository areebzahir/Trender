/**
 * geminiConfig — reads and validates all Gemini-related env vars.
 * Server-side only. Never import from React components.
 */

export interface GeminiConfig {
  apiKey: string;
  model: string;
  fallbackModel: string;
  maxOutputTokens: number;
  temperature: number;
  enableProFallback: boolean;
}

export function getGeminiConfig(): GeminiConfig {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      '[GeminiConfig] GEMINI_API_KEY is not set. ' +
      'Add it to .env and never prefix it with VITE_.'
    );
  }

  // Basic format check — Google AI Studio keys start with "AIzaSy"
  if (!apiKey.startsWith('AIzaSy')) {
    console.warn(
      '[GeminiConfig] Warning: GEMINI_API_KEY does not look like a valid Google AI Studio key. ' +
      'Keys from https://aistudio.google.com/app/apikey start with "AIzaSy". ' +
      `Current key starts with: "${apiKey.slice(0, 8)}..."`
    );
  }

  return {
    apiKey,
    model:              process.env.GEMINI_MODEL              ?? 'gemini-2.5-flash',
    fallbackModel:      process.env.GEMINI_FALLBACK_MODEL     ?? 'gemini-2.5-pro',
    maxOutputTokens:    parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? '8000', 10),
    temperature:        parseFloat(process.env.GEMINI_TEMPERATURE     ?? '0.2'),
    enableProFallback:  process.env.GEMINI_ENABLE_PRO_FALLBACK === 'true',
  };
}
