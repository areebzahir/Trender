/**
 * FurnitureCart — slide-in cart drawer showing all right-swiped furniture.
 * Shows product info, dimensions, tags, and buy links. No room preview images.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, ExternalLink, Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWishlistStore } from '@/components/WishlistStore';

interface FurnitureCartProps {
  open: boolean;
  onClose: () => void;
}

const FurnitureCart: React.FC<FurnitureCartProps> = ({ open, onClose }) => {
  const { items, remove, clear } = useWishlistStore();

  const totalPrice = items.reduce((sum, item) => sum + (item.price ?? 0), 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE7DD]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#F76A1C]" />
                <h2 className="text-base font-bold text-[#2D1B00]">
                  Saved Furniture
                  {items.length > 0 && (
                    <span className="ml-2 text-xs font-semibold bg-[#F76A1C] text-white rounded-full px-2 py-0.5">
                      {items.length}
                    </span>
                  )}
                </h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[#F4E3E1]/50 transition-colors">
                <X className="w-5 h-5 text-[#A5846E]" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                  <ShoppingBag className="w-12 h-12 text-[#DCD8CF]" />
                  <p className="text-[#A5846E] text-sm">No saved items yet.</p>
                  <p className="text-[#A5846E]/70 text-xs">Swipe right on furniture you like.</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="bg-[#F7F4F0] rounded-2xl p-4 relative">
                    {/* Remove button */}
                    <button
                      onClick={() => remove(item.id)}
                      className="absolute top-3 right-3 p-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-[#A5846E] hover:text-red-500" />
                    </button>

                    <div className="flex gap-3 mb-3">
                      {/* Product image */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-white shrink-0 border border-[#EDE7DD]">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="text-[10px] text-[#A5846E] font-medium uppercase tracking-wide">
                          {item.brand}
                        </p>
                        <h3 className="text-sm font-bold text-[#2D1B00] leading-snug line-clamp-2 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-base font-black text-[#F76A1C]">
                          {new Intl.NumberFormat('en-CA', {
                            style: 'currency', currency: 'CAD', maximumFractionDigits: 0,
                          }).format(item.price)}
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.slice(0, 4).map(tag => (
                          <Badge key={tag} variant="secondary"
                            className="text-[10px] px-2 py-0.5 bg-white text-[#A5846E] border-0 rounded-full capitalize">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Buy button */}
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-[#2D1B00] hover:bg-[#F76A1C] text-white text-xs font-semibold py-2.5 rounded-xl transition-colors duration-200"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Buy / View Product
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-[#EDE7DD] px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#A5846E]">Estimated total</span>
                  <span className="text-lg font-black text-[#2D1B00]">
                    {new Intl.NumberFormat('en-CA', {
                      style: 'currency', currency: 'CAD', maximumFractionDigits: 0,
                    }).format(totalPrice)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  onClick={clear}
                  className="w-full text-[#A5846E] hover:text-red-500 hover:bg-red-50 rounded-xl text-xs"
                >
                  Clear all
                </Button>
                <Button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-[#F76A1C] to-[#F8A87B] text-white rounded-xl py-3 font-semibold text-sm"
                >
                  Continue browsing
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FurnitureCart;
