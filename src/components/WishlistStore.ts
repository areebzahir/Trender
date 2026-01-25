import create from 'zustand';

export interface WishlistItem {
  id: string;
  image: string;
  title: string;
  brand: string;
  price: number;
  tags: string[];
  link: string;
  category: string;
}

interface WishlistState {
  items: WishlistItem[];
  add: (item: WishlistItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  update: (id: string, item: Partial<WishlistItem>) => void;
}

const WISHLIST_KEY = 'trender_wishlist';

const getInitialWishlist = (): WishlistItem[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(WISHLIST_KEY);
    if (stored) return JSON.parse(stored);
  }
  return [];
};

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: getInitialWishlist(),
  add: (item) => {
    set((state) => {
      const items = [...state.items, item];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
      return { items };
    });
  },
  remove: (id) => {
    set((state) => {
      const items = state.items.filter((item) => item.id !== id);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
      return { items };
    });
  },
  clear: () => {
    set(() => {
      localStorage.removeItem(WISHLIST_KEY);
      return { items: [] };
    });
  },
  update: (id, item) => {
    set((state) => {
      const items = state.items.map((i) => i.id === id ? { ...i, ...item } : i);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
      return { items };
    });
  },
})); 