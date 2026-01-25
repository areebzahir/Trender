import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Heart, X, Star, ChevronUp, ChevronDown, RotateCcw, ExternalLink, ShoppingCart, Share2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useWishlistStore, WishlistItem } from './WishlistStore';
import { sampleFurniture } from '@/data/sampleFurniture';

interface RoomData {
  image: File | null;
  preferences: string;
  specific?: string;
  quizResults?: Record<string, string>;
}

interface TrenderSwipeScreenProps {
  onBack: () => void;
  onGoToEnhancedSwipe: () => void;
  roomData: RoomData | null;
}

const TrenderSwipeScreen: React.FC<TrenderSwipeScreenProps> = ({ onBack, onGoToEnhancedSwipe, roomData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDetailView, setIsDetailView] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [interestScore, setInterestScore] = useState(0);
  const { add: addToWishlist } = useWishlistStore();

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const constraintsRef = useRef(null);

  const currentItem = sampleFurniture[currentIndex];

  if (!currentItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-orange-900 mb-4">That's all for now!</h2>
          <Button onClick={onBack} className="bg-gradient-to-r from-orange-500 to-amber-500">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 150;

    if (info.offset.x > threshold) {
      // Swipe right - Add to wishlist
      handleLike();
    } else if (info.offset.x < -threshold) {
      // Swipe left - Skip
      handleSkip();
    } else if (info.offset.y < -100) {
      // Swipe up - Style Match
      handleStyleMatch();
    } else if (info.offset.y > 100) {
      // Swipe down - Show details
      setIsDetailView(true);
    } else {
      // Reset position
      x.set(0);
    }
  };

  const handleLike = () => {
    const wishlistItem: WishlistItem = {
      id: currentItem.id,
      image: currentItem.images[0],
      title: currentItem.name,
      brand: 'Premium Collection',
      price: currentItem.price,
      tags: currentItem.style,
      link: currentItem.buyLink,
      category: currentItem.category
    };

    addToWishlist(wishlistItem);
    nextCard();
  };

  const handleSkip = () => {
    nextCard();
  };

  const handleStyleMatch = () => {
    // Instant buy/style match action
    console.log('Style Match!', currentItem.name);
    nextCard();
  };

  const nextCard = () => {
    x.set(0);
    setIsDetailView(false);
    setSelectedVariant(0);
    setCurrentIndex(prev => prev + 1);
    setInterestScore(0);
  };

  const calculateMatchScore = () => {
    return Math.floor(Math.random() * 20) + 80; // 80-99% match
  };

  const incrementInterest = () => {
    setInterestScore(prev => Math.min(prev + 10, 100));
  };

  const getDimensionsString = (dimensions: any): string => {
    if (typeof dimensions === 'string') {
      return dimensions;
    }
    if (dimensions && typeof dimensions === 'object') {
      return `${dimensions.width || ''} x ${dimensions.height || ''} x ${dimensions.depth || ''}`.trim();
    }
    return 'N/A';
  };

  const getColorValue = (color: any): string => {
    if (typeof color === 'string') {
      if (color.toLowerCase().includes('white')) return '#ffffff';
      if (color.toLowerCase().includes('black')) return '#000000';
      if (color.toLowerCase().includes('brown')) return '#8B4513';
      if (color.toLowerCase().includes('gray') || color.toLowerCase().includes('grey')) return '#808080';
      return '#D3D3D3';
    }
    if (color && typeof color === 'object' && color.hex) {
      return color.hex;
    }
    return '#D3D3D3';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between bg-white/80 backdrop-blur-md">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-orange-700 hover:bg-orange-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center">
          <h1 className="text-xl font-bold text-orange-900">Trender</h1>
          <p className="text-xs text-orange-600">{currentIndex + 1} of {sampleFurniture.length}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoToEnhancedSwipe}
          className="text-orange-700 hover:bg-orange-100"
        >
          Wishlist
        </Button>
      </div>

      {/* Main Card Container */}
      <div ref={constraintsRef} className="flex items-center justify-center min-h-screen p-4 pt-20">
        <motion.div
          className="relative w-full max-w-sm"
          style={{ x, rotate, opacity }}
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 0.95 }}
          onClick={incrementInterest}
        >
          <Card className="w-full h-[600px] bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden border-0">
            {/* Hero Image */}
            <div className="relative h-64 overflow-hidden group">
              <img
                src={currentItem.images[selectedVariant] || currentItem.images[0]}
                alt={currentItem.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Trending Badge */}
              <Badge className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                🔥 Trending
              </Badge>

              {/* Match Score */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-sm font-bold text-green-600">{calculateMatchScore()}% Match</span>
              </div>

              {/* Rotation Icon */}
              <motion.div
                className="absolute bottom-3 right-3 bg-black/50 text-white p-2 rounded-full cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RotateCcw className="w-4 h-4" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">{currentItem.name}</h2>
                  <p className="text-orange-600 font-medium">Premium Collection</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {getDimensionsString(currentItem.dimensions)} · {Array.isArray(currentItem.materials) ? currentItem.materials.join(', ') : currentItem.materials}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">${currentItem.price}</div>
                  <p className="text-xs text-gray-500">CAD</p>
                </div>
              </div>

              {/* Color Variants */}
              {currentItem.colorOptions && currentItem.colorOptions.length > 1 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Available Colors:</p>
                  <div className="flex gap-2">
                    {currentItem.colorOptions.map((color, index) => (
                      <motion.button
                        key={index}
                        className={`w-8 h-8 rounded-full border-2 ${selectedVariant === index ? 'border-orange-500' : 'border-gray-300'
                          }`}
                        style={{ backgroundColor: getColorValue(color) }}
                        onClick={() => setSelectedVariant(index)}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Style Match Explanation */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800">
                  <span className="font-semibold">Why this matches you:</span> You've been swiping on {currentItem.style.join(', ').toLowerCase()} pieces and warm color palettes — this furniture fits your curated aesthetic perfectly.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  onClick={handleSkip}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5" />
                  Pass
                </motion.button>

                <motion.button
                  onClick={handleLike}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.95 }}
                >
                  <Heart className="w-5 h-5" />
                  Love
                </motion.button>

                <motion.button
                  onClick={handleStyleMatch}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.95 }}
                >
                  <Star className="w-5 h-5" />
                  Match
                </motion.button>
              </div>
            </div>
          </Card>

          {/* Swipe Indicators */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex gap-4 text-center">
            <div className="flex flex-col items-center space-y-1">
              <ChevronUp className="w-6 h-6 text-orange-500" />
              <span className="text-xs text-gray-600">Style Match</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <div className="flex gap-2">
                <X className="w-6 h-6 text-gray-400" />
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <span className="text-xs text-gray-600">Swipe to decide</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <ChevronDown className="w-6 h-6 text-blue-500" />
              <span className="text-xs text-gray-600">More Details</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detail View Modal */}
      {isDetailView && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
          onClick={() => setIsDetailView(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">{currentItem.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDetailView(false)}
                  className="text-gray-500"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Image Gallery */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Gallery</h4>
                <div className="grid grid-cols-2 gap-3">
                  {currentItem.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${currentItem.name} view ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Specifications</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="font-medium">{getDimensionsString(currentItem.dimensions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Materials:</span>
                    <span className="font-medium">{Array.isArray(currentItem.materials) ? currentItem.materials.join(', ') : currentItem.materials}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Style:</span>
                    <span className="font-medium">{Array.isArray(currentItem.style) ? currentItem.style.join(', ') : currentItem.style}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-medium">⭐ {currentItem.rating}/5</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {currentItem.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                  onClick={() => window.open(currentItem.buyLink, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Store
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                  onClick={handleLike}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Wishlist
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default TrenderSwipeScreen;