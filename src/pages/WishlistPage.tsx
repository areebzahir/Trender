import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, LayoutGrid, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlistStore, WishlistItem as WishlistItemType } from '@/components/WishlistStore';
import WishlistItem from '@/components/WishlistItem';
import Filters from '@/components/Filters';
import CartModal from '@/components/CartModal';

const dummy: WishlistItemType[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=400&q=80',
    title: 'Copenhagen Accent Chair',
    brand: 'Muji',
    price: 449,
    tags: ['Scandinavian', 'Minimalist', 'Hygge'],
    link: 'https://muji.com',
    category: 'Seating',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    title: 'Walnut Coffee Table',
    brand: 'West Elm',
    price: 299,
    tags: ['Midcentury', 'Wood', 'Table'],
    link: 'https://westelm.com',
    category: 'Tables',
  },
];

const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, add, remove } = useWishlistStore();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [category, setCategory] = useState('All Categories');
  const [sort, setSort] = useState('Recently Added');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<WishlistItemType[]>([]);

  // Add dummy data if empty
  React.useEffect(() => {
    if (items.length === 0) {
      dummy.forEach((item) => add(item));
    }
    // eslint-disable-next-line
  }, []);

  // Filter, sort, search logic
  let filtered = items;
  if (category !== 'All Categories') filtered = filtered.filter(i => i.category === category);
  if (search) filtered = filtered.filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.brand.toLowerCase().includes(search.toLowerCase()));
  if (sort === 'Price Low→High') filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === 'Price High→Low') filtered = [...filtered].sort((a, b) => b.price - a.price);

  // Add to cart logic
  const handleAddToCart = (item: WishlistItemType) => {
    setCartItems((prev) => [...prev, item]);
    setCartOpen(true);
  };
  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter(i => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-25 to-orange-100 relative overflow-hidden">
      <div className="container mx-auto px-4 py-8">
        {/* Back to Swiping Button */}
        <div className="flex justify-end mb-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block"
          >
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 text-white px-6 py-3 rounded-full shadow-lg font-semibold text-lg flex items-center gap-2 backdrop-blur-md border border-white/30 hover:from-orange-600 hover:to-orange-500 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Swiping
            </Button>
          </motion.div>
        </div>
        {/* Filters and View Toggle */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <Filters category={category} setCategory={setCategory} sort={sort} setSort={setSort} search={search} setSearch={setSearch} />
          <div className="flex gap-2 ml-auto">
            <Button
              variant={view === 'grid' ? 'default' : 'outline'}
              className={`rounded-xl px-3 py-2 flex items-center ${view === 'grid' ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white' : ''}`}
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="w-5 h-5" />
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              className={`rounded-xl px-3 py-2 flex items-center ${view === 'list' ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white' : ''}`}
              onClick={() => setView('list')}
            >
              <List className="w-5 h-5" />
            </Button>
          </div>
        </div>
        {/* Wishlist Items */}
        {filtered.length === 0 ? (
          <div className="text-center text-2xl text-orange-700/80 font-bold mt-24">
            Your wishlist is empty. Start swiping to add favorites!
          </div>
        ) : (
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`grid ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 gap-8' : 'grid-cols-1 gap-4'} mb-16`}
          >
            {filtered.map((item) => (
              <WishlistItem key={item.id} item={item} view={view} onAddToCart={handleAddToCart} />
            ))}
          </motion.div>
        )}
        {/* Cart Modal */}
        <CartModal open={cartOpen} onClose={() => setCartOpen(false)} items={cartItems} onRemove={handleRemoveFromCart} />
      </div>
    </div>
  );
};

export default WishlistPage; 