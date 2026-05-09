import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Palette, 
  Sparkles, 
  TrendingUp, 
  Eye,
  Heart,
  Layers,
  Zap
} from "lucide-react";

interface StyleProfile {
  styles: string[];
  colors: string[];
  materials: string[];
  brands: string[];
  aesthetics: string[];
  culturalReferences: string[];
}

interface TasteProfileDashboardProps {
  tasteProfile: StyleProfile;
  swipeCount: number;
  matchCount: number;
  onExploreAlternate?: () => void;
}

export const TasteProfileDashboard = ({ 
  tasteProfile, 
  swipeCount, 
  matchCount,
  onExploreAlternate 
}: TasteProfileDashboardProps) => {
  const [evolutionProgress, setEvolutionProgress] = useState(0);

  useEffect(() => {
    // Calculate taste evolution based on swipe activity
    const progress = Math.min((swipeCount / 20) * 100, 100);
    setEvolutionProgress(progress);
  }, [swipeCount]);

  const getConfidenceLevel = () => {
    if (swipeCount < 5) return { level: "Discovering", color: "bg-yellow-500" };
    if (swipeCount < 15) return { level: "Developing", color: "bg-blue-500" };
    return { level: "Refined", color: "bg-green-500" };
  };

  const confidence = getConfidenceLevel();

  return (
    <div className="space-y-6 p-6 bg-gradient-card rounded-xl border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Your Style Profile</h2>
            <p className="text-sm text-muted-foreground">Powered by AI Design Intelligence</p>
          </div>
        </div>
        <Badge variant="secondary" className={`${confidence.color} text-white`}>
          {confidence.level}
        </Badge>
      </div>

      {/* Style Evolution Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Style Evolution</span>
          <span className="text-sm text-muted-foreground">{swipeCount}/20 swipes</span>
        </div>
        <Progress value={evolutionProgress} className="h-2" />
        <p className="text-xs text-muted-foreground">
          Your style profile becomes more accurate with each swipe
        </p>
      </div>

      {/* Style Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Style Preferences</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {tasteProfile.styles.map((style, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {style}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-foreground">Color Palette</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {tasteProfile.colors.map((color, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {color}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-secondary-foreground" />
            <h3 className="font-semibold text-foreground">Materials</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {tasteProfile.materials.map((material, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {material}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary-glow" />
            <h3 className="font-semibold text-foreground">Brand Affinity</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {tasteProfile.brands.slice(0, 3).map((brand, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {brand}
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      {/* Cultural References */}
      {tasteProfile.culturalReferences.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-foreground">Design Influences</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {tasteProfile.culturalReferences.map((ref, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {ref}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{swipeCount}</div>
          <div className="text-xs text-muted-foreground">Items Reviewed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-accent">{matchCount}</div>
          <div className="text-xs text-muted-foreground">Matches</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-secondary-foreground">
            {matchCount > 0 ? Math.round((matchCount / swipeCount) * 100) : 0}%
          </div>
          <div className="text-xs text-muted-foreground">Match Rate</div>
        </div>
      </div>

      {/* Explore Alternatives */}
      {onExploreAlternate && (
        <Button 
          variant="outline" 
          onClick={onExploreAlternate}
          className="w-full"
        >
          <Heart className="w-4 h-4 mr-2" />
          Explore Alternative Aesthetics
        </Button>
      )}
    </div>
  );
};
