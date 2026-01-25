import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { Heart, X, Info, ArrowLeft, Sparkles, Eye, ShoppingBag, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [showDetails, setShowDetails] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [showMatchReason, setShowMatchReason] = useState(false);
  const [cards, setCards] = useState(sampleFurniture.slice(0, 3));
  const { add: addToWishlist } = useWishlistStore();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useTransform(x, [-300, 0, 300], [0.8, 1, 0.8]);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 0.5, 1, 0.5, 0]);

  const controls = useAnimation();
  const constraintsRef = useRef(null);

  const currentItem = cards[0] || sampleFurniture[currentIndex];

  // Auto-show match reason after 2 seconds of viewing
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMatchReason(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Preload next cards
  useEffect(() => {
    const nextCards = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % sampleFurniture.length;
      nextCards.push(sampleFurniture[index]);
    }
    setCards(nextCards);
  }, [currentIndex]);

  if (!currentItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6"
          >
            <Sparkles className="w-16 h-16 mx-auto text-orange-500 mb-4" />
            <h2 className="text-3xl font-bold text-orange-900 mb-2">That's all for now!</h2>
            <p className="text-orange-600">You've discovered all our amazing furniture pieces</p>
          </motion.div>
          <Button
            onClick={onBack}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-3 rounded-2xl font-medium shadow-lg"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 120;
    const velocity = info.velocity.x;

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      if (info.offset.x > 0 || velocity > 0) {
        // Swipe right - Like
        handleLike();
      } else {
        // Swipe left - Pass
        handlePass();
      }
    } else {
      // Snap back to center
      controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        transition: { type: "spring", stiffness: 300, damping: 30 }
      });
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

    // Animate card out to the right
    controls.start({
      x: 400,
      rotate: 20,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }).then(() => {
      nextCard();
    });
  };

  const handlePass = () => {
    // Animate card out to the left
    controls.start({
      x: -400,
      rotate: -20,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }).then(() => {
      nextCard();
    });
  };

  const nextCard = () => {
    setCurrentIndex(prev => prev + 1);
    setShowDetails(false);
    setSelectedColorIndex(0);
    setShowMatchReason(false);

    // Reset card position for next card
    x.set(0);
    y.set(0);
    controls.set({ x: 0, y: 0, rotate: 0, opacity: 1 });
  };

  const calculateMatchScore = () => {
    return Math.floor(Math.random() * 15) + 85; // 85-99% match for premium feel
  };

  const getMatchReason = () => {
    const reasons = [
      "Matches your modern minimalist style",
      "Perfect for your living room size",
      "Complements your neutral color palette",
      "Fits your contemporary aesthetic",
      "Ideal for your space layout",
      "Aligns with your comfort preferences"
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  };

  const getAvailableColors = () => {
    const colors = currentItem.colorOptions || [
      { name: 'Charcoal', hex: '#36454F' },
      { name: 'Cream', hex: '#F5F5DC' },
      { name: 'Mocha', hex: '#967969' }
    ];
    return Array.isArray(colors) ? colors.map(color => ({ name: color.name, value: color.hex })) : [colors];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">
      {/* Floating Header */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <motion.button
          onClick={onBack}
          className="p-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:bg-white/90 transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5 text-orange-700" />
        </motion.button>

        <motion.div
          className="flex-1 text-center px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-xl font-bold text-orange-900">Trender</h1>
          <p className="text-xs text-orange-600 mt-1">{currentIndex + 1} of {sampleFurniture.length}</p>
        </motion.div>

        <motion.button
          onClick={onGoToEnhancedSwipe}
          className="p-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:bg-white/90 transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ShoppingBag className="w-5 h-5 text-orange-700" />
        </motion.button>
      </div>

      {/* Horizontal Card Carousel Container */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-20 pb-32">
        <div className="relative w-full max-w-sm mx-auto">

          {/* Background Cards Stack (T-Layout) */}
          {cards.slice(1, 3).map((item, index) => (
            <motion.div
              key={`bg-${item.id}-${index}`}
              className="absolute inset-0 w-full"
              initial={{ scale: 0.9 - (index * 0.05), y: 8 + (index * 8), opacity: 0.6 - (index * 0.2) }}
              animate={{ scale: 0.9 - (index * 0.05), y: 8 + (index * 8), opacity: 0.6 - (index * 0.2) }}
              style={{ zIndex: 10 - index }}
            >
              <div className="w-full h-[520px] bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg" />
            </motion.div>
          ))}

          {/* Main Interactive Card */}
          <motion.div
            ref={constraintsRef}
            className="relative w-full z-20"
            drag="x"
            dragConstraints={{ left: -300, right: 300 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            animate={controls}
            style={{ x, y, scale, rotate, opacity }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Neumorphic Card */}
            <div className="w-full h-[520px] bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-[8px_8px_24px_rgba(0,0,0,0.1),-8px_-8px_24px_rgba(255,255,255,0.9)] border border-white/20 overflow-hidden">

              {/* Hero Image with Overlays */}
              <div className="relative h-64 overflow-hidden">
                <motion.img
                  src={currentItem.images[selectedColorIndex] || currentItem.images[0]}
                  alt={currentItem.name}
                  className="w-full h-full object-cover"
                  style={{
                    scale: useTransform(x, [-100, 0, 100], [1.1, 1, 1.1])
                  }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                {/* Floating Badges */}
                <motion.div
                  className="absolute top-4 left-4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 px-3 py-1 rounded-full shadow-lg backdrop-blur-sm">
                    <Sparkles className="w-3 h-3 mr-1" />
                    🔥 Trending
                  </Badge>
                </motion.div>

                <motion.div
                  className="absolute top-4 right-4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                    <span className="text-sm font-bold text-green-600">{calculateMatchScore()}% Match</span>
                  </div>
                </motion.div>

                {/* AR View Button */}
                <motion.button
                  className="absolute bottom-4 right-4 p-2 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <Box className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-4 h-64 flex flex-col">

                {/* Product Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 leading-tight">{currentItem.name}</h2>
                      <p className="text-orange-600 font-medium text-sm">Premium Collection</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">${currentItem.price}</div>
                      <p className="text-xs text-gray-500">CAD</p>
                    </div>
                  </div>

                  {/* Color Selector */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Available Colors:</p>
                    <div className="flex gap-2">
                      {getAvailableColors().map((color, index) => (
                        <motion.button
                          key={index}
                          className={`w-8 h-8 rounded-full border-2 shadow-sm ${selectedColorIndex === index
                            ? 'border-orange-500 shadow-orange-200'
                            : 'border-gray-300'
                            }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setSelectedColorIndex(index)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Match Reason (Expandable) */}
                <motion.div
                  className={`bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 overflow-hidden ${showMatchReason ? 'h-auto' : 'h-12'
                    }`}
                  animate={{ height: showMatchReason ? 'auto' : 48 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="p-3">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setShowMatchReason(!showMatchReason)}
                    >
                      <span className="text-sm font-medium text-orange-800">Why this matches you</span>
                      <motion.div
                        animate={{ rotate: showMatchReason ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Info className="w-4 h-4 text-orange-600" />
                      </motion.div>
                    </div>
                    {showMatchReason && (
                      <motion.p
                        className="text-sm text-orange-800 mt-2 leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <span className="font-semibold">Perfect match:</span> {getMatchReason()}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Action Bar (Thumb-Friendly) */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="bg-white/80 backdrop-blur-xl border-t border-white/20 px-6 py-4 safe-area-pb">
          <div className="flex gap-4 max-w-sm mx-auto">

            {/* Pass Button */}
            <motion.button
              onClick={handlePass}
              className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 py-4 px-6 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="w-5 h-5" />
              <span className="font-semibold">Pass</span>
            </motion.button>

            {/* Super Like / AR View */}
            <motion.button
              onClick={() => setShowDetails(!showDetails)}
              className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl shadow-lg transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye className="w-6 h-6" />
            </motion.button>

            {/* Like Button */}
            <motion.button
              onClick={handleLike}
              className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white py-4 px-6 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Heart className="w-5 h-5" />
              <span className="font-semibold">Love</span>
            </motion.button>
          </div>

          {/* Swipe Hint */}
          <motion.p
            className="text-center text-xs text-gray-600 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Swipe left to pass • Tap eye to view details • Swipe right to match
          </motion.p>
        </div>
      </div>

      {/* Detail Expandable Panel */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-end"
          onClick={() => setShowDetails(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full bg-white rounded-t-3xl max-h-[70vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">

              {/* Header with drag handle */}
              <div className="text-center">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">{currentItem.name}</h3>
                <p className="text-orange-600">Premium Collection</p>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  onClick={() => window.open(currentItem.buyLink, '_blank')}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  View Store
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                  onClick={() => {
                    // Add AR functionality here
                    console.log('AR View activated');
                  }}
                >
                  <Box className="w-4 h-4 mr-2" />
                  AR View
                </Button>
              </div>

              {/* Image Gallery */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Gallery</h4>
                <div className="grid grid-cols-2 gap-3">
                  {currentItem.images.slice(0, 4).map((image, index) => (
                    <motion.img
                      key={index}
                      src={image}
                      alt={`${currentItem.name} view ${index + 1}`}
                      className="w-full h-24 object-cover rounded-xl shadow-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    />
                  ))}
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Specifications</h4>
                <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Materials</span>
                    <span className="font-medium text-gray-800">
                      {Array.isArray(currentItem.materials) ? currentItem.materials.join(', ') : currentItem.materials}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Style</span>
                    <span className="font-medium text-gray-800">
                      {Array.isArray(currentItem.style) ? currentItem.style.join(', ') : currentItem.style}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="font-medium text-gray-800">{currentItem.category}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default TrenderSwipeScreen;