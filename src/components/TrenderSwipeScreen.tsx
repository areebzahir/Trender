import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { Heart, X, Info, ArrowLeft, Sparkles, Eye, ShoppingBag, Box, Star, Truck, Shield, Clock, Maximize2, Zap, Award, TrendingUp } from 'lucide-react';
import { ThemedFluidBlob } from './ThemedFluidBlob';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWishlistStore, WishlistItem } from './WishlistStore';
import { sampleFurniture, pinnedFirstCard } from '@/data/sampleFurniture';

// Full deck: pinned card first, then the rest
const fullDeck = [pinnedFirstCard, ...sampleFurniture];

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
  const [showExpandedImage, setShowExpandedImage] = useState(false);
  const [cards, setCards] = useState(fullDeck.slice(0, 3));
  const { add: addToWishlist } = useWishlistStore();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useTransform(x, [-300, 0, 300], [0.8, 1, 0.8]);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 0.5, 1, 0.5, 0]);

  const controls = useAnimation();
  const constraintsRef = useRef(null);

  const currentItem = cards[0] || fullDeck[currentIndex];

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
      const index = (currentIndex + i) % fullDeck.length;
      nextCards.push(fullDeck[index]);
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

    // Show success feedback
    console.log(`Added "${currentItem.name}" to wishlist!`);

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
      {/* Themed Fluid Blob Background */}
      <ThemedFluidBlob />

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
          <p className="text-xs text-orange-600 mt-1">{currentIndex + 1} of {fullDeck.length}</p>
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
        <div className="relative w-full max-w-md mx-auto">

          {/* Background Cards Stack (T-Layout) */}
          {cards.slice(1, 3).map((item, index) => (
            <motion.div
              key={`bg-${item.id}-${index}`}
              className="absolute inset-0 w-full"
              initial={{ scale: 0.9 - (index * 0.05), y: 8 + (index * 8), opacity: 0.6 - (index * 0.2) }}
              animate={{ scale: 0.9 - (index * 0.05), y: 8 + (index * 8), opacity: 0.6 - (index * 0.2) }}
              style={{ zIndex: 10 - index }}
            >
              <div className="w-full h-[650px] bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg" />
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
            <div className="w-full h-[650px] bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-[8px_8px_24px_rgba(0,0,0,0.1),-8px_-8px_24px_rgba(255,255,255,0.9)] border border-white/20 overflow-hidden">

              {/* Hero Image with Overlays */}
              <div className="relative h-80 overflow-hidden">
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

                {/* Floating Animated Elements */}
                <motion.div
                  className={`absolute top-8 left-8 w-3 h-3 rounded-full ${currentItem.brand === "goop" ? "bg-blue-400" :
                    currentItem.brand === "IKEA" ? "bg-yellow-400" :
                      currentItem.brand === "Studio ANANSI" ? "bg-brown-400" :
                        currentItem.brand === "Adam Rogers" ? "bg-amber-400" :
                          "bg-yellow-400"
                    }`}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className={`absolute top-16 right-12 w-2 h-2 rounded-full ${currentItem.brand === "goop" ? "bg-purple-400" :
                    currentItem.brand === "IKEA" ? "bg-blue-400" :
                      currentItem.brand === "Studio ANANSI" ? "bg-amber-400" :
                        currentItem.brand === "Adam Rogers" ? "bg-brown-400" :
                          "bg-orange-400"
                    }`}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                />
                <motion.div
                  className={`absolute bottom-20 left-16 w-2.5 h-2.5 rounded-full ${currentItem.brand === "goop" ? "bg-indigo-400" :
                    currentItem.brand === "IKEA" ? "bg-green-400" :
                      currentItem.brand === "Studio ANANSI" ? "bg-orange-400" :
                        currentItem.brand === "Adam Rogers" ? "bg-amber-400" :
                          "bg-amber-400"
                    }`}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                />

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
                  className="absolute bottom-4 right-12 p-2 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <Box className="w-4 h-4" />
                </motion.button>

                {/* Expand Image Button */}
                <motion.button
                  className="absolute bottom-4 right-4 p-2 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowExpandedImage(true)}
                >
                  <Maximize2 className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-4 h-80 flex flex-col">

                {/* Product Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      {/* Brand Logo */}
                      <div className="flex items-center gap-2 mb-2">
                        {currentItem.brand === "goop" ? (
                          <>
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">G</span>
                            </div>
                            <span className="text-blue-600 font-bold text-sm">GOOP</span>
                          </>
                        ) : currentItem.brand === "IKEA" ? (
                          <>
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-blue-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">I</span>
                            </div>
                            <span className="text-blue-600 font-bold text-sm">IKEA</span>
                          </>
                        ) : currentItem.brand === "Studio ANANSI" ? (
                          <>
                            <div className="w-8 h-8 bg-gradient-to-br from-brown-600 to-amber-800 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">S</span>
                            </div>
                            <span className="text-brown-700 font-bold text-sm">STUDIO ANANSI</span>
                          </>
                        ) : currentItem.brand === "Adam Rogers" ? (
                          <>
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-brown-800 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">A</span>
                            </div>
                            <span className="text-amber-700 font-bold text-sm">ADAM ROGERS</span>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">L</span>
                            </div>
                            <span className="text-orange-600 font-bold text-sm">LENAE</span>
                          </>
                        )}
                      </div>

                      <h2 className="text-xl font-bold text-gray-900 leading-tight">{currentItem.name}</h2>
                      <p className="text-orange-600 font-medium text-sm">Premium Collection</p>

                      {/* Star Rating with Animation */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
                              className="text-yellow-400"
                            >
                              <Star className="w-4 h-4 fill-current" />
                            </motion.div>
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">4.8</span>
                        <span className="text-xs text-gray-500">(120 reviews)</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">C${currentItem.price}</div>
                      <p className="text-xs text-gray-500">CAD</p>
                    </div>
                  </div>

                  {/* Social Proof Badges */}
                  <div className="flex gap-2 mb-3">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${currentItem.brand === "goop"
                        ? "bg-blue-100 text-blue-700"
                        : currentItem.brand === "IKEA"
                          ? "bg-yellow-100 text-yellow-700"
                          : currentItem.brand === "Studio ANANSI"
                            ? "bg-brown-100 text-brown-700"
                            : currentItem.brand === "Adam Rogers"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                        }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {currentItem.brand === "goop" ? "Celebrity Pick" : currentItem.brand === "IKEA" ? "New Lower Price" : currentItem.brand === "Studio ANANSI" ? "Luxury Design" : currentItem.brand === "Adam Rogers" ? "Vintage Inspired" : "Trending"}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${currentItem.brand === "goop"
                        ? "bg-purple-100 text-purple-700"
                        : currentItem.brand === "IKEA"
                          ? "bg-blue-100 text-blue-700"
                          : currentItem.brand === "Studio ANANSI"
                            ? "bg-amber-100 text-amber-700"
                            : currentItem.brand === "Adam Rogers"
                              ? "bg-brown-100 text-brown-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                    >
                      <Award className="w-3 h-3" />
                      {currentItem.brand === "goop" ? "Gwyneth's Choice" : currentItem.brand === "IKEA" ? "Family Favorite" : currentItem.brand === "Studio ANANSI" ? "Handcrafted" : currentItem.brand === "Adam Rogers" ? "70s Cool" : "Best Seller"}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${currentItem.brand === "goop"
                        ? "bg-indigo-100 text-indigo-700"
                        : currentItem.brand === "IKEA"
                          ? "bg-green-100 text-green-700"
                          : currentItem.brand === "Studio ANANSI"
                            ? "bg-orange-100 text-orange-700"
                            : currentItem.brand === "Adam Rogers"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-purple-100 text-purple-700"
                        }`}
                    >
                      <Zap className="w-3 h-3" />
                      {currentItem.brand === "goop" ? "CB2 Exclusive" : currentItem.brand === "IKEA" ? "Easy Assembly" : currentItem.brand === "Studio ANANSI" ? "Full-Grain Leather" : currentItem.brand === "Adam Rogers" ? "Semi-Aniline Leather" : "Fast Shipping"}
                    </motion.div>
                  </div>

                  {/* Purchase Now Button */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 px-4 rounded-2xl font-semibold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 mb-3"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(currentItem.buyLink, '_blank')}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Purchase Now - C${currentItem.price}
                  </motion.button>

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
        <div className="bg-white/20 backdrop-blur-2xl border-t border-white/10 px-6 py-4 safe-area-pb mx-4 mb-4 rounded-3xl">
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-end"
          onClick={() => setShowDetails(false)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-1/2 h-full bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">

              {/* Header with Breadcrumbs */}
              <div className="relative border-b border-gray-200 pb-4">
                <button
                  onClick={() => setShowDetails(false)}
                  className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <nav className="text-sm text-gray-500 mb-2">
                  Home / Furniture / {currentItem.category} / {currentItem.name}
                </nav>
                <h3 className="text-2xl font-bold text-gray-900 leading-tight">{currentItem.name}</h3>
                <p className="text-orange-600 font-medium">Premium Collection</p>

                {/* Benefit Highlights */}
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">Pet-friendly</Badge>
                  <Badge variant="secondary" className="text-xs">Easy assembly</Badge>
                  <Badge variant="secondary" className="text-xs">Free shipping</Badge>
                </div>
              </div>

              {/* Enhanced Gallery */}
              <div className="space-y-4">
                <div className="relative">
                  <motion.img
                    src={currentItem.images[selectedColorIndex] || currentItem.images[0]}
                    alt={currentItem.name}
                    className="w-full h-64 object-cover rounded-3xl shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500 text-white">In Stock</Badge>
                  </div>
                </div>

                {/* Thumbnail Gallery */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {currentItem.images.map((image, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setSelectedColorIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${selectedColorIndex === index ? 'border-orange-500' : 'border-gray-200'
                        }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <img
                        src={image}
                        alt={`${currentItem.name} view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Price & Promotions */}
              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">C${currentItem.price}</span>
                  {currentItem.originalPrice && (
                    <span className="text-lg text-gray-500 line-through">C${currentItem.originalPrice}</span>
                  )}
                  {currentItem.originalPrice && (
                    <Badge className="bg-red-500 text-white">
                      Save C${currentItem.originalPrice - currentItem.price}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-green-600" />
                    <span>Delivered to Kitchener, ON : Sep 16th - Oct 8th</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>30 day satisfaction guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span>Affirm financing as low as C$192/month</span>
                  </div>
                </div>
              </div>

              {/* Product Description */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Description</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{currentItem.description}</p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Features</h4>
                <div className="grid grid-cols-1 gap-2">
                  {currentItem.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color/Material Variants */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Available Colors</h4>
                <div className="flex gap-3">
                  {getAvailableColors().map((color, index) => (
                    <motion.button
                      key={index}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 ${selectedColorIndex === index ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                        }`}
                      onClick={() => setSelectedColorIndex(index)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-xs text-gray-700">{color.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Reviews & Ratings */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">4.8 (127 reviews)</span>
                </div>
                <p className="text-sm text-gray-600">"Perfect fit for our living room. Quality is exceptional!" - Sarah M.</p>
              </div>

              {/* Strong CTAs */}
              <div className="space-y-3">
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-4 text-lg font-semibold"
                  onClick={() => window.open(currentItem.buyLink, '_blank')}
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Add to Cart - C${currentItem.price}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                    onClick={() => {
                      console.log('AR View activated');
                    }}
                  >
                    <Box className="w-4 h-4 mr-2" />
                    View in AR
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
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
                    }}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>

              {/* Payment Options */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Secure checkout with:</p>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-xs font-bold">AP</span>
                  </div>
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-xs font-bold">GP</span>
                  </div>
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-xs font-bold">PP</span>
                  </div>
                </div>
              </div>

              {/* Detailed Specifications */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">Specifications</h4>
                <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Style</span>
                    <span className="font-medium text-gray-800">
                      {Array.isArray(currentItem.style) ? currentItem.style.join(', ') : currentItem.style}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">General Dimensions</span>
                    <span className="font-medium text-gray-800">{currentItem.dimensions.height}H x {currentItem.dimensions.width}W x {currentItem.dimensions.depth}D</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seat Height</span>
                    <span className="font-medium text-gray-800">18.5"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seat Depth</span>
                    <span className="font-medium text-gray-800">23.5"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Arm Height</span>
                    <span className="font-medium text-gray-800">25.5"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight</span>
                    <span className="font-medium text-gray-800">{currentItem.dimensions.weight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Upholstery Color</span>
                    <span className="font-medium text-gray-800">Hale Rust</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Materials</span>
                    <span className="font-medium text-gray-800">
                      {Array.isArray(currentItem.materials) ? currentItem.materials.join(', ') : currentItem.materials}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SKU</span>
                    <span className="font-medium text-gray-800">SKU26983</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Box Dimensions</span>
                    <span className="font-medium text-gray-800">26"H x 38"W x 39"L</span>
                  </div>
                </div>
              </div>

              {/* Care & Assembly */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Care & Assembly</h4>
                <div className="space-y-2 text-sm">
                  {currentItem.careInstructions.map((instruction, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{instruction}</span>
                    </div>
                  ))}
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Some assembly required (approximately 15 minutes)</span>
                  </div>
                </div>
              </div>

              {/* Shipping & Returns */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Shipping & Returns</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-green-600" />
                    <span>Free shipping on orders over $500</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>30-day return policy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span>Delivery in 3-5 business days</span>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Frequently Asked Questions</h4>
                <div className="space-y-2 text-sm">
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                      How long does assembly take?
                    </summary>
                    <p className="mt-2 text-gray-600">Assembly typically takes 30-45 minutes with the included tools and instructions.</p>
                  </details>
                  <details className="group">
                    <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                      Is this pet-friendly?
                    </summary>
                    <p className="mt-2 text-gray-600">Yes, this fabric is stain-resistant and perfect for homes with pets.</p>
                  </details>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Expanded Image Modal */}
      {showExpandedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowExpandedImage(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowExpandedImage(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Expanded Image */}
            <motion.img
              src={currentItem.images[selectedColorIndex] || currentItem.images[0]}
              alt={currentItem.name}
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            />

            {/* Image Navigation */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {currentItem.images.map((image, index) => (
                <motion.button
                  key={index}
                  onClick={() => setSelectedColorIndex(index)}
                  className={`w-3 h-3 rounded-full border-2 ${selectedColorIndex === index ? 'bg-white border-white' : 'bg-white/30 border-white/50'
                    }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>

            {/* Product Info Overlay */}
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
              <h3 className="font-semibold text-sm">{currentItem.name}</h3>
              <p className="text-xs opacity-80">C${currentItem.price}</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default TrenderSwipeScreen;