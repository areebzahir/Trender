import React from 'react';
import { motion } from 'framer-motion';
import { Trash, ExternalLink, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlistStore, WishlistItem as WishlistItemType } from './WishlistStore';

interface Props {
  item: WishlistItemType;
  view: 'grid' | 'list';
  onAddToCart?: (item: WishlistItemType) => void;
}

const WishlistItem: React.FC<Props> = ({ item, view, onAddToCart }) => {
  const remove = useWishlistStore((s) => s.remove);

  return (
    <motion.div
      className={`flex ${view === 'grid' ? 'flex-col md:flex-row' : 'flex-row'} bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-orange-100/60 p-4 md:p-6 gap-4 items-center transition-all duration-300 hover:shadow-2xl`}
      whileHover={{ y: -4, boxShadow: '0 8px 32px 0 rgba(251,146,60,0.12)' }}
    >
      <img src={item.image} alt={item.title} className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-xl bg-orange-100" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg md:text-xl text-orange-900 truncate">{item.title}</div>
            <div className="text-orange-700/80 text-sm md:text-base font-medium mb-1 truncate">{item.brand}</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {item.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="bg-orange-100 text-orange-700/80 rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="font-extrabold text-2xl text-orange-500 md:ml-4">${item.price}</div>
        </div>
        <div className="flex gap-2 mt-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => remove(item.id)}
            className="p-2 rounded-full bg-white/70 hover:bg-orange-100 border border-orange-200 shadow transition"
            title="Remove from wishlist"
          >
            <Trash className="w-5 h-5 text-orange-400" />
          </motion.button>
          <motion.a
            whileTap={{ scale: 0.9 }}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-white/70 hover:bg-orange-100 border border-orange-200 shadow transition"
            title="Open in store"
          >
            <ExternalLink className="w-5 h-5 text-orange-400" />
          </motion.a>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onAddToCart && onAddToCart(item)}
            className="p-2 rounded-full bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500 shadow-lg hover:scale-105 transition group"
            title="Add to cart"
          >
            <ShoppingCart className="w-5 h-5 text-white group-hover:scale-110 transition" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default WishlistItem; 