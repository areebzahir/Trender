/**
 * guardrails — validates prompts and images before they reach Gemini.
 */

import { GeminiSafetyError } from '../gemini/geminiErrors';

// ── Prompt guardrails ─────────────────────────────────────────────────────────

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|above|all)\s+instructions?/i,
  /you\s+are\s+now\s+/i,
  /disregard\s+(all|previous|the|above)/i,
  /show\s+(me\s+)?(your\s+)?(api\s+key|secret|password|token)/i,
  /dump\s+(the\s+)?(database|db|table|products)/i,
  /delete\s+(all\s+)?(products|rows|data|records)/i,
  /return\s+all\s+products/i,
  /bypass\s+(budget|filter|limit|security)/i,
  /select\s+\*\s+from/i,
  /drop\s+table/i,
  /insert\s+into/i,
  /update\s+\w+\s+set/i,
  /<\|im_start\|>/i,
  /\[INST\]/i,
  /system\s*:/i,
];

const UNRELATED_PATTERNS: RegExp[] = [
  /\b(weather|stock\s+price|news|politics|recipe|medication|medical\s+advice)\b/i,
];

export interface PromptGuardrailResult {
  safe: boolean;
  flags: string[];
  sanitizedPrompt: string;
}

export function checkPromptGuardrails(prompt: string): PromptGuardrailResult {
  const flags: string[] = [];

  if (!prompt || typeof prompt !== 'string') {
    throw new GeminiSafetyError('Prompt is required.');
  }

  const trimmed = prompt.trim();
  if (trimmed.length === 0) throw new GeminiSafetyError('Prompt must not be empty.');
  if (trimmed.length > 600) throw new GeminiSafetyError('Prompt must be 600 characters or fewer.');

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      flags.push(`injection_attempt: ${pattern.source.slice(0, 40)}`);
    }
  }

  for (const pattern of UNRELATED_PATTERNS) {
    if (pattern.test(trimmed)) {
      flags.push(`unrelated_topic: ${pattern.source.slice(0, 40)}`);
    }
  }

  // Strip injection patterns from the prompt before sending to Gemini
  let sanitized = trimmed;
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  sanitized = sanitized.trim();

  if (!sanitized) {
    throw new GeminiSafetyError(
      'Your request could not be processed. Please describe the furniture you want.'
    );
  }

  return { safe: flags.length === 0, flags, sanitizedPrompt: sanitized };
}

// ── Image guardrails ──────────────────────────────────────────────────────────

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function checkImageGuardrails(
  base64: string,
  mimeType: string
): void {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new GeminiSafetyError('Only JPEG, PNG, and WebP images are supported.');
  }

  const estimatedBytes = base64.length * 0.75;
  if (estimatedBytes > MAX_IMAGE_BYTES) {
    throw new GeminiSafetyError('Image must be 10 MB or smaller.');
  }
}

// ── Output guardrails ─────────────────────────────────────────────────────────

/**
 * Ensures Gemini output doesn't contain actual SQL statements.
 * Requires full SQL syntax (verb + clause) to reduce false positives on words
 * like "select pieces" or "insert warmth" in natural-language output.
 */
export function checkOutputGuardrails(output: string): void {
  const SQL_PATTERNS = [
    /\bSELECT\s+[\w*,\s]+\s+FROM\s+\w+/i,
    /\bINSERT\s+INTO\s+\w+/i,
    /\bUPDATE\s+\w+\s+SET\s+/i,
    /\bDELETE\s+FROM\s+\w+/i,
    /\bDROP\s+(TABLE|DATABASE|SCHEMA)\s+/i,
    /\bCREATE\s+(TABLE|DATABASE|SCHEMA)\s+/i,
    /\bALTER\s+TABLE\s+\w+/i,
  ];

  for (const pattern of SQL_PATTERNS) {
    if (pattern.test(output)) {
      throw new GeminiSafetyError('Unexpected SQL detected in AI output.');
    }
  }
}
