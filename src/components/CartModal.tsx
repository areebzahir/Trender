import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WishlistItem } from './WishlistStore';

interface Props {
  open: boolean;
  onClose: () => void;
  items: WishlistItem[];
  onRemove: (id: string) => void;
}

const CartModal: React.FC<Props> = ({ open, onClose, items, onRemove }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white/90 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative border border-orange-100"
            initial={{ scale: 0.95, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-orange-50 hover:bg-orange-100 transition">
              <X className="w-5 h-5 text-orange-400" />
            </button>
            <h2 className="text-2xl font-bold text-orange-700 mb-6">Your Cart</h2>
            {items.length === 0 ? (
              <div className="text-orange-500 text-lg text-center py-12">Your cart is empty.</div>
            ) : (
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 bg-orange-50/60 rounded-xl p-3">
                    <img src={item.image} alt={item.title} className="w-14 h-14 object-cover rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-orange-900 truncate">{item.title}</div>
                      <div className="text-orange-700/80 text-sm truncate">{item.brand}</div>
                    </div>
                    <div className="font-bold text-orange-500">${item.price}</div>
                    <button onClick={() => onRemove(item.id)} className="p-2 rounded-full bg-white/70 hover:bg-orange-100 border border-orange-200 shadow transition">
                      <Trash className="w-5 h-5 text-orange-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 rounded-xl shadow-lg text-lg font-semibold mt-2">
              Checkout
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartModal; 