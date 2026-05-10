import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, SortAsc, Package, TrendingUp, Heart, ShoppingCart, MapPin, ExternalLink, ChevronDown, LayoutGrid, List, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sampleFurniture, FurnitureItem } from '@/data/sampleFurniture';

interface RoomData {
  image: File | null;
  preferences: string;
  specific?: string;
  quizResults?: Record<string, string>;
}

interface EnhancedSwipeInterfaceProps {
  onBack: () => void;
  roomData: RoomData;
}

export const EnhancedSwipeInterface = ({ onBack, roomData }: EnhancedSwipeInterfaceProps) => {
  const [matches, setMatches] = useState<FurnitureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        // Use local product catalogue — no external API needed
        setMatches(sampleFurniture);
      } catch (error) {
        console.error('Error loading furniture:', error);
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const filteredMatches = matches.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || 
                         item.name.toLowerCase().includes(term) ||
                         item.brand.toLowerCase().includes(term) ||
                         item.category?.toLowerCase().includes(term) ||
                         item.style?.some(s => s.toLowerCase().includes(term));
    const matchesCategory = selectedCategory === 'all' || 
                           item.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const categories = [
    { value: 'all', label: 'All Categories', icon: Package },
    { value: 'seating', label: 'Seating', icon: Package },
    { value: 'tables', label: 'Tables', icon: Package },
    { value: 'storage', label: 'Storage', icon: Package },
    { value: 'lighting', label: 'Lighting', icon: Package },
    { value: 'decor', label: 'Decor', icon: Package }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Best Match', icon: TrendingUp },
    { value: 'price-low', label: 'Price: Low to High', icon: SortAsc },
    { value: 'price-high', label: 'Price: High to Low', icon: SortAsc },
    { value: 'name', label: 'Name A-Z', icon: SortAsc }
  ];

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Premium Loading Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F7F4F0] via-[#EDE7DD] to-[#DCD8CF]">
          {/* Ambient Light Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-[#FCE2D4]/20 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-radial from-[#EEE6DA]/15 to-transparent rounded-full blur-2xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-12 h-12 border-4 border-[#F76A1C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#2D1B00] font-medium">Curating your perfect matches...</p>
          </motion.div>
        </div>
      </div>
    );
  }

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

      {/* Main Content - Now with proper z-index layering */}
      <div className="relative z-10">
        {/* Top Filter Bar */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-[#DCD8CF]/40 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            {/* Back Button Row */}
            <div className="mb-4">
              <Button 
                variant="ghost" 
                onClick={onBack}
                className="text-[#A5846E] hover:text-[#2D1B00] hover:bg-[#F4E3E1]/50 transition-all duration-200 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
              {/* Category Filter - Left */}
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-[#A5846E]" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full lg:w-48 bg-white/90 border-[#DCD8CF]/60 hover:bg-white transition-all duration-200 rounded-xl shadow-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-lg border-[#DCD8CF]/60">
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value} className="hover:bg-[#F4E3E1]/50">
                        <div className="flex items-center space-x-2">
                          <category.icon className="w-4 h-4" />
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Filter - Center Left */}
              <div className="flex items-center justify-center space-x-3">
                <TrendingUp className="w-5 h-5 text-[#A5846E]" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full lg:w-48 bg-white/90 border-[#DCD8CF]/60 hover:bg-white transition-all duration-200 rounded-xl shadow-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-lg border-[#DCD8CF]/60">
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="hover:bg-[#F4E3E1]/50">
                        <div className="flex items-center space-x-2">
                          <option.icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Layout Toggle - Center Right */}
              <div className="flex items-center justify-center space-x-2">
                <span className="text-sm text-[#A5846E] font-medium">Layout:</span>
                <div className="flex bg-white/90 border border-[#DCD8CF]/60 rounded-xl p-1 shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-lg px-3 py-2 transition-all duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-[#F76A1C] text-white shadow-sm'
                        : 'text-[#A5846E] hover:bg-[#F4E3E1]/50'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`rounded-lg px-3 py-2 transition-all duration-200 ${
                      viewMode === 'list'
                        ? 'bg-[#F76A1C] text-white shadow-sm'
                        : 'text-[#A5846E] hover:bg-[#F4E3E1]/50'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Search Bar - Right */}
              <div className="flex items-center justify-end space-x-3">
                <div className="relative w-full lg:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A5846E]" />
                  <Input
                    type="text"
                    placeholder="Search furniture..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/90 border-[#DCD8CF]/60 hover:bg-white focus:bg-white transition-all duration-200 rounded-xl placeholder:text-[#A5846E]/70 shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#DCD8CF]/40 to-transparent mx-6"></div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Premium Title Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center relative"
          >
            {/* Subtle Background Glow for Title */}
            <div className="absolute inset-0 bg-gradient-radial from-[#FCE2D4]/10 to-transparent blur-2xl -z-10" />
            
            <div className="relative inline-block">
              <motion.h1 
                className="text-4xl lg:text-5xl font-bold text-[#2D1B00] mb-4 tracking-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Curated Picks for You
              </motion.h1>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#F76A1C] to-[#F8A87B] rounded-full shadow-lg"
              />
            </div>
            <div className="flex items-center justify-center space-x-2 mt-6">
              <Badge variant="secondary" className="bg-white/80 text-[#A5846E] border-[#DCD8CF]/60 px-4 py-1 shadow-sm backdrop-blur-sm">
                {sortedMatches.length} perfectly matched items
              </Badge>
              <Badge variant="outline" className="border-[#DCD8CF]/60 text-[#A5846E] px-3 py-1 bg-white/60 backdrop-blur-sm">
                {viewMode === 'grid' ? 'Grid View' : 'List View'}
              </Badge>
            </div>
          </motion.div>

          {/* Cards Grid/List */}
          {sortedMatches.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 relative"
            >
              <div className="absolute inset-0 bg-gradient-radial from-[#FCE2D4]/5 to-transparent blur-2xl" />
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white/80 border border-[#DCD8CF]/60 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg backdrop-blur-sm">
                  <Search className="w-8 h-8 text-[#A5846E]" />
                </div>
                <h3 className="text-2xl font-semibold text-[#2D1B00] mb-2">No matches found</h3>
                <p className="text-[#A5846E] max-w-md mx-auto">
                  Try adjusting your filters or search terms to discover more beautiful furniture pieces.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8' 
              : 'flex flex-col gap-6'
            }>
              {sortedMatches.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                  whileHover={{ y: -8 }}
                >
                  <Card className={`h-full bg-white/85 backdrop-blur-md border-[#DCD8CF]/40 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 ${
                    viewMode === 'list' ? 'flex flex-row items-center' : ''
                  }`}>
                    {/* Image Container */}
                    <div className={`relative overflow-hidden ${
                      viewMode === 'list' ? 'w-48 h-32 flex-shrink-0' : 'h-64'
                    }`}>
                      <img
                        src={item.images?.[0] || '/placeholder.svg'}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Content */}
                    <div className={`space-y-4 ${viewMode === 'list' ? 'p-6 flex-1' : 'p-6'}`}>
                      {/* Brand & Category */}
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="border-[#DCD8CF]/60 text-[#A5846E] bg-white/60 backdrop-blur-sm">
                          {item.brand}
                        </Badge>
                        {item.category && (
                          <span className="text-xs text-[#A5846E] uppercase tracking-wide">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className={`font-bold text-[#2D1B00] leading-tight group-hover:text-[#F76A1C] transition-colors duration-300 ${
                        viewMode === 'list' ? 'text-lg' : 'text-xl'
                      }`}>
                        {item.name}
                      </h3>

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-[#F76A1C] drop-shadow-sm ${
                          viewMode === 'list' ? 'text-xl' : 'text-2xl'
                        }`}>
                          ${item.price?.toLocaleString()}
                        </span>
                      </div>

                      {/* Tags */}
                      {item.style && item.style.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {item.style.slice(0, viewMode === 'list' ? 2 : 3).map((tag, tagIndex) => (
                            <Badge
                              key={tagIndex}
                              variant="secondary"
                              className="bg-[#F4E3E1]/60 text-[#A5846E] text-xs px-2 py-1 rounded-full border-0 backdrop-blur-sm"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className={`flex items-center pt-4 ${
                        viewMode === 'list' ? 'space-x-2' : 'space-x-3'
                      }`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-[#DCD8CF]/60 text-[#A5846E] hover:bg-[#F4E3E1]/50 rounded-xl transition-all duration-200 bg-white/60 backdrop-blur-sm"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        
                        <Button
                          className="flex-1 bg-gradient-to-r from-[#F76A1C] to-[#F8A87B] hover:from-[#F8A87B] hover:to-[#F76A1C] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};