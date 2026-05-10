/**
 * geminiErrors — typed error classes for the Gemini intelligence layer.
 * User-facing messages are safe. Internal details stay server-side.
 */

export class GeminiConfigError extends Error {
  readonly code = 'GEMINI_CONFIG_ERROR';
  constructor(message: string) { super(message); this.name = 'GeminiConfigError'; }
}

export class GeminiResponseParseError extends Error {
  readonly code = 'GEMINI_PARSE_ERROR';
  readonly raw: string;
  constructor(message: string, raw: string) {
    super(message);
    this.name = 'GeminiResponseParseError';
    this.raw = raw;
  }
}

export class GeminiSchemaValidationError extends Error {
  readonly code = 'GEMINI_SCHEMA_ERROR';
  readonly issues: unknown;
  constructor(message: string, issues: unknown) {
    super(message);
    this.name = 'GeminiSchemaValidationError';
    this.issues = issues;
  }
}

export class GeminiSafetyError extends Error {
  readonly code = 'GEMINI_SAFETY_ERROR';
  constructor(message: string) { super(message); this.name = 'GeminiSafetyError'; }
}

export class GeminiAnalysisError extends Error {
  readonly code = 'GEMINI_ANALYSIS_ERROR';
  constructor(message: string) { super(message); this.name = 'GeminiAnalysisError'; }
}

export class GeminiRankingError extends Error {
  readonly code = 'GEMINI_RANKING_ERROR';
  constructor(message: string) { super(message); this.name = 'GeminiRankingError'; }
}

/** Maps internal errors to safe user-facing messages. */
export function toUserMessage(err: unknown): string {
  if (err instanceof Error) {
    // Rate limit / quota exceeded
    if (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('quota')) {
      return 'Gemini API quota exceeded. Please wait a few minutes and try again, or enable billing at aistudio.google.com.';
    }
    // API key issues
    if (err.message.includes('403') || err.message.includes('API_KEY') || err.message.includes('PERMISSION_DENIED')) {
      return 'Gemini API key error. Please check your GEMINI_API_KEY in .env.';
    }
  }
  if (err instanceof GeminiSafetyError)
    return 'Please upload a clear photo of the room you want to redesign.';
  if (err instanceof GeminiAnalysisError)
    return 'We could not understand the room photo. Try a clearer image.';
  if (err instanceof GeminiRankingError)
    return 'We could not find furniture that matches your request yet.';
  if (err instanceof GeminiSchemaValidationError || err instanceof GeminiResponseParseError)
    return 'Try describing the furniture type, color, or style more clearly.';
  return 'Something went wrong. Please try again.';
}
