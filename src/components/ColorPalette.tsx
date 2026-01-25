import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface ColorOption {
  name: string;
  hex?: string; // Made optional
  image?: string; // Made optional
}

interface ColorPaletteProps {
  colors: (ColorOption | string)[]; // Can now accept string[] or ColorOption[]
  selectedColor?: string;
  onColorSelect?: (color: ColorOption | string) => void; // Adjusted callback type
  showImages?: boolean;
}

export const ColorPalette = ({
  colors,
  selectedColor,
  onColorSelect,
  showImages = false
}: ColorPaletteProps) => {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const colorName = typeof color === 'string' ? color : color.name;
          const colorHex = typeof color === 'string' ? '#CCCCCC' : (color.hex || '#CCCCCC'); // Default hex for string colors
          const colorImage = typeof color === 'string' ? '' : (color.image || ''); // Default empty image for string colors
          
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
              {selectedColor === colorName && (
                <Check className="w-3 h-3 text-primary" />
              )}
            </Button>
          );
        })}
      </div>

      {showImages && hoveredColor && (
        <div className="mt-3">
          {colors.map((color) => {
            const colorName = typeof color === 'string' ? color : color.name;
            const colorImage = typeof color === 'string' ? '' : (color.image || '');

            return (
              colorName === hoveredColor && showImages && colorImage && (
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