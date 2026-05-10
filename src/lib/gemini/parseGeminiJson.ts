/**
 * parseGeminiJson — parses JSON from Gemini text output with resilient recovery.
 */

import { GeminiResponseParseError } from './geminiErrors';

function stripMarkdownFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim();
}

/**
 * If JSON is truncated mid-structure, try to close it cleanly.
 * Walks the string tracking brackets and strings, then appends missing closers.
 */
function attemptTruncationRepair(raw: string): string {
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];

    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (c === '{' || c === '[') stack.push(c);
    else if (c === '}' && stack[stack.length - 1] === '{') stack.pop();
    else if (c === ']' && stack[stack.length - 1] === '[') stack.pop();
  }

  let repaired = raw;
  // Close any open string
  if (inString) repaired += '"';
  // Strip trailing comma before closing
  repaired = repaired.replace(/,\s*$/, '');
  // Close any unclosed key-value pairs by removing dangling key
  repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*$/, '');
  repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*"[^"]*$/, '');
  // Append missing closers in reverse order
  while (stack.length) {
    const o = stack.pop();
    repaired += o === '{' ? '}' : ']';
  }
  return repaired;
}

export function parseGeminiJson<T = unknown>(raw: string): T {
  if (!raw || typeof raw !== 'string') {
    throw new GeminiResponseParseError('Empty response from Gemini.', raw ?? '');
  }

  const cleaned = stripMarkdownFences(raw);

  // Direct parse
  try {
    return JSON.parse(cleaned) as T;
  } catch { /* fall through */ }

  // Regex match — in case there's prose around the JSON
  const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  const candidate = match ? match[0] : cleaned;

  try {
    return JSON.parse(candidate) as T;
  } catch { /* fall through */ }

  // Strip trailing commas
  try {
    return JSON.parse(candidate.replace(/,(\s*[}\]])/g, '$1')) as T;
  } catch { /* fall through */ }

  // Last resort: attempt truncation repair
  try {
    const repaired = attemptTruncationRepair(candidate);
    return JSON.parse(repaired) as T;
  } catch (err) {
    throw new GeminiResponseParseError(
      `JSON parse failed after all recovery attempts: ${(err as Error).message}`,
      raw.slice(0, 500)
    );
  }
}
