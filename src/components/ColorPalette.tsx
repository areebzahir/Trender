import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

// ─── Legacy interface (backward-compatible) ───────────────────────────────────

interface ColorOption {
  name: string;
  hex?: string;
  image?: string;
}

interface ColorPaletteProps {
  /** Legacy prop: array of colour options or strings */
  colors?: (ColorOption | string)[];
  selectedColor?: string;
  onColorSelect?: (color: ColorOption | string) => void;
  showImages?: boolean;
  /** New AI flow: recommended palette from RoomAnalysis */
  recommendedPalette?: string[];
  /** New AI flow: detected colours from RoomAnalysis */
  detectedColors?: string[];
}

// ─── CSS named colour lookup ──────────────────────────────────────────────────

const CSS_COLOR_MAP: Record<string, string> = {
  // Neutrals
  white: '#FFFFFF', 'warm white': '#FFF8F0', cream: '#FFFDD0', ivory: '#FFFFF0',
  beige: '#F5F5DC', linen: '#FAF0E6', 'warm beige': '#F5E6D3',
  grey: '#808080', gray: '#808080', 'light grey': '#D3D3D3', 'dark grey': '#A9A9A9',
  charcoal: '#36454F', black: '#000000',
  // Browns / woods
  brown: '#A52A2A', tan: '#D2B48C', taupe: '#483C32',
  walnut: '#5C4033', oak: '#C19A6B', 'natural wood': '#DEB887',
  'dark brown': '#654321', 'warm brown': '#8B6914',
  // Warm tones
  terracotta: '#E2725B', rust: '#B7410E', orange: '#FFA500',
  amber: '#FFBF00', gold: '#FFD700', brass: '#B5A642',
  // Cool tones
  blue: '#0000FF', 'light blue': '#ADD8E6', navy: '#000080',
  teal: '#008080', 'sage green': '#B2AC88', sage: '#BCB88A',
  green: '#008000', 'olive green': '#6B8E23', olive: '#808000',
  mint: '#98FF98', 'forest green': '#228B22',
  // Pinks / purples
  pink: '#FFC0CB', blush: '#DE5D83', rose: '#FF007F',
  lavender: '#E6E6FA', purple: '#800080',
  // Metallics
  silver: '#C0C0C0', chrome: '#DBE9F4', copper: '#B87333',
  // Misc
  natural: '#F5F5DC', 'warm white': '#FFF8F0', 'cool white': '#F0F8FF',
};

function resolveColor(name: string): string {
  const lower = name.toLowerCase().trim();
  return CSS_COLOR_MAP[lower] ?? '#CCCCCC';
}

// ─── Swatch sub-component ─────────────────────────────────────────────────────

const ColorSwatch = ({ name, hex }: { name: string; hex: string }) => (
  <div className="flex flex-col items-center gap-1.5 min-w-[56px]">
    <div
      className="w-10 h-10 rounded-full border-2 border-white shadow-md flex-shrink-0"
      style={{ backgroundColor: hex }}
      title={name}
    />
    <span className="text-[10px] text-[#A5846E] text-center leading-tight max-w-[56px] truncate capitalize">
      {name}
    </span>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const ColorPalette = ({
  colors,
  selectedColor,
  onColorSelect,
  showImages = false,
  recommendedPalette,
  detectedColors,
}: ColorPaletteProps) => {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  // ── New AI flow: two-row palette display ──────────────────────────────────
  if (recommendedPalette !== undefined || detectedColors !== undefined) {
    return (
      <div className="space-y-5">
        {recommendedPalette && recommendedPalette.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#A5846E] uppercase tracking-wider mb-3">
              Recommended for your room
            </p>
            <div className="flex flex-wrap gap-4">
              {recommendedPalette.map((name) => (
                <ColorSwatch key={name} name={name} hex={resolveColor(name)} />
              ))}
            </div>
          </div>
        )}

        {detectedColors && detectedColors.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#A5846E] uppercase tracking-wider mb-3">
              Detected in your room
            </p>
            <div className="flex flex-wrap gap-4">
              {detectedColors.map((name) => (
                <ColorSwatch key={name} name={name} hex={resolveColor(name)} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Legacy flow: selectable colour buttons ────────────────────────────────
  const legacyColors = colors ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {legacyColors.map((color) => {
          const colorName = typeof color === 'string' ? color : color.name;
          const colorHex =
            typeof color === 'string'
              ? resolveColor(color)
              : color.hex ?? resolveColor(color.name);
          const colorImage = typeof color === 'string' ? '' : color.image ?? '';

          return (
            <Button
              key={colorName}
              variant="outline"
              size="sm"
              className={`relative p-2 h-auto flex items-center gap-2 transition-all ${
                selectedColor === colorName
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => onColorSelect?.(colorName)}
              onMouseEnter={() => setHoveredColor(colorName)}
              onMouseLeave={() => setHoveredColor(null)}
            >
              <div
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: colorHex }}
              />
              <span className="text-sm">{colorName}</span>
              {selectedColor === colorName && <Check className="w-3 h-3 text-primary" />}
            </Button>
          );
        })}
      </div>

      {showImages && hoveredColor && (
        <div className="mt-3">
          {legacyColors.map((color) => {
            const colorName = typeof color === 'string' ? color : color.name;
            const colorImage = typeof color === 'string' ? '' : color.image ?? '';

            return (
              colorName === hoveredColor &&
              showImages &&
              colorImage && (
                <div key={colorName} className="relative">
                  <Badge variant="secondary" className="mb-2">
                    {colorName} Preview
                  </Badge>
                  <div className="w-full h-32 rounded-lg overflow-hidden">
                    <img
                      src={colorImage}
                      alt={`${colorName} furniture`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )
            );
          })}
        </div>
      )}
    </div>
  );
};
