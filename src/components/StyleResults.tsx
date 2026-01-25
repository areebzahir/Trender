import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Palette, Home, Package, Users, Sparkles, ShoppingCart } from "lucide-react";
import { ThemedFluidBlob } from "@/components/ThemedFluidBlob";

interface StyleResultsProps {
  results: Record<string, string>;
  onBack: () => void;
  onContinue: () => void;
  onUploadRoom: () => void;
}

interface ColorSwatch {
  name: string;
  color: string;
  description: string;
}

interface StyleCategory {
  name: string;
  description: string;
  isSelected: boolean;
}

interface Material {
  name: string;
  description: string;
  isSelected: boolean;
}

interface LifestyleOption {
  name: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
}

interface StyleProfile {
  styleName: string;
  styleDescription: string;
  colorPalette: {
    category: string;
    swatches: ColorSwatch[];
  };
  designStyles: StyleCategory[];
  materials: Material[];
  lifestyleFit: LifestyleOption[];
}

export const StyleResults = ({ results, onBack, onContinue, onUploadRoom }: StyleResultsProps) => {
  const [isVisible, setIsVisible] = useState(false);

  // Animation trigger
  useState(() => {
    setTimeout(() => setIsVisible(true), 100);
  });

  // Generate style profile based on quiz results
  const generateStyleProfile = (results: Record<string, string>): StyleProfile => {
    const colorChoice = results.colors || 'warm';
    const styleChoice = results.style || 'modern';
    const materialChoice = results.materials || 'wood';
    const lifestyleChoice = results.lifestyle || 'relaxation';

    console.log('Quiz results:', results); // Debug log to see actual results

    // Determine style name based on combinations
    let styleName = "Modern Minimalist";
    let styleDescription = "Your style blends clean lines with functional beauty.";

    if (colorChoice === 'warm' && styleChoice === 'scandinavian') {
      styleName = "Scandinavian Zen Escape";
      styleDescription = "Your style blends the clean lines and functionality of Scandinavian design with the peaceful, mindful elements of zen aesthetics. You appreciate natural materials, neutral tones, and spaces that promote tranquility and well-being.";
    } else if (colorChoice === 'neutral' && styleChoice === 'modern') {
      styleName = "Contemporary Serenity";
      styleDescription = "You gravitate toward sophisticated, uncluttered spaces with a focus on quality materials and timeless design. Your aesthetic is refined yet comfortable.";
    } else if (colorChoice === 'bold' && styleChoice === 'bohemian') {
      styleName = "Eclectic Wanderer";
      styleDescription = "Your space tells a story through vibrant colors, unique textures, and collected treasures. You create environments that are both inspiring and deeply personal.";
    } else if (styleChoice === 'industrial') {
      styleName = "Urban Industrial";
      styleDescription = "You appreciate the raw beauty of exposed materials, clean geometry, and functional design. Your style combines modern comfort with urban edge.";
    }

    // Color palette based on choices
    const colorPalettes = {
      warm: {
        category: "Warm & Earthy",
        swatches: [
          { name: "Terracotta", color: "#CD853F", description: "Warm and grounding" },
          { name: "Sage Green", color: "#9CAF88", description: "Natural and calming" },
          { name: "Cream", color: "#F5F5DC", description: "Soft and inviting" },
          { name: "Rust Orange", color: "#B7410E", description: "Energetic accent" },
          { name: "Warm Gray", color: "#8B8680", description: "Sophisticated neutral" }
        ]
      },
      cool: {
        category: "Cool & Calm",
        swatches: [
          { name: "Soft White", color: "#F8F9FA", description: "Pure and clean" },
          { name: "Light Gray", color: "#E9ECEF", description: "Serene base" },
          { name: "Charcoal", color: "#495057", description: "Grounding accent" },
          { name: "Dusty Blue", color: "#8FA8B2", description: "Peaceful touch" },
          { name: "Natural Beige", color: "#E5D5C8", description: "Warm foundation" }
        ]
      },
      neutral: {
        category: "Neutral & Minimal",
        swatches: [
          { name: "Pure White", color: "#FFFFFF", description: "Clean and minimal" },
          { name: "Soft Beige", color: "#F5F5DC", description: "Gentle warmth" },
          { name: "Light Taupe", color: "#D2B48C", description: "Natural elegance" },
          { name: "Warm Ivory", color: "#FFFFF0", description: "Cozy simplicity" },
          { name: "Mushroom", color: "#C0A080", description: "Grounded neutral" }
        ]
      },
      bold: {
        category: "Bold & Vibrant",
        swatches: [
          { name: "Deep Teal", color: "#2D5F5D", description: "Rich and luxurious" },
          { name: "Burnt Orange", color: "#FF8A33", description: "Energetic focal" },
          { name: "Golden Yellow", color: "#FFD60A", description: "Bright and cheerful" },
          { name: "Plum Purple", color: "#7209B7", description: "Bold statement" },
          { name: "Forest Green", color: "#2D6A4F", description: "Natural depth" }
        ]
      }
    };

    return {
      styleName,
      styleDescription,
      colorPalette: colorPalettes[colorChoice as keyof typeof colorPalettes] || colorPalettes.warm,
      designStyles: [
        { name: "Modern Minimalist", description: "Clean lines and uncluttered spaces", isSelected: styleChoice === 'modern' },
        { name: "Scandinavian Cozy", description: "Hygge-inspired comfort and warmth", isSelected: styleChoice === 'scandinavian' },
        { name: "Bohemian Eclectic", description: "Mix of patterns and global influences", isSelected: styleChoice === 'bohemian' },
        { name: "Industrial Chic", description: "Raw materials and urban aesthetics", isSelected: styleChoice === 'industrial' }
      ],
      materials: [
        { name: "Natural Wood", description: "Light oak and birch finishes", isSelected: materialChoice === 'natural' },
        { name: "Soft Textiles", description: "Linen, wool, and organic cotton", isSelected: materialChoice === 'fabric' },
        { name: "Metal & Glass", description: "Brushed steel and clear glass", isSelected: materialChoice === 'metal' },
        { name: "Mixed Materials", description: "Combination of textures and finishes", isSelected: materialChoice === 'mixed' }
      ],
      lifestyleFit: [
        {
          name: "Peaceful Retreat",
          description: "A sanctuary for relaxation and mindfulness",
          icon: <Home className="w-5 h-5" />,
          isSelected: lifestyleChoice === 'relaxing'
        },
        {
          name: "Productive Workspace",
          description: "Clean, organized space for focus and creativity",
          icon: <Package className="w-5 h-5" />,
          isSelected: lifestyleChoice === 'working'
        },
        {
          name: "Entertaining Guests",
          description: "Welcoming space for social gatherings",
          icon: <Users className="w-5 h-5" />,
          isSelected: lifestyleChoice === 'entertaining'
        },
        {
          name: "Family Living",
          description: "Functional space for daily family life",
          icon: <Home className="w-5 h-5" />,
          isSelected: lifestyleChoice === 'family'
        }
      ]
    };
  };

  const styleProfile = generateStyleProfile(results);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Themed Fluid Blob Background */}
              <ThemedFluidBlob />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-50/80 to-amber-50/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <Badge variant="secondary" className="mb-6 text-sm font-medium bg-[#FF8A33]/10 text-[#FF8A33] border-[#FF8A33]/20 animate-pulse">
                Your Style Profile
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
                {styleProfile.styleName}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {styleProfile.styleDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Quiz
        </button>
      </div>

      {/* Style Breakdown Section */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-6xl mx-auto space-y-12">

          {/* Color Palette */}
          <div className={`transform transition-all duration-1000 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className="overflow-hidden bg-white/90 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all duration-500">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#FF8A33]/10 rounded-lg">
                    <Palette className="w-6 h-6 text-[#FF8A33]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Color Palette</CardTitle>
                    <p className="text-muted-foreground mt-1">{styleProfile.colorPalette.category}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {styleProfile.colorPalette.swatches.map((swatch, index) => (
                    <div key={index} className="text-center group">
                      <div
                        className="w-full h-20 rounded-lg mb-3 border border-border shadow-sm group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 cursor-pointer"
                        style={{ backgroundColor: swatch.color }}
                      />
                      <h4 className="font-medium text-sm text-foreground">{swatch.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{swatch.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Design Style */}
          <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all duration-500">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#FF8A33]/10 rounded-lg">
                    <Home className="w-6 h-6 text-[#FF8A33]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Design Style</CardTitle>
                    <p className="text-muted-foreground mt-1">Your aesthetic preferences</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {styleProfile.designStyles.map((style, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border transition-all duration-300 hover:scale-105 ${style.isSelected
                        ? 'bg-[#FF8A33]/5 border-[#FF8A33]/20 shadow-md'
                        : 'bg-muted/30 border-border opacity-60 hover:opacity-80'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-foreground">{style.name}</h4>
                        {style.isSelected && (
                          <Badge className="text-xs bg-[#FF8A33] text-white hover:bg-[#E6661A]">Selected</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{style.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Materials */}
          <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all duration-500">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#FF8A33]/10 rounded-lg">
                    <Package className="w-6 h-6 text-[#FF8A33]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Materials</CardTitle>
                    <p className="text-muted-foreground mt-1">Your preferred textures and finishes</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {styleProfile.materials.map((material, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border transition-all duration-300 hover:scale-105 ${material.isSelected
                        ? 'bg-[#FF8A33]/5 border-[#FF8A33]/20 shadow-md'
                        : 'bg-muted/30 border-border opacity-60 hover:opacity-80'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-foreground">{material.name}</h4>
                        {material.isSelected && (
                          <Badge className="text-xs bg-[#FF8A33] text-white hover:bg-[#E6661A]">Preferred</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{material.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lifestyle Fit */}
          <div className={`transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all duration-500">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#FF8A33]/10 rounded-lg">
                    <Users className="w-6 h-6 text-[#FF8A33]" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Lifestyle Fit</CardTitle>
                    <p className="text-muted-foreground mt-1">How you use your space</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {styleProfile.lifestyleFit.map((lifestyle, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border transition-all duration-300 hover:scale-105 ${lifestyle.isSelected
                        ? 'bg-[#FF8A33]/5 border-[#FF8A33]/20 shadow-md'
                        : 'bg-muted/30 border-border opacity-60 hover:opacity-80'
                        }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-md ${lifestyle.isSelected ? 'bg-[#FF8A33]/10 text-[#FF8A33]' : 'bg-muted text-muted-foreground'
                          }`}>
                          {lifestyle.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-foreground">{lifestyle.name}</h4>
                            {lifestyle.isSelected && (
                              <Badge className="text-xs bg-[#FF8A33] text-white hover:bg-[#E6661A]">Match</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground ml-11">{lifestyle.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className={`transform transition-all duration-1000 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={onContinue}
                    size="lg"
                    className="bg-[#FF8A33] hover:bg-[#E6661A] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Start Shopping
                  </Button>
                  <Button
                    onClick={onUploadRoom}
                    variant="outline"
                    size="lg"
                    className="border-[#FF8A33]/20 text-[#FF8A33] hover:bg-[#FF8A33]/5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Upload Your Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};