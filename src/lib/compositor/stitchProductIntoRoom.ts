/**
 * stitchProductIntoRoom — canvas compositor.
 * Places furniture into a room photo with realistic grounding, shadows, and lighting.
 */

import type { PlacementRecommendation } from '@/lib/room-overlay/types';
import { removeProductBackground } from './removeBackground';

export interface StitchInput {
  roomImageSrc: string;
  productImageSrc: string;
  placement: PlacementRecommendation | null;
  productCategory?: string | null;
}

export interface StitchResult {
  dataUrl: string;
  width: number;
  height: number;
}

function toProxiedSrc(src: string): string {
  if (src.startsWith('data:') || src.startsWith('/') || src.startsWith('blob:')) return src;
  return `/api/image-proxy?url=${encodeURIComponent(src)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src.slice(0, 60)}`));
    img.src = src;
  });
}

/**
 * Category-aware placement.
 * yRelative with bottom-center anchor = where the BOTTOM of the product sits.
 * For floor items this should be at the floor line (~0.70-0.75 for typical room photos).
 */
function getCategoryPlacement(category: string | null | undefined): PlacementRecommendation {
  const cat = (category ?? '').toLowerCase();

  if (cat.includes('mirror') || cat.includes('wall art'))
    return { zoneLabel: 'back wall', targetSurface: 'wall',
      xRelative: 0.5, yRelative: 0.38, widthRelative: 0.22, heightRelative: 0.22,
      anchor: 'center', depthLayer: 'midground', reason: 'wall-mounted', risks: [] };

  if (cat.includes('pendant') || cat.includes('chandelier'))
    return { zoneLabel: 'ceiling', targetSurface: 'ceiling',
      xRelative: 0.5, yRelative: 0.08, widthRelative: 0.14, heightRelative: 0.18,
      anchor: 'top-center', depthLayer: 'midground', reason: 'ceiling', risks: [] };

  if (cat.includes('rug'))
    return { zoneLabel: 'floor center', targetSurface: 'floor',
      xRelative: 0.5, yRelative: 0.82, widthRelative: 0.55, heightRelative: 0.20,
      anchor: 'bottom-center', depthLayer: 'foreground', reason: 'rug', risks: [] };

  if (cat.includes('coffee_table') || cat.includes('coffee table'))
    return { zoneLabel: 'floor center', targetSurface: 'floor',
      xRelative: 0.5, yRelative: 0.78, widthRelative: 0.30, heightRelative: 0.18,
      anchor: 'bottom-center', depthLayer: 'midground', reason: 'coffee table', risks: [] };

  if (cat.includes('side_table') || cat.includes('side table') || cat.includes('nightstand'))
    return { zoneLabel: 'floor side', targetSurface: 'floor',
      xRelative: 0.75, yRelative: 0.74, widthRelative: 0.16, heightRelative: 0.22,
      anchor: 'bottom-center', depthLayer: 'midground', reason: 'side table', risks: [] };

  if (cat.includes('lamp') || cat.includes('lighting'))
    return { zoneLabel: 'floor corner', targetSurface: 'floor',
      xRelative: 0.18, yRelative: 0.72, widthRelative: 0.10, heightRelative: 0.36,
      anchor: 'bottom-center', depthLayer: 'midground', reason: 'lamp', risks: [] };

  if (cat.includes('chair') || cat.includes('armchair'))
    return { zoneLabel: 'floor', targetSurface: 'floor',
      xRelative: 0.5, yRelative: 0.74, widthRelative: 0.22, heightRelative: 0.34,
      anchor: 'bottom-center', depthLayer: 'midground', reason: 'chair', risks: [] };

  if (cat.includes('desk'))
    return { zoneLabel: 'back wall', targetSurface: 'floor',
      xRelative: 0.5, yRelative: 0.72, widthRelative: 0.38, heightRelative: 0.30,
      anchor: 'bottom-center', depthLayer: 'midground', reason: 'desk', risks: [] };

  // Sofa / sectional — large, grounded on floor line
  return { zoneLabel: 'back wall center', targetSurface: 'floor',
    xRelative: 0.5, yRelative: 0.70, widthRelative: 0.65, heightRelative: 0.42,
    anchor: 'bottom-center', depthLayer: 'midground', reason: 'sofa', risks: [] };
}

/**
 * Finds the tight bounding box of non-transparent pixels.
 * Uses a very low alpha threshold to keep furniture edges.
 */
function getNonTransparentBounds(img: HTMLImageElement): { x: number; y: number; w: number; h: number } {
  const W = img.naturalWidth  || img.width;
  const H = img.naturalHeight || img.height;
  const tmp = document.createElement('canvas');
  tmp.width = W; tmp.height = H;
  const ctx = tmp.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, W, H).data;

  let minX = W, minY = H, maxX = 0, maxY = 0;
  const step = W > 1000 ? 2 : 1;

  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4 + 3] > 5) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) return { x: 0, y: 0, w: W, h: H };

  // Generous padding to avoid clipping edges
  const padX = Math.max(4, Math.floor(W * 0.01));
  const padY = Math.max(4, Math.floor(H * 0.01));
  return {
    x: Math.max(0, minX - padX),
    y: Math.max(0, minY - padY),
    w: Math.min(W - Math.max(0, minX - padX), maxX - minX + padX * 2),
    h: Math.min(H - Math.max(0, minY - padY), maxY - minY + padY * 2),
  };
}

/**
 * Draws realistic floor shadow + ambient occlusion under the product.
 * Makes the product look grounded on the floor.
 */
function drawFloorShadow(
  ctx: CanvasRenderingContext2D,
  prodX: number, prodY: number, prodW: number, prodH: number
): void {
  const cx = prodX + prodW / 2;
  const floorY = prodY + prodH; // bottom of product = floor contact

  // Wide elliptical shadow on the floor
  ctx.save();
  ctx.globalAlpha = 0.22;
  const grad = ctx.createRadialGradient(cx, floorY, 0, cx, floorY, prodW * 0.52);
  grad.addColorStop(0,   'rgba(0,0,0,0.65)');
  grad.addColorStop(0.4, 'rgba(0,0,0,0.25)');
  grad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, floorY, prodW * 0.52, prodH * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Narrow contact shadow right at the base — makes it look grounded
  ctx.save();
  ctx.globalAlpha = 0.30;
  const contactGrad = ctx.createLinearGradient(cx, floorY - prodH * 0.04, cx, floorY + prodH * 0.04);
  contactGrad.addColorStop(0, 'rgba(0,0,0,0)');
  contactGrad.addColorStop(0.5, 'rgba(0,0,0,0.4)');
  contactGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = contactGrad;
  ctx.beginPath();
  ctx.ellipse(cx, floorY, prodW * 0.44, prodH * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Applies a subtle warm ambient light overlay on the product
 * to match typical indoor room lighting (warm, slightly bright on top).
 */
function applyAmbientLighting(
  ctx: CanvasRenderingContext2D,
  prodX: number, prodY: number, prodW: number, prodH: number
): void {
  // Subtle top-down warm light — brightens the top of the product
  ctx.save();
  ctx.globalAlpha = 0.06;
  const lightGrad = ctx.createLinearGradient(prodX, prodY, prodX, prodY + prodH);
  lightGrad.addColorStop(0,   'rgba(255,240,200,1)'); // warm white at top
  lightGrad.addColorStop(0.4, 'rgba(255,240,200,0.3)');
  lightGrad.addColorStop(1,   'rgba(0,0,0,0.15)');    // slight darkening at base
  ctx.fillStyle = lightGrad;
  ctx.fillRect(prodX, prodY, prodW, prodH);
  ctx.restore();
}

export async function stitchProductIntoRoom(input: StitchInput): Promise<StitchResult> {
  const { roomImageSrc, productImageSrc, placement, productCategory } = input;
  const p = placement ?? getCategoryPlacement(productCategory);

  // Remove background server-side
  let isolatedSrc: string;
  let bgRemoved = true;
  try {
    const result = await removeProductBackground(productImageSrc);
    isolatedSrc = result.dataUrl;
    bgRemoved = !result.usedFallback;
  } catch {
    isolatedSrc = toProxiedSrc(productImageSrc);
    bgRemoved = false;
  }

  const [roomImg, productImg] = await Promise.all([
    loadImage(roomImageSrc),
    loadImage(bgRemoved ? isolatedSrc : toProxiedSrc(isolatedSrc)),
  ]);

  const W = roomImg.naturalWidth  || roomImg.width;
  const H = roomImg.naturalHeight || roomImg.height;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // ── 1. Draw room ──────────────────────────────────────────────────────────
  ctx.drawImage(roomImg, 0, 0, W, H);

  // ── 2. Source crop ────────────────────────────────────────────────────────
  // For bg-removed images: tight crop to non-transparent pixels
  // For fallback: use full image (no crop)
  const bounds = bgRemoved
    ? getNonTransparentBounds(productImg)
    : { x: 0, y: 0, w: productImg.naturalWidth || productImg.width, h: productImg.naturalHeight || productImg.height };

  const productAR = bounds.w / bounds.h;

  // ── 3. Destination size ───────────────────────────────────────────────────
  // Start from width guidance, derive height from aspect ratio
  let prodW = p.widthRelative * W;
  let prodH = prodW / productAR;

  // Hard minimum: sofa must be at least 50% of room width
  const isSofa = (productCategory ?? '').toLowerCase().includes('sofa') ||
                 (productCategory ?? '').toLowerCase().includes('sectional') ||
                 p.widthRelative >= 0.55;
  const minW = isSofa ? W * 0.50 : W * 0.18;
  if (prodW < minW) { prodW = minW; prodH = prodW / productAR; }

  // Hard maximum: never taller than 55% of room height
  const maxH = H * 0.55;
  if (prodH > maxH) { prodH = maxH; prodW = prodH * productAR; }

  // ── 4. Position (bottom-center on floor line) ─────────────────────────────
  let prodX: number, prodY: number;
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
    default:
      prodX = p.xRelative * W - prodW / 2;
      prodY = p.yRelative * H - prodH;
  }

  // Clamp to canvas — never let product go off-screen
  prodX = Math.max(W * 0.02, Math.min(W - prodW - W * 0.02, prodX));
  prodY = Math.max(H * 0.05, Math.min(H - prodH * 0.85, prodY)); // allow slight bottom clip

  // ── 5. Floor shadow (drawn BEFORE product) ────────────────────────────────
  if (p.targetSurface === 'floor') {
    drawFloorShadow(ctx, prodX, prodY, prodW, prodH);
  }

  // ── 6. Draw product ───────────────────────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.97;
  // Subtle drop shadow for depth
  ctx.shadowColor   = 'rgba(20,10,0,0.20)';
  ctx.shadowBlur    = prodW * 0.03;
  ctx.shadowOffsetX = prodW * 0.005;
  ctx.shadowOffsetY = prodH * 0.02;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(productImg, bounds.x, bounds.y, bounds.w, bounds.h, prodX, prodY, prodW, prodH);
  ctx.restore();

  // ── 7. Ambient lighting overlay ───────────────────────────────────────────
  // Only apply to bg-removed images (clean PNG) — skip for fallback
  if (bgRemoved) {
    applyAmbientLighting(ctx, prodX, prodY, prodW, prodH);
  }

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.95),
    width: W,
    height: H,
  };
}
