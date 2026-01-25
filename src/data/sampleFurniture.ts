export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  originalPrice?: number;
  images: string[];
  description: string;
  dimensions: {
    width: string;
    height: string;
    depth: string;
    weight?: string;
  };
  colorOptions: {
    name: string;
    hex: string;
    image: string;
  }[];
  style: string[];
  materials: string[];
  careInstructions: string[];
  features: string[];
  rating: number;
  reviewCount: number;
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
    originalPrice: 2299,
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop"
    ],
    description: "A contemporary modular sofa in warm terracotta fabric with clean lines and comfortable cushioning.",
    dimensions: {
      width: "84\"",
      height: "32\"", 
      depth: "36\"",
      weight: "120 lbs"
    },
    colorOptions: [
      { name: "Terracotta", hex: "#CD853F", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop" },
      { name: "Sage Green", hex: "#9CAF88", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&h=800&fit=crop" },
      { name: "Charcoal", hex: "#36454F", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop" },
      { name: "Cream", hex: "#F5F5DC", image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop" }
    ],
    style: ["Modern", "Mid-Century", "Contemporary"],
    materials: ["Performance Fabric", "Solid Wood Frame", "High-Density Foam"],
    careInstructions: ["Spot clean only", "Avoid direct sunlight", "Professional cleaning recommended"],
    features: ["Modular design", "Removable cushions", "Pet-friendly fabric", "Easy assembly"],
    rating: 4.8,
    reviewCount: 247,
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
    originalPrice: 899,
    images: [
      "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop"
    ],
    description: "Minimalist coffee table crafted from sustainable oak with geometric legs and a natural finish.",
    dimensions: {
      width: "48\"",
      height: "16\"",
      depth: "24\"",
      weight: "45 lbs"
    },
    colorOptions: [
      { name: "Natural Oak", hex: "#D2B48C", image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop" },
      { name: "Walnut", hex: "#8B4513", image: "https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop" },
      { name: "White Oak", hex: "#F5F5DC", image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=800&fit=crop" }
    ],
    style: ["Scandinavian", "Modern", "Minimalist"],
    materials: ["Solid Oak", "Natural Wood Finish"],
    careInstructions: ["Dust with soft cloth", "Use coasters for drinks", "Oil finish yearly"],
    features: ["Sustainable sourcing", "Geometric legs", "Scratch-resistant finish", "Easy assembly"],
    rating: 4.6,
    reviewCount: 189,
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
    originalPrice: 499,
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&h=800&fit=crop"
    ],
    description: "Elegant brass floor lamp with an adjustable arc design, perfect for reading corners.",
    dimensions: {
      width: "20\"",
      height: "78\"",
      depth: "20\"",
      weight: "25 lbs"
    },
    colorOptions: [
      { name: "Brass", hex: "#B5A642", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop" },
      { name: "Black", hex: "#2C2C2C", image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=800&fit=crop" },
      { name: "Chrome", hex: "#C0C0C0", image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&h=800&fit=crop" }
    ],
    style: ["Modern", "Industrial", "Contemporary"],
    materials: ["Brass", "Fabric Shade", "Marble Base"],
    careInstructions: ["Dust with soft cloth", "Polish brass monthly", "Keep away from moisture"],
    features: ["Adjustable height", "Marble base for stability", "Dimmable bulb compatible", "Easy assembly"],
    rating: 4.7,
    reviewCount: 156,
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
    originalPrice: 649,
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&h=800&fit=crop"
    ],
    description: "Cozy accent chair in sage green with a woven texture and curved wooden legs.",
    dimensions: {
      width: "28\"",
      height: "31\"",
      depth: "30\"",
      weight: "35 lbs"
    },
    colorOptions: [
      { name: "Sage Green", hex: "#9CAF88", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop" },
      { name: "Cream", hex: "#F5F5DC", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&h=800&fit=crop" },
      { name: "Dusty Rose", hex: "#DCAE96", image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&h=800&fit=crop" },
      { name: "Charcoal", hex: "#36454F", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop" }
    ],
    style: ["Bohemian", "Modern", "Eclectic"],
    materials: ["Woven Fabric", "Solid Wood", "Cushioned Seat"],
    careInstructions: ["Vacuum regularly", "Spot clean stains", "Rotate cushions for even wear"],
    features: ["Curved wooden legs", "Supportive cushioning", "Breathable fabric", "Compact design"],
    rating: 4.4,
    reviewCount: 203,
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
    originalPrice: 159,
    images: [
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop"
    ],
    description: "Set of three ceramic vases in varying heights with modern geometric shapes.",
    dimensions: {
      width: "6\"-8\"",
      height: "8\"-14\"",
      depth: "6\"-8\"",
      weight: "5-8 lbs each"
    },
    colorOptions: [
      { name: "Cream", hex: "#F5F5DC", image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&h=800&fit=crop" },
      { name: "Terracotta", hex: "#CD853F", image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=800&fit=crop" },
      { name: "Sage", hex: "#9CAF88", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop" },
      { name: "Charcoal", hex: "#36454F", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop" }
    ],
    style: ["Modern", "Contemporary", "Minimalist"],
    materials: ["Ceramic", "Matte Finish"],
    careInstructions: ["Hand wash only", "Use lukewarm water", "Dry immediately"],
    features: ["Set of 3 vases", "Geometric design", "Water-tight construction", "Various heights"],
    rating: 4.5,
    reviewCount: 92,
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
    originalPrice: 1599,
    images: [
      "https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=800&fit=crop"
    ],
    description: "Stunning live edge walnut dining table that celebrates natural wood grain and organic forms.",
    dimensions: {
      width: "72\"",
      height: "30\"",
      depth: "36\"",
      weight: "180 lbs"
    },
    colorOptions: [
      { name: "Natural Walnut", hex: "#8B4513", image: "https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop" },
      { name: "Natural Oak", hex: "#D2B48C", image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop" }
    ],
    style: ["Modern", "Rustic Modern", "Organic"],
    materials: ["Solid Walnut", "Live Edge", "Steel Legs"],
    careInstructions: ["Oil finish annually", "Use coasters and placemats", "Avoid direct heat"],
    features: ["Live edge design", "Solid wood construction", "Steel hairpin legs", "Seats 6-8 people"],
    rating: 4.9,
    reviewCount: 78,
    inStock: false,
    buyLink: "https://crateandbarrel.com",
    whyMatch: "The natural wood grain and organic edge bring warmth and authenticity that aligns perfectly with your style preferences."
  }
];