export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  image: string;
  description: string;
  dimensions: {
    width: string;
    height: string;
    depth: string;
  };
  colors: string[];
  style: string[];
  materials: string[];
  rating: number;
  inStock: boolean;
  buyLink: string;
  whyMatch?: string;
}

export const sampleFurniture: FurnitureItem[] = [
  {
    id: "1",
    name: "Modular Terracotta Sofa",
    category: "Seating",
    brand: "Article",
    price: 1899,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop",
    description: "A contemporary modular sofa in warm terracotta fabric with clean lines and comfortable cushioning.",
    dimensions: {
      width: "84\"",
      height: "32\"", 
      depth: "36\""
    },
    colors: ["Terracotta", "Sage Green", "Charcoal", "Cream"],
    style: ["Modern", "Mid-Century", "Contemporary"],
    materials: ["Performance Fabric", "Solid Wood Frame", "High-Density Foam"],
    rating: 4.8,
    inStock: true,
    buyLink: "https://article.com",
    whyMatch: "The warm terracotta color and clean lines match your modern aesthetic perfectly. This piece would create a stunning focal point in your living space."
  },
  {
    id: "2", 
    name: "Scandinavian Oak Coffee Table",
    category: "Tables",
    brand: "West Elm",
    price: 699,
    image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop",
    description: "Minimalist coffee table crafted from sustainable oak with geometric legs and a natural finish.",
    dimensions: {
      width: "48\"",
      height: "16\"",
      depth: "24\""
    },
    colors: ["Natural Oak", "Walnut", "White Oak"],
    style: ["Scandinavian", "Modern", "Minimalist"],
    materials: ["Solid Oak", "Natural Wood Finish"],
    rating: 4.6,
    inStock: true,
    buyLink: "https://westelm.com",
    whyMatch: "The natural wood and geometric design align with your preference for organic materials and clean aesthetics."
  },
  {
    id: "3",
    name: "Brass Arc Floor Lamp",
    category: "Lighting",
    brand: "CB2",
    price: 399,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop",
    description: "Elegant brass floor lamp with an adjustable arc design, perfect for reading corners.",
    dimensions: {
      width: "20\"",
      height: "78\"",
      depth: "20\""
    },
    colors: ["Brass", "Black", "Chrome"],
    style: ["Modern", "Industrial", "Contemporary"],
    materials: ["Brass", "Fabric Shade", "Marble Base"],
    rating: 4.7,
    inStock: true,
    buyLink: "https://cb2.com",
    whyMatch: "The warm brass finish complements your color palette, and the arc design adds functional elegance to any room."
  },
  {
    id: "4",
    name: "Woven Sage Accent Chair",
    category: "Seating", 
    brand: "Urban Outfitters",
    price: 549,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop",
    description: "Cozy accent chair in sage green with a woven texture and curved wooden legs.",
    dimensions: {
      width: "28\"",
      height: "31\"",
      depth: "30\""
    },
    colors: ["Sage Green", "Cream", "Dusty Rose", "Charcoal"],
    style: ["Bohemian", "Modern", "Eclectic"],
    materials: ["Woven Fabric", "Solid Wood", "Cushioned Seat"],
    rating: 4.4,
    inStock: true,
    buyLink: "https://urbanoutfitters.com",
    whyMatch: "The soft sage color and organic texture bring the calming, natural vibe you're looking for while adding visual interest."
  },
  {
    id: "5",
    name: "Geometric Ceramic Vase Set",
    category: "Decor",
    brand: "Pottery Barn",
    price: 129,
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&h=800&fit=crop",
    description: "Set of three ceramic vases in varying heights with modern geometric shapes.",
    dimensions: {
      width: "6\"-8\"",
      height: "8\"-14\"",
      depth: "6\"-8\""
    },
    colors: ["Cream", "Terracotta", "Sage", "Charcoal"],
    style: ["Modern", "Contemporary", "Minimalist"],
    materials: ["Ceramic", "Matte Finish"],
    rating: 4.5,
    inStock: true,
    buyLink: "https://potterybarn.com",
    whyMatch: "These geometric shapes echo your modern sensibility while the earthy tones tie into your warm color palette perfectly."
  },
  {
    id: "6",
    name: "Live Edge Walnut Dining Table",
    category: "Tables",
    brand: "Crate & Barrel",
    price: 1299,
    image: "https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop",
    description: "Stunning live edge walnut dining table that celebrates natural wood grain and organic forms.",
    dimensions: {
      width: "72\"",
      height: "30\"",
      depth: "36\""
    },
    colors: ["Natural Walnut", "Natural Oak"],
    style: ["Modern", "Rustic Modern", "Organic"],
    materials: ["Solid Walnut", "Live Edge", "Steel Legs"],
    rating: 4.9,
    inStock: false,
    buyLink: "https://crateandbarrel.com",
    whyMatch: "The natural wood grain and organic edge bring warmth and authenticity that aligns perfectly with your style preferences."
  }
];