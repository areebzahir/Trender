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
  Eye,
  Info,
  MapPin,
  ShoppingCart,
  Zap
} from "lucide-react";
import { ImageCarousel } from "./ImageCarousel";
import { ColorPalette } from "./ColorPalette";
import { ProductDetailModal } from "./ProductDetailModal";
import { type FurnitureItem } from "@/data/sampleFurniture";
import { useToast } from "@/hooks/use-toast";
import { TasteProfileDashboard } from "./TasteProfileDashboard";
import { qlooService, QlooTasteProfile, QlooRecommendation } from "@/services/qlooApi";
import { gptService, GPTExplanation, RoomVisualization } from "@/services/gptService";

interface EnhancedSwipeInterfaceProps {
  onBack: () => void;
  roomData: { image: File | null; preferences: string; specific?: string };
}

interface SwipeHistoryItem {
  item: QlooRecommendation; // Changed from FurnitureItem
  liked: boolean;
  timestamp: Date;
  explanation?: GPTExplanation;
}

export const EnhancedSwipeInterface = ({ onBack, roomData }: EnhancedSwipeInterfaceProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<QlooRecommendation[]>([]); // New state for QLOO recommendations
  const [matches, setMatches] = useState<QlooRecommendation[]>([]); // Changed from FurnitureItem
  const [swipeHistory, setSwipeHistory] = useState<SwipeHistoryItem[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [tasteProfile, setTasteProfile] = useState<QlooTasteProfile | null>(null);
  const [currentExplanation, setCurrentExplanation] = useState<GPTExplanation | null>(null);
  const [currentVisualization, setCurrentVisualization] = useState<RoomVisualization | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentItem = recommendations[currentIndex]; // Use recommendations instead of sampleFurniture

  // Initialize taste profile and fetch recommendations
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        const profile = await qlooService.analyzeTasteProfile(
          roomData.preferences, 
          roomData.image || undefined
        );
        setTasteProfile(profile);

        // Fetch recommendations after taste profile is analyzed
        const fetchedRecommendations = await qlooService.getFurnitureRecommendations(profile);
        setRecommendations(fetchedRecommendations);
      } catch (error) {
        console.error('Error initializing data:', error);
        toast({
          title: "Initialization Error",
          description: "Failed to load data. Using default recommendations.",
          variant: "destructive"
        });
        // Fallback to sampleFurniture if API fails
        // setRecommendations(sampleFurniture as unknown as QlooRecommendation[]); // Removed fallback
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [roomData]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentItem || !tasteProfile) return;

    setSwipeDirection(direction);
    
    const liked = direction === 'right';
    const historyItem: SwipeHistoryItem = {
      item: currentItem,
      liked,
      timestamp: new Date()
    };

    if (liked) {
      setMatches(prev => [...prev, currentItem]);
      
      // Generate explanation for liked items
      try {
        const explanation = await gptService.generateFurnitureExplanation(
          currentItem.name,
          roomData.preferences,
          tasteProfile
        );
        historyItem.explanation = explanation;
      } catch (error) {
        console.error('Error generating explanation:', error);
      }

      toast({
        title: "✨ It's a match!",
        description: `${currentItem.name} added to your favorites`,
      });
    }

    setSwipeHistory(prev => [...prev, historyItem]);

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
    }, 300);
  };

  const handleShowExplanation = async () => {
    if (!currentItem || !tasteProfile) return;

    try {
      const explanation = await gptService.generateFurnitureExplanation(
        currentItem.name,
        roomData.preferences,
        tasteProfile
      );
      setCurrentExplanation(explanation);
      setShowExplanation(true);
    } catch (error) {
      console.error('Error generating explanation:', error);
      toast({
        title: "Error",
        description: "Could not generate explanation",
        variant: "destructive"
      });
    }
  };

  const handleShowVisualization = async () => {
    if (!currentItem) return;

    try {
      const visualization = await gptService.generateRoomVisualization(
        currentItem.name,
        "your uploaded room",
        roomData.preferences
      );
      setCurrentVisualization(visualization);
      setShowVisualization(true);
    } catch (error) {
      console.error('Error generating visualization:', error);
      toast({
        title: "Error",
        description: "Could not generate room visualization",
        variant: "destructive"
      });
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Analyzing Your Taste</h2>
          <p className="text-muted-foreground">Creating your personalized furniture recommendations...</p>
        </div>
      </div>
    );
  }

  // Show taste profile dashboard
  if (showProfile && tasteProfile) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setShowProfile(false)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Swiping
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Your Style DNA</h1>
            <div></div>
          </div>
          
          <TasteProfileDashboard
            tasteProfile={tasteProfile}
            swipeCount={swipeHistory.length}
            matchCount={matches.length}
            onExploreAlternate={() => {
              toast({
                title: "Coming Soon!",
                description: "Alternative aesthetic exploration is in development",
              });
            }}
          />
        </div>
      </div>
    );
  }

  // Show explanation modal
  if (showExplanation && currentExplanation) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setShowExplanation(false)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-foreground">Why This Matches</h1>
            <div></div>
          </div>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{currentItem?.name}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-2">AI Reasoning</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {currentExplanation.reasoning}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Style Match</h3>
                <Badge variant="secondary">{currentExplanation.styleMatch}</Badge>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Personal Note</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {currentExplanation.personalizedNote}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => handleSwipe('right')}
                className="flex-1"
                variant="hero"
              >
                <Heart className="w-4 h-4 mr-2" />
                Add to Matches
              </Button>
              <Button 
                onClick={() => handleSwipe('left')}
                variant="outline"
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Pass
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show room visualization
  if (showVisualization && currentVisualization) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setShowVisualization(false)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-foreground">Room Visualization</h1>
            <div></div>
          </div>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">{currentItem?.name} in Your Space</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-2">Visualization</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {currentVisualization.description}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Placement Suggestions</h3>
                <ul className="space-y-1">
                  {currentVisualization.placementSuggestions.map((suggestion, index) => (
                    <li key={index} className="text-muted-foreground text-sm flex items-start gap-2">
                      <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Color Harmony</h3>
                <p className="text-muted-foreground text-sm">
                  {currentVisualization.colorHarmony}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Style Integration</h3>
                <p className="text-muted-foreground text-sm">
                  {currentVisualization.styleIntegration}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => handleSwipe('right')}
                className="flex-1"
                variant="hero"
              >
                <Heart className="w-4 h-4 mr-2" />
                Love It!
              </Button>
              <Button 
                onClick={() => handleSwipe('left')}
                variant="outline"
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Not For Me
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // End of furniture items
  if (currentIndex >= recommendations.length) { // Use recommendations.length
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto p-8 text-center bg-gradient-card">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Style Journey Complete!
          </h2>
          <p className="text-muted-foreground mb-6">
            You've explored all available furniture. Your taste profile is now fully developed!
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
              onClick={() => setShowProfile(true)} 
              variant="outline" 
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              View Style Profile
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

  // Show matches
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
                    <ImageCarousel 
                      images={item.images} 
                      alt={item.name}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground mb-1">{item.name}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{item.brand}</p>
                    <p className="text-lg font-bold text-primary mb-3">${item.price}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1" 
                        variant="outline"
                        onClick={() => window.open(item.buyLink, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Shop Now
                      </Button>
                      {item.storeLocations && item.storeLocations.length > 0 && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // Handle displaying store locations, e.g., in a modal or new page
                            toast({
                              title: "Store Locations",
                              description: `Opening map for stores near ${item.name}`,
                            });
                            // For now, let's just log the first store location
                            console.log("Store Location:", item.storeLocations[0]);
                            // TODO: Implement actual map integration or detailed store list display
                          }}
                        >
                          <MapPin className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: "Added to Cart!",
                            description: `${item.name} is ready for purchase`,
                          });
                        }}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentItem || !tasteProfile) return null;

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
              {currentIndex + 1} of {recommendations.length} {/* Use recommendations.length */}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowProfile(true)}
            >
              <Sparkles className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowMatches(true)}
              className="relative"
            >
              <Heart className="w-4 h-4 mr-2" />
              {matches.length > 0 && (
                <Badge className="absolute -top-2 -right-2 px-1 min-w-[1.25rem] h-5">
                  {matches.length}
                </Badge>
              )}
            </Button>
          </div>
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
            {/* Image Carousel */}
            <div className="relative h-2/3 overflow-hidden">
              <ImageCarousel 
                images={currentItem.images} 
                alt={currentItem.name}
                className="w-full h-full"
              />
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-card/80 backdrop-blur-sm">
                  {currentItem.category}
                </Badge>
              </div>
              <div className="absolute top-4 left-4 flex gap-2">
                <Button
                  size="sm"
                  variant="swipe"
                  onClick={handleShowExplanation}
                >
                  <Info className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="swipe"
                  onClick={() => setShowProductDetail(true)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{currentItem.name}</h2>
                <p className="text-muted-foreground">{currentItem.brand}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold text-primary">${currentItem.price}</p>
                  {currentItem.originalPrice && (
                    <p className="text-lg text-muted-foreground line-through">${currentItem.originalPrice}</p>
                  )}
                </div>
              </div>

              {currentItem.reasoning && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{currentItem.reasoning}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {currentItem.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current text-accent" />
                      {currentItem.rating} ({currentItem.reviewCount})
                    </div>
                  )}
                  {currentItem.dimensions && (
                    <div className="flex items-center gap-1">
                      <Ruler className="w-4 h-4" />
                      {currentItem.dimensions.width} W
                    </div>
                  )}
                  {currentItem.colorOptions && currentItem.colorOptions.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Palette className="w-4 h-4" />
                      {currentItem.colorOptions.length} colors
                    </div>
                  )}
                </div>

                {currentItem.colorOptions && currentItem.colorOptions.length > 0 && (
                  <ColorPalette 
                    colors={currentItem.colorOptions}
                    showImages={false}
                  />
                )}
                
                {currentItem.buyLink && (
                  <Button 
                    className="w-full"
                    onClick={() => window.open(currentItem.buyLink, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Buy Now
                  </Button>
                )}
                
                {currentItem.storeLocations && currentItem.storeLocations.length > 0 && (
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "Store Locations",
                        description: `Finding stores near you for ${currentItem.name}`,
                      });
                      // TODO: Integrate with a map service or display a list of stores
                      console.log("Store Locations:", currentItem.storeLocations);
                    }}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Find in Stores
                  </Button>
                )}

              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-4">
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
            onClick={handleShowVisualization}
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

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            ❌ Pass • 👁️ Visualize • ❤️ Match
          </p>
        </div>
      </div>

      {/* Product Detail Modal */}
      {showProductDetail && (
        <ProductDetailModal
          item={currentItem}
          onClose={() => setShowProductDetail(false)}
          onLike={() => handleSwipe('right')}
          onBuy={() => {
            toast({
              title: "Redirecting to Store",
              description: `Taking you to purchase ${currentItem.name}`,
            });
            window.open(currentItem.buyLink, '_blank');
          }}
        />
      )}
    </div>
  );
};