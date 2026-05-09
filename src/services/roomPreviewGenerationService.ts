/**
 * roomPreviewGenerationService — server-side service for AI room preview generation.
 *
 * IMPORTANT: This module is intended to run inside Netlify Functions only.
 * It reads API keys from process.env — never from import.meta.env.
 * Do NOT import this file from any client-side component.
 */

export interface PreviewResult {
  previewUrl: string;
  /** true → styled mockup (fallback), false → product-placed composite */
  isFallback: boolean;
}

export interface PreviewError {
  error: string;
}

/**
 * Generates a room preview image using an AI image-generation API.
 *
 * Strategy:
 * 1. Try OpenAI DALL-E 3 image generation with a descriptive prompt.
 *    (True product-image inpainting requires DALL-E edit endpoint with a mask,
 *     which is complex; we use generation as a high-quality fallback.)
 * 2. If OpenAI is unavailable, try Stability AI.
 * 3. If both fail, return { error }.
 *
 * The result is always labelled isFallback: true because we are generating
 * a styled room mockup rather than placing the exact product images.
 * When a true inpainting API becomes available, set isFallback: false.
 */
export async function generateRoomPreview(
  imageBase64: string,
  productImageUrls: string[],
  prompt: string
): Promise<PreviewResult | PreviewError> {
  const productList =
    productImageUrls.length > 0
      ? `incorporating furniture and decor items from the recommended products`
      : '';

  const generationPrompt = `Interior design visualization: ${prompt}. ${productList}. 
Photorealistic room render, professional interior photography, natural lighting, 
high quality, detailed, 8k resolution. Preserve the original room layout and structure.`;

  // ── Try OpenAI DALL-E 3 ──────────────────────────────────────────────────
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: generationPrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          response_format: 'url',
        }),
      });

      if (response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw API response
        const data: any = await response.json();
        const url: string | undefined = data?.data?.[0]?.url;
        if (url) {
          return { previewUrl: url, isFallback: true };
        }
      } else {
        const errText = await response.text();
        console.error(`[roomPreviewGenerationService] OpenAI DALL-E error ${response.status}: ${errText}`);
      }
    } catch (err) {
      console.error('[roomPreviewGenerationService] OpenAI network error:', err);
    }
  }

  // ── Try Stability AI ─────────────────────────────────────────────────────
  const stabilityKey = process.env.STABILITY_API_KEY;
  if (stabilityKey) {
    try {
      const response = await fetch(
        'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${stabilityKey}`,
          },
          body: JSON.stringify({
            text_prompts: [
              { text: generationPrompt, weight: 1 },
              { text: 'blurry, low quality, distorted, ugly, bad anatomy', weight: -1 },
            ],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            steps: 30,
            samples: 1,
          }),
        }
      );

      if (response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw API response
        const data: any = await response.json();
        const base64Image: string | undefined = data?.artifacts?.[0]?.base64;
        if (base64Image) {
          // Return as a data URI — the client can display it directly
          return {
            previewUrl: `data:image/png;base64,${base64Image}`,
            isFallback: true,
          };
        }
      } else {
        const errText = await response.text();
        console.error(`[roomPreviewGenerationService] Stability AI error ${response.status}: ${errText}`);
      }
    } catch (err) {
      console.error('[roomPreviewGenerationService] Stability AI network error:', err);
    }
  }

  return {
    error: 'Room preview generation is temporarily unavailable. Your product recommendations are shown below.',
  };
}
