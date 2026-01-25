import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface ColorOption {
  name: string;
  hex: string;
  image: string;
}

interface ColorPaletteProps {
  colors: ColorOption[];
  selectedColor?: string;
  onColorSelect?: (color: ColorOption) => void;
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
        {colors.map((color) => (
          <Button
            key={color.name}
            variant="outline"
            size="sm"
            className={`relative p-2 h-auto flex items-center gap-2 transition-all ${
              selectedColor === color.name 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => onColorSelect?.(color)}
            onMouseEnter={() => setHoveredColor(color.name)}
            onMouseLeave={() => setHoveredColor(null)}
          >
            <div 
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: color.hex }}
            />
            <span className="text-sm">{color.name}</span>
            {selectedColor === color.name && (
              <Check className="w-3 h-3 text-primary" />
            )}
          </Button>
        ))}
      </div>

      {showImages && hoveredColor && (
        <div className="mt-3">
          {colors.map((color) => (
            color.name === hoveredColor && (
              <div key={color.name} className="relative">
                <Badge variant="secondary" className="mb-2">
                  {color.name} Preview
                </Badge>
                <div className="w-full h-32 rounded-lg overflow-hidden">
                  <img 
                    src={color.image} 
                    alt={`${color.name} furniture`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};