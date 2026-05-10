/**
 * stitchProductIntoRoom — canvas-based compositor.
 *
 * Takes the room image, removes the product's background using @imgly/background-removal,
 * then places the isolated product into the room with proper shadows and scaling.
 *
 * Runs in the BROWSER (uses HTMLCanvasElement + WASM).
 * No AI generation — pure compositing.
 */

import type { PlacementRecommendation } from '@/lib/room-overlay/types';
import { removeProductBackground } from './removeBackground';

export interface StitchInput {
  /** data URI or URL of the room photo */
  roomImageSrc: string;
  /** URL of the product image */
  productImageSrc: string;
  /** Placement guidance from Gemini (takes priority if provided) */
  placement: PlacementRecommendation | null;
  /** Product category — used to pick a sensible default placement */
  productCategory?: string | null;
}

export interface StitchResult {
  /** data URI of the composited image */
  dataUrl: string;
  width: number;
  height: number;
}

/** Routes external URLs through the local proxy to bypass CORS. */
function toProxiedSrc(src: string): string {
  if (src.startsWith('data:') || src.startsWith('/') || src.startsWith('blob:')) return src;
  return `/api/image-proxy?url=${encodeURIComponent(src)}`;
}

/** Loads an image from a src string. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 80)}`));
    img.src = src;
  });
}

/** Category-specific default placements when Gemini didn't give one. */
function getCategoryPlacement(category: string | null | undefined): PlacementRecommendation {
  const cat = (category ?? '').toLowerCase();

  // Wall-mounted items
  if (cat.includes('mirror') || cat.includes('wall art') || cat.includes('artwork'))
    return { zoneLabel: 'back wall', targetSurface: 'wall',
      xRelative: 0.5, yRelative: 0.35, widthRelative: 0.25, heightRelative: 0.25,
      anchor: 'center', depthLayer: 'midground', reason: 'wall-mounted', risks: [] };

  // Ceiling-mounted
  if (cat.includes('pendant') || cat.includes('chandelier'))
    return { zoneLabel: 'ceiling', targetSurface: 'ceiling',
      xRelative: 0.5, yRelative: 0.15, widthRelative: 0.15, heightRelative: 0.2,
      anchor: 'top-center', depthLayer: 'midground', reason: 'ceiling-mounted', risks: [] };

  // Rugs — flat on floor
  if (cat.includes('rug'))
    return { zoneLabel: 'floor center', targetSurface: 'floor',
      xRelative: 0.5, yRelative: 0.8, widthRelative: 0.55, heightRelative: 0.25,
      anchor: 'bottom-center', depthLayer: 'foreground', reason: 'floor rug', risks: [] };

  // Tables, coffee tables — lower and smaller
  if (cat.includes('coffee_table') || cat.includes('coffee table') || cat.includes('side_table') || cat.includes('side table'))
    return { zoneLabel: 'floor center', targetSurface: 'floor',
      xRelative: 0.5, yRelative: 0.82, widthRelative: 0.3, heightRelative: 0.2,
      anchor: 'bottom-center', depthLayer: 'midground', reason: 'low table', risks: [] };

  // Lamps — floor or side
  if (cat.includes('lamp') || cat.includes('lighting'))
    return { zoneLabel: 'floor corner', targetSurface: 'floor',
      xRelative: 0.22, yRelative: 0.78, widthRelative: 0.12, heightRelative: 0.4,
      anchor: 'bottom-center', depthLayer: 'midground', reason: 'floor lamp', risks: [] };

  // Chairs
  if (cat.includes('chair'))
    return { zoneLabel: 'floor', targetSurface: 'floor',
      xRelative: 0.5, yRelative: 0.8, widthRelative: 0.22, heightRelative: 0.4,
      anchor: 'bottom-center', depthLayer: 'midground', reason: 'chair on floor', risks: [] };

  // Default — sofa-style: against back wall, larger
  return { zoneLabel: 'back wall center', targetSurface: 'floor',
    xRelative: 0.5, yRelative: 0.78, widthRelative: 0.5, heightRelative: 0.35,
    anchor: 'bottom-center', depthLayer: 'midground', reason: 'default floor placement', risks: [] };
}

const DEFAULT_PLACEMENT = getCategoryPlacement(null);

/**
 * Computes the tight bounding box of non-transparent pixels.
 * Uses alpha threshold of 10 (very lenient) to preserve furniture edges.
 */
function getNonTransparentBounds(img: HTMLImageElement): { x: number; y: number; w: number; h: number } {
  const W = img.naturalWidth  || img.width;
  const H = img.naturalHeight || img.height;
  const tmp = document.createElement('canvas');
  tmp.width = W; tmp.height = H;
  const ctx = tmp.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  let minX = W, minY = H, maxX = 0, maxY = 0;
  const data = ctx.getImageData(0, 0, W, H).data;
  // Use step=1 for accuracy on smaller images, step=2 for large ones
  const step = W > 1000 ? 2 : 1;
  // Very low threshold — keep even semi-transparent furniture edges
  const ALPHA_THRESHOLD = 8;

  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const alpha = data[(y * W + x) * 4 + 3];
      if (alpha > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) return { x: 0, y: 0, w: W, h: H };

  // Add a small padding so we don't clip edges
  const pad = Math.max(2, Math.floor(W * 0.005));
  return {
    x: Math.max(0, minX - pad),
    y: Math.max(0, minY - pad),
    w: Math.min(W, maxX - minX + pad * 2),
    h: Math.min(H, maxY - minY + pad * 2),
  };
}

export async function stitchProductIntoRoom(
  input: StitchInput
): Promise<StitchResult> {
  const { roomImageSrc, productImageSrc, placement, productCategory } = input;
  const p = placement ?? getCategoryPlacement(productCategory);

  // Remove product background — get result with quality flag
  let isolatedProductSrc: string;
  let bgRemoved = true;
  try {
    const bgResult = await removeProductBackground(productImageSrc);
    isolatedProductSrc = bgResult.dataUrl;
    bgRemoved = !bgResult.usedFallback;
  } catch {
    console.warn('[stitch] Background removal failed, using original image');
    isolatedProductSrc = productImageSrc;
    bgRemoved = false;
  }

  const [roomImg, productImg] = await Promise.all([
    loadImage(roomImageSrc),
    loadImage(toProxiedSrc(isolatedProductSrc)),
  ]);

  const canvas = document.createElement('canvas');
  const W = roomImg.naturalWidth  || roomImg.width;
  const H = roomImg.naturalHeight || roomImg.height;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw room background
  ctx.drawImage(roomImg, 0, 0, W, H);

  // 2. Compute source bounds — tight crop only if bg was actually removed
  const bounds = bgRemoved
    ? getNonTransparentBounds(productImg)
    : { x: 0, y: 0, w: productImg.naturalWidth || productImg.width, h: productImg.naturalHeight || productImg.height };

  const productAR = bounds.w / bounds.h;

  // 3. Compute target placement box preserving aspect ratio
  let prodW = p.widthRelative  * W;
  let prodH = prodW / productAR;

  // If computed height exceeds the guidance heightRelative, constrain by height instead
  const maxH = p.heightRelative * H;
  if (prodH > maxH * 1.3) {
    prodH = maxH;
    prodW = prodH * productAR;
  }

  // Anchor positioning
  let prodX: number;
  let prodY: number;
  switch (p.anchor) {
    case 'bottom-center':
      prodX = p.xRelative * W - prodW / 2;
      prodY = p.yRelative * H - prodH;
      break;
    case 'center':
      prodX = p.xRelative * W - prodW / 2;
      prodY = p.yRelative * H - prodH / 2;
      break;
    case 'top-center':
      prodX = p.xRelative * W - prodW / 2;
      prodY = p.yRelative * H;
      break;
    case 'left-wall':
      prodX = p.xRelative * W;
      prodY = p.yRelative * H - prodH / 2;
      break;
    case 'right-wall':
      prodX = p.xRelative * W - prodW;
      prodY = p.yRelative * H - prodH / 2;
      break;
    default:
      prodX = p.xRelative * W - prodW / 2;
      prodY = p.yRelative * H - prodH;
  }

  // 4. Draw floor contact shadow FIRST (underneath the product)
  ctx.save();
  ctx.globalAlpha = 0.28;
  const cx = prodX + prodW / 2;
  const cy = prodY + prodH * 0.99;
  const shadowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, prodW * 0.48);
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, prodW * 0.48, prodH * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. Draw product — using the TIGHT bounds so we crop out empty transparent space
  const opacity = p.depthLayer === 'background' ? 0.88
    : p.depthLayer === 'foreground' ? 0.98
    : 0.95;

  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur    = prodW * 0.04;
  ctx.shadowOffsetX = prodW * 0.008;
  ctx.shadowOffsetY = prodH * 0.03;
  ctx.globalAlpha   = opacity;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // If background removal failed (fallback), use multiply blend to soften
  // the product's original background so it blends better with the room
  if (!bgRemoved) {
    ctx.globalCompositeOperation = 'multiply';
  }

  ctx.drawImage(
    productImg,
    bounds.x, bounds.y, bounds.w, bounds.h,
    prodX,    prodY,    prodW,    prodH
  );
  ctx.restore();

  // Output at full quality — PNG preserves transparency, JPEG for final composite
  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.95),
    width: W,
    height: H,
  };
}
