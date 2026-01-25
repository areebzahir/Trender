import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  X, 
  Star, 
  Palette, 
  Ruler, 
  ExternalLink,
  ArrowLeft,
  Sparkles,
  ShoppingCart,
  Eye
} from "lucide-react";
import { sampleFurniture, type FurnitureItem } from "@/data/sampleFurniture";
import { useToast } from "@/hooks/use-toast";

interface SwipeInterfaceProps {
  onBack: () => void;
  roomData: { image: File | null; preferences: string; specific?: string };
}

export const SwipeInterface = ({ onBack, roomData }: SwipeInterfaceProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<FurnitureItem[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentItem = sampleFurniture[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentItem) return;

    setSwipeDirection(direction);
    
    if (direction === 'right') {
      setMatches(prev => [...prev, currentItem]);
      toast({
        title: "✨ It's a match!",
        description: `${currentItem.name} added to your favorites`,
      });
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
    }, 300);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      setDragOffset({ x: deltaX, y: deltaY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (Math.abs(dragOffset.x) > 100) {
        handleSwipe(dragOffset.x > 0 ? 'right' : 'left');
      }
      setDragOffset({ x: 0, y: 0 });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (currentIndex >= sampleFurniture.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto p-8 text-center bg-gradient-card">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            You've seen it all!
          </h2>
          <p className="text-muted-foreground mb-6">
            You've swiped through all available furniture. Check out your matches or start over!
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => setShowMatches(true)} 
              className="w-full" 
              variant="hero"
            >
              View My Matches ({matches.length})
            </Button>
            <Button 
              onClick={() => setCurrentIndex(0)} 
              variant="outline" 
              className="w-full"
            >
              Start Over
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (showMatches) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setShowMatches(false)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Swiping
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Your Matches ({matches.length})
            </h1>
            <div></div>
          </div>

          {matches.length === 0 ? (
            <Card className="p-8 text-center">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No matches yet</h2>
              <p className="text-muted-foreground mb-4">Start swiping to find furniture you love!</p>
              <Button onClick={() => setShowMatches(false)} variant="hero">
                Start Swiping
              </Button>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-warm transition-shadow">
                  <div className="aspect-square overflow-hidden">
                    <img 
                      src={item.images[0]} 
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-1">{item.name}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{item.brand}</p>
                    <p className="text-lg font-bold text-primary mb-3">${item.price}</p>
                    <Button 
                      size="sm" 
                      className="w-full" 
                      variant="outline"
                      onClick={() => window.open(item.buyLink, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Shop Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentItem) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="container mx-auto max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {currentIndex + 1} of {sampleFurniture.length}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowMatches(true)}
            className="relative"
          >
            <Heart className="w-4 h-4 mr-2" />
            Matches
            {matches.length > 0 && (
              <Badge className="absolute -top-2 -right-2 px-1 min-w-[1.25rem] h-5">
                {matches.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Swipe Card */}
        <div className="relative h-[600px] mb-6">
          <Card 
            ref={cardRef}
            className={`absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing bg-card shadow-warm transition-all duration-300 ${
              swipeDirection === 'left' ? 'animate-swipe-left' : 
              swipeDirection === 'right' ? 'animate-swipe-right' : ''
            }`}
            style={{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`,
            }}
            onMouseDown={handleMouseDown}
          >
            {/* Image */}
            <div className="relative h-2/3 overflow-hidden">
              <img 
                src={currentItem.images[0]} 
                alt={currentItem.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-card/80 backdrop-blur-sm">
                  {currentItem.category}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{currentItem.name}</h2>
                <p className="text-muted-foreground">{currentItem.brand}</p>
                <p className="text-2xl font-bold text-primary mt-1">${currentItem.price}</p>
              </div>

              {currentItem.whyMatch && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{currentItem.whyMatch}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current text-accent" />
                  {currentItem.rating}
                </div>
                <div className="flex items-center gap-1">
                  <Ruler className="w-4 h-4" />
                  {currentItem.dimensions.width} W
                </div>
                <div className="flex items-center gap-1">
                  <Palette className="w-4 h-4" />
                  {currentItem.colorOptions.length} colors
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleSwipe('left')}
            className="w-16 h-16 rounded-full p-0 hover:bg-destructive/10 hover:border-destructive/50"
          >
            <X className="w-6 h-6 text-destructive" />
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.open(currentItem.buyLink, '_blank')}
            className="w-16 h-16 rounded-full p-0 hover:bg-accent/10 hover:border-accent/50"
          >
            <Eye className="w-6 h-6 text-accent" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => handleSwipe('right')}
            className="w-16 h-16 rounded-full p-0 hover:bg-primary/10 hover:border-primary/50"
          >
            <Heart className="w-6 h-6 text-primary" />
          </Button>
        </div>

        <div className="text-center mt-4">
          <p className="text-xs text-muted-foreground">
            Swipe left to pass • Tap eye to view details • Swipe right to match
          </p>
        </div>
      </div>
    </div>
  );
};