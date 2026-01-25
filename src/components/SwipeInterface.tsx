import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
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
      <div className="min-h-screen relative overflow-hidden">
        {/* Premium Showroom Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F7F4F0] via-[#EDE7DD] to-[#DCD8CF]">
          {/* Ambient Light Orbs - Floating Gently */}
          <motion.div
            className="absolute top-1/6 left-1/5 w-96 h-96 bg-gradient-radial from-[#FCE2D4]/12 to-transparent rounded-full blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <motion.div
            className="absolute top-2/3 right-1/6 w-80 h-80 bg-gradient-radial from-[#EEE6DA]/10 to-transparent rounded-full blur-2xl"
            animate={{
              x: [0, -25, 0],
              y: [0, 15, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />

          <motion.div
            className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gradient-radial from-[#BFB9AE]/8 to-transparent rounded-full blur-2xl"
            animate={{
              x: [0, 20, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
          />

          {/* Subtle Geometric Floating Elements */}
          <motion.div
            className="absolute top-1/4 right-1/3 w-32 h-32 border border-[#BFB9AE]/20 rounded-full"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          <motion.div
            className="absolute bottom-1/3 left-1/6 w-24 h-24 bg-[#DCD8CF]/30 rounded-lg rotate-45"
            animate={{
              rotate: [45, 405],
              y: [0, -20, 0]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Furniture Silhouette Patterns - Very Subtle */}
          <div className="absolute inset-0 opacity-[0.03]">
            <svg className="w-full h-full" viewBox="0 0 1200 800" fill="none">
              {/* Abstract Chair Curves */}
              <motion.path
                d="M200 400 Q250 300 300 400 Q350 500 400 400"
                stroke="#2D1B00"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Abstract Lamp Arcs */}
              <motion.circle
                cx="800"
                cy="200"
                r="60"
                stroke="#2D1B00"
                strokeWidth="1"
                fill="none"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Abstract Table Lines */}
              <motion.rect
                x="600"
                y="600"
                width="120"
                height="20"
                fill="#2D1B00"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
              />
            </svg>
          </div>

          {/* Subtle Texture Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, #DCD8CF 2px, transparent 2px),
                               radial-gradient(circle at 80% 50%, #BFB9AE 1px, transparent 1px)`,
              backgroundSize: '60px 60px, 40px 40px'
            }}
          />
        </div>

        {/* Main Content - Layered above background */}
        <div className="relative z-10 p-6">
          <div className="container mx-auto max-w-6xl">
            {/* Header Section with Back Button and Title */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-between mb-8"
            >
              <Button 
                variant="ghost" 
                onClick={() => setShowMatches(false)}
                className="text-[#A5846E] hover:text-[#2D1B00] hover:bg-[#F4E3E1]/50 transition-all duration-200 rounded-xl backdrop-blur-sm bg-white/60"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Swiping
              </Button>
              
              {/* Premium Title Section */}
              <div className="text-center relative">
                <div className="absolute inset-0 bg-gradient-radial from-[#FCE2D4]/10 to-transparent blur-2xl -z-10" />
                <motion.h1 
                  className="text-3xl lg:text-4xl font-bold text-[#2D1B00] tracking-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  Your Matches
                </motion.h1>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#F76A1C] to-[#F8A87B] rounded-full shadow-lg"
                />
                <div className="mt-3">
                  <Badge variant="secondary" className="bg-white/80 text-[#A5846E] border-[#DCD8CF]/60 px-4 py-1 shadow-sm backdrop-blur-sm">
                    {matches.length} perfect matches
                  </Badge>
                </div>
              </div>
              
              <div className="w-32"></div> {/* Spacer for centering */}
            </motion.div>

            {/* Content Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {matches.length === 0 ? (
                <div className="text-center py-20 relative">
                  <div className="absolute inset-0 bg-gradient-radial from-[#FCE2D4]/5 to-transparent blur-2xl" />
                  <div className="relative z-10">
                    <div className="w-20 h-20 bg-white/80 border border-[#DCD8CF]/60 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg backdrop-blur-sm">
                      <Heart className="w-8 h-8 text-[#A5846E]" />
                    </div>
                    <h2 className="text-2xl font-semibold text-[#2D1B00] mb-2">No matches yet</h2>
                    <p className="text-[#A5846E] mb-6 max-w-md mx-auto">
                      Start swiping to discover furniture pieces that match your style and preferences.
                    </p>
                    <Button 
                      onClick={() => setShowMatches(false)} 
                      className="bg-gradient-to-r from-[#F76A1C] to-[#F8A87B] hover:from-[#F8A87B] hover:to-[#F76A1C] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-3"
                    >
                      Start Swiping
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {matches.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="group"
                      whileHover={{ y: -8 }}
                    >
                      <Card className="h-full bg-white/85 backdrop-blur-md border-[#DCD8CF]/40 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
                        {/* Image Container */}
                        <div className="aspect-square overflow-hidden relative">
                          <img 
                            src={item.images[0]} 
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        
                        {/* Content */}
                        <div className="p-6 space-y-4">
                          {/* Brand */}
                          <Badge variant="outline" className="border-[#DCD8CF]/60 text-[#A5846E] bg-white/60 backdrop-blur-sm">
                            {item.brand}
                          </Badge>
                          
                          {/* Title */}
                          <h3 className="text-xl font-bold text-[#2D1B00] leading-tight group-hover:text-[#F76A1C] transition-colors duration-300">
                            {item.name}
                          </h3>
                          
                          {/* Price */}
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-[#F76A1C] drop-shadow-sm">
                              ${item.price?.toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Action Button */}
                          <Button 
                            className="w-full bg-gradient-to-r from-[#F76A1C] to-[#F8A87B] hover:from-[#F8A87B] hover:to-[#F76A1C] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            onClick={() => window.open(item.buyLink, '_blank')}
                          >
                            <span>Shop Now</span>
                            <motion.div
                              className="ml-2"
                              whileHover={{ x: 4 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </motion.div>
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
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