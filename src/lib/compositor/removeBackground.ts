/**
 * removeBackground — calls the server-side /api/remove-bg endpoint.
 * Returns the image with background removed, plus a usedFallback flag
 * indicating whether the quality check failed and the original was returned.
 */

export interface RemoveBgResult {
  dataUrl: string;
  usedFallback: boolean;
}

// Cache: imageUrl → Promise<RemoveBgResult>
const cache = new Map<string, Promise<RemoveBgResult>>();

export async function removeProductBackground(imageUrl: string): Promise<RemoveBgResult> {
  if (cache.has(imageUrl)) return cache.get(imageUrl)!;

  const promise = (async (): Promise<RemoveBgResult> => {
    console.log('[removeBackground] Requesting for:', imageUrl.slice(0, 80));

    const res = await fetch('/api/remove-bg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error ?? `remove-bg failed: ${res.status}`);
    }

    const json = await res.json();
    if (!json.dataUrl) throw new Error('No dataUrl in remove-bg response');

    console.log(`[removeBackground] ✓ Done. Fallback used: ${json.usedFallback}`);
    return { dataUrl: json.dataUrl as string, usedFallback: Boolean(json.usedFallback) };
  })();

  promise.catch(() => cache.delete(imageUrl));
  cache.set(imageUrl, promise);
  return promise;
}
