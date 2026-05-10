/**
 * SwipeResultsPage — Tinder-style swipe interface for AI furniture results.
 *
 * Each card shows the user's room with a real product stitched into it.
 * Right swipe = save to wishlist. Left swipe = pass.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { Heart, X, ArrowLeft, Sparkles, ShoppingBag, ExternalLink, RotateCcw, Loader2, AlertCircle, CheckCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWishlistStore } from '@/components/WishlistStore';
import { stitchProductIntoRoom } from '@/lib/compositor/stitchProductIntoRoom';
import { validateImageUrl } from '@/lib/compositor/removeBackground';
import FurnitureCart from '@/components/FurnitureCart';
import type { SwipeResultCard } from '@/types/swipeResult';
import type { ProductCandidate, PlacementRecommendation } from '@/lib/room-overlay/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SwipeResultsPageProps {
  roomImageBase64: string;
  candidates: ProductCandidate[];
  placement: PlacementRecommendation | null;
  roomType: string;
  designGoal: string;
  onBack: () => void;
  onStartOver: () => void;
}

// ─── Single swipe card ────────────────────────────────────────────────────────

interface CardProps {
  card: SwipeResultCard;
  isTop: boolean;
  stackIndex: number;
  onSwipe: (id: string, dir: 'left' | 'right') => void;
}

const SwipeCard: React.FC<CardProps> = ({ card, isTop, stackIndex, onSwipe }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, -20], [1, 0]);
  const controls = useAnimation();

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold || info.velocity.x > 400) {
      controls.start({ x: 600, opacity: 0, transition: { duration: 0.3 } })
        .then(() => onSwipe(card.id, 'right'));
    } else if (info.offset.x < -threshold || info.velocity.x < -400) {
      controls.start({ x: -600, opacity: 0, transition: { duration: 0.3 } })
        .then(() => onSwipe(card.id, 'left'));
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  }, [card.id, controls, onSwipe]);

  const displayImage = card.stitchedImageUrl ?? card.roomImageUrl;

  return (
    <motion.div
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale: isTop ? 1 : 1 - stackIndex * 0.04,
        y: isTop ? 0 : stackIndex * 10,
        zIndex: 10 - stackIndex,
        position: 'absolute',
        width: '100%',
      }}
      animate={isTop ? controls : undefined}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={isTop ? handleDragEnd : undefined}
      className="cursor-grab active:cursor-grabbing"
    >
      <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/60 select-none">
        {/* Room image with stitched product */}
        <div className="relative aspect-[4/3] bg-[#F7F4F0] overflow-hidden">
          {card.stitchLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#F7F4F0]">
              <div className="absolute inset-0 bg-gradient-to-r from-[#EDE7DD] via-[#F7F4F0] to-[#EDE7DD] animate-pulse" />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-[#F76A1C] animate-spin" />
                <p className="text-sm text-[#A5846E] font-medium">Removing background…</p>
                <p className="text-xs text-[#A5846E]/70">Placing furniture in your room</p>
              </div>
            </div>
          ) : (
            <img
              src={displayImage}
              alt={card.productName}
              className="w-full h-full object-cover"
              draggable={false}
            />
          )}

          {/* Like / Pass overlays */}
          {isTop && (
            <>
              <motion.div
                style={{ opacity: likeOpacity }}
                className="absolute top-6 left-6 bg-green-500 text-white font-black text-2xl px-4 py-2 rounded-2xl border-4 border-green-400 rotate-[-12deg]"
              >
                SAVE ❤️
              </motion.div>
              <motion.div
                style={{ opacity: passOpacity }}
                className="absolute top-6 right-6 bg-red-500 text-white font-black text-2xl px-4 py-2 rounded-2xl border-4 border-red-400 rotate-[12deg]"
              >
                PASS ✕
              </motion.div>
            </>
          )}

          {/* Stitch error badge */}
          {card.stitchError && !card.stitchLoading && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-black/60 text-white text-[10px] backdrop-blur-sm border-0">
                Product preview
              </Badge>
            </div>
          )}

          {/* Stitched badge */}
          {card.stitchedImageUrl && !card.stitchLoading && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-[#F76A1C]/90 text-white text-[10px] backdrop-blur-sm border-0">
                ✨ In your room
              </Badge>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#A5846E] font-medium uppercase tracking-wide mb-1">
                {card.storeName}
              </p>
              <h3 className="text-base font-bold text-[#2D1B00] leading-snug line-clamp-2">
                {card.productName}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-black text-[#F76A1C]">
                {new Intl.NumberFormat('en-CA', { style: 'currency', currency: card.currency || 'CAD', maximumFractionDigits: 0 }).format(card.price)}
              </p>
            </div>
          </div>

          {/* Why selected */}
          {card.whySelected && (
            <p className="text-xs text-[#A5846E] leading-relaxed mb-3 italic">
              "{card.whySelected}"
            </p>
          )}

          {/* Style tags */}
          {card.styleTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {card.styleTags.slice(0, 4).map(tag => (
                <Badge key={tag} variant="secondary"
                  className="text-[10px] px-2 py-0.5 bg-[#F4E3E1]/60 text-[#A5846E] border-0 rounded-full capitalize">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Shop link */}
          {card.productUrl && (
            <a
              href={card.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs text-[#F76A1C] hover:underline font-medium"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              View product
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const SwipeResultsPage: React.FC<SwipeResultsPageProps> = ({
  roomImageBase64,
  candidates,
  placement,
  roomType,
  designGoal,
  onBack,
  onStartOver,
}) => {
  const [cards, setCards] = useState<SwipeResultCard[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { add: addToWishlist, items: wishlistItems } = useWishlistStore();
  const roomImageSrc = `data:image/jpeg;base64,${roomImageBase64}`;

  // Build initial cards from candidates — filter out those with invalid images
  useEffect(() => {
    if (!candidates.length) return;

    let cancelled = false;

    (async () => {
      // Validate images — only filter out obviously broken ones (no URL, placeholder)
      const validated = await Promise.all(
        candidates.slice(0, 50).map(async c => ({
          candidate: c,
          valid: !!(c.imageUrl && c.imageUrl !== '/placeholder.svg' && c.imageUrl.startsWith('http')),
        }))
      );

      if (cancelled) return;

      const validCandidates = validated
        .filter(v => v.valid)
        .map(v => v.candidate);

      if (validCandidates.length === 0) {
        setAllDone(true);
        return;
      }

      const initial: SwipeResultCard[] = validCandidates.map(c => ({
        id: c.id,
        productId: c.id,
        stitchedImageUrl: null,
        stitchLoading: true,
        stitchError: false,
        roomImageUrl: roomImageSrc,
        productImageUrl: c.imageUrl,
        productName: c.title,
        storeName: c.storeName ?? 'Store',
        price: c.price ?? 0,
        currency: c.currency ?? 'CAD',
        productUrl: c.productUrl,
        category: c.category ?? 'furniture',
        styleTags: c.styleTags,
        colorTags: c.colors,
        whySelected: c.whySelected,
        renderWarnings: c.renderWarnings,
        swipeStatus: 'pending',
      }));

      setCards(initial);

      // Stitch images progressively — top card first, then rest
      // Background removal takes ~3-5s per image so we stagger generously
      initial.forEach((card, i) => {
        const delay = i * 1500;
        setTimeout(async () => {
          if (cancelled) return;
          try {
            const result = await stitchProductIntoRoom({
              roomImageSrc,
              productImageSrc: card.productImageUrl,
              placement: i === 0 ? placement : null, // only top card uses Gemini placement
              productCategory: card.category,
            });
            if (cancelled) return;
            setCards(prev => prev.map(c =>
              c.id === card.id
                ? { ...c, stitchedImageUrl: result.dataUrl, stitchLoading: false }
                : c
            ));
          } catch {
            if (cancelled) return;
            // Stitching failed — show product image directly instead of removing card
            setCards(prev => prev.map(c =>
              c.id === card.id
                ? { ...c, stitchLoading: false, stitchError: true, stitchedImageUrl: card.productImageUrl }
                : c
            ));
          }
        }, delay);
      });
    })();

    return () => { cancelled = true; };
  }, [candidates, roomImageSrc, placement]);

  const handleSwipe = useCallback((id: string, dir: 'left' | 'right') => {
    const card = cards.find(c => c.id === id);
    if (!card) return;

    if (dir === 'right') {
      setSavedCount(n => n + 1);
      addToWishlist({
        id: card.productId,
        image: card.stitchedImageUrl ?? card.productImageUrl,
        title: card.productName,
        brand: card.storeName,
        price: card.price,
        tags: card.styleTags,
        link: card.productUrl,
        category: card.category,
      });
    }

    setCards(prev => {
      const remaining = prev.filter(c => c.id !== id);
      if (remaining.length === 0) setAllDone(true);
      return remaining;
    });
  }, [cards, addToWishlist]);

  const handleButtonSwipe = (dir: 'left' | 'right') => {
    if (cards.length === 0) return;
    handleSwipe(cards[0].id, dir);
  };

  // ── All done state ──────────────────────────────────────────────────────────
  if (allDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F4F0] via-[#EDE7DD] to-[#DCD8CF] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 text-center max-w-sm w-full shadow-2xl"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#2D1B00] mb-2">All done!</h2>
          <p className="text-[#A5846E] mb-2">
            You saved <span className="font-bold text-[#F76A1C]">{savedCount}</span> item{savedCount !== 1 ? 's' : ''} to your wishlist.
          </p>
          <div className="flex flex-col gap-3 mt-6">
            <Button onClick={onStartOver}
              className="w-full bg-gradient-to-r from-[#F76A1C] to-[#F8A87B] text-white rounded-2xl py-5 font-semibold">
              <RotateCcw className="w-4 h-4 mr-2" /> Try another room
            </Button>
            <Button variant="ghost" onClick={onBack}
              className="w-full text-[#A5846E] hover:text-[#2D1B00] rounded-2xl">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── No candidates ───────────────────────────────────────────────────────────
  if (candidates.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F4F0] via-[#EDE7DD] to-[#DCD8CF] flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 text-center max-w-sm w-full shadow-2xl">
          <AlertCircle className="w-12 h-12 text-[#A5846E] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#2D1B00] mb-2">No matches found</h2>
          <p className="text-[#A5846E] mb-6 text-sm">Try a different prompt or style.</p>
          <Button onClick={onBack}
            className="w-full bg-gradient-to-r from-[#F76A1C] to-[#F8A87B] text-white rounded-2xl py-5 font-semibold">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const topCard = cards[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F4F0] via-[#EDE7DD] to-[#DCD8CF]">
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col min-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={onBack}
            className="text-[#A5846E] hover:text-[#2D1B00] hover:bg-[#F4E3E1]/50 rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="text-center flex-1 mx-2">
            <p className="text-xs text-[#A5846E] font-medium uppercase tracking-wider truncate">
              {roomType} · {designGoal}
            </p>
          </div>
          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-[#EDE7DD] hover:bg-white transition-colors"
          >
            <ShoppingCart className="w-4 h-4 text-[#F76A1C]" />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#F76A1C] text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {wishlistItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Cart drawer */}
        <FurnitureCart open={cartOpen} onClose={() => setCartOpen(false)} />

        {/* Hint */}
        <p className="text-center text-xs text-[#A5846E] mb-4">
          Swipe <span className="text-green-600 font-semibold">right</span> to save ·
          Swipe <span className="text-red-500 font-semibold">left</span> to pass ·
          <span className="text-[#A5846E]"> {cards.length} left</span>
        </p>

        {/* Card deck */}
        <div className="relative flex-1" style={{ minHeight: 480 }}>
          {cards.slice(0, 3).map((card, i) => (
            <SwipeCard
              key={card.id}
              card={card}
              isTop={i === 0}
              stackIndex={i}
              onSwipe={handleSwipe}
            />
          ))}
        </div>

        {/* Action buttons */}
        {topCard && (
          <div className="flex items-center justify-center gap-6 mt-6 pb-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleButtonSwipe('left')}
              className="w-16 h-16 rounded-full bg-white shadow-lg border border-red-100 flex items-center justify-center hover:bg-red-50 transition-colors"
            >
              <X className="w-7 h-7 text-red-500" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleButtonSwipe('right')}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F76A1C] to-[#F8A87B] shadow-xl flex items-center justify-center hover:from-[#F8A87B] hover:to-[#F76A1C] transition-all"
            >
              <Heart className="w-9 h-9 text-white" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onStartOver}
              className="w-16 h-16 rounded-full bg-white shadow-lg border border-[#DCD8CF] flex items-center justify-center hover:bg-[#F4E3E1]/50 transition-colors"
            >
              <RotateCcw className="w-6 h-6 text-[#A5846E]" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwipeResultsPage;
