import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search } from 'lucide-react';

const categories = [
  'All Categories',
  'Seating',
  'Tables',
  'Storage',
  'Lighting',
  'Decor',
];
const sortOptions = [
  'Recently Added',
  'Price Low→High',
  'Price High→Low',
];

interface Props {
  category: string;
  setCategory: (c: string) => void;
  sort: string;
  setSort: (s: string) => void;
  search: string;
  setSearch: (s: string) => void;
}

const Filters: React.FC<Props> = ({ category, setCategory, sort, setSort, search, setSearch }) => {
  const [catOpen, setCatOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
      {/* Category Dropdown */}
      <div className="relative">
        <button
          className="flex items-center bg-white/70 border border-orange-200 rounded-xl px-4 py-2 font-semibold text-orange-700 shadow hover:bg-orange-50 transition"
          onClick={() => setCatOpen((v) => !v)}
        >
          <span className="mr-2">{category}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
        <AnimatePresence>
          {catOpen && (
            <motion.ul
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="absolute left-0 mt-2 w-48 bg-white/90 rounded-xl shadow-lg border border-orange-100 z-10 overflow-hidden"
            >
              {categories.map((c) => (
                <li
                  key={c}
                  className={`px-4 py-2 cursor-pointer hover:bg-orange-100/60 transition ${c === category ? 'bg-orange-50 font-bold' : ''}`}
                  onClick={() => { setCategory(c); setCatOpen(false); }}
                >
                  {c}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      {/* Sort Dropdown */}
      <div className="relative">
        <button
          className="flex items-center bg-white/70 border border-orange-200 rounded-xl px-4 py-2 font-semibold text-orange-700 shadow hover:bg-orange-50 transition"
          onClick={() => setSortOpen((v) => !v)}
        >
          <span className="mr-2">Sort by: {sort}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
        <AnimatePresence>
          {sortOpen && (
            <motion.ul
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="absolute left-0 mt-2 w-48 bg-white/90 rounded-xl shadow-lg border border-orange-100 z-10 overflow-hidden"
            >
              {sortOptions.map((s) => (
                <li
                  key={s}
                  className={`px-4 py-2 cursor-pointer hover:bg-orange-100/60 transition ${s === sort ? 'bg-orange-50 font-bold' : ''}`}
                  onClick={() => { setSort(s); setSortOpen(false); }}
                >
                  {s}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      {/* Search Input */}
      <div className="flex-1 relative max-w-xs">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 w-5 h-5" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or brand"
          className="pl-12 pr-4 py-2 rounded-xl border border-orange-200 bg-white/70 focus:border-orange-400 focus:ring-orange-400/20 text-orange-900 font-medium w-full shadow"
        />
      </div>
    </div>
  );
};

export default Filters; 