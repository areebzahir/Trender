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

// Pinned first card — shown only on the first swipe in TrenderSwipeScreen
export const pinnedFirstCard: FurnitureItem = {
  id: "pinned-spadina",
  name: "Spadina Sofa – Auckland Willow",
  category: "Seating",
  brand: "Blueprint Home",
  price: 2199,
  images: [
    "https://cdn.shopify.com/s/files/1/0073/0166/0725/files/SpadinaSofa-AucklandWillow-L01.jpg?v=1775588655"
  ],
  description: "The Spadina Sofa combines clean lines with plush comfort. Upholstered in Auckland Willow fabric, its timeless silhouette fits seamlessly into modern and transitional interiors.",
  dimensions: {
    width: "90\"",
    height: "33\"",
    depth: "38\""
  },
  colorOptions: [
    { name: "Auckland Willow", hex: "#C8BFA8", image: "https://cdn.shopify.com/s/files/1/0073/0166/0725/files/SpadinaSofa-AucklandWillow-L01.jpg?v=1775588655" }
  ],
  style: ["Modern", "Contemporary", "Minimalist"],
  materials: ["Performance Fabric", "Solid Wood Frame", "High-Density Foam"],
  careInstructions: ["Spot clean with mild detergent", "Vacuum regularly", "Avoid direct sunlight"],
  features: ["Clean-line silhouette", "High-density foam cushions", "Solid wood frame", "Performance fabric"],
  rating: 4.8,
  reviewCount: 47,
  inStock: true,
  buyLink: "https://blueprinthome.com/products/spadina-sofa?variant=48080284680414",
  whyMatch: "The Spadina's clean minimalist silhouette and neutral Auckland Willow fabric make it a perfect match for your modern living space."
};

export const sampleFurniture: FurnitureItem[] = [
  {
    id: "1",
    name: "Lenae Velvet Modular Sofa",
    category: "Seating",
    brand: "Article",
    price: 2299,
    originalPrice: 2599,
    images: [
      "/lovable-uploads/leane12.png",
      "/lovable-uploads/leane1 (1).jpg",
      "/lovable-uploads/leane1 (2).jpg",
      "/lovable-uploads/leane1 (3).jpg",
      "/lovable-uploads/leane1 (4).jpg"
    ],
    description: "A collection for every space. Whether it's a cozy apartment nook or a dedicated home cinema room, Lenae's modular design allows you to create a sofa that is uniquely yours. With plump, high-density foam-filled cushions and a variety of fabric choices, Lenae offers a variety of options. Pre-made sets and individual modular pieces, there's something for every space.",
    dimensions: {
      width: "104.5\"",
      height: "34.25\"",
      depth: "38\"",
      weight: "169.75 lbs"
    },
    colorOptions: [
      { name: "Red Velvet", hex: "#8B0000", image: "/lovable-uploads/leane1 (1).jpg" }
    ],
    style: ["Scandinavian", "Modern", "Contemporary"],
    materials: ["Velvet", "Solid Wood Frame", "High-Density Foam", "S-springs", "Elastic Webbing"],
    careInstructions: ["Blot spills with dry cloth", "Gently brush fabric to restore nap", "Dry clean only for persistent stains", "Fluff cushions regularly", "Avoid chemical cleaners"],
    features: ["Modular design", "High-density foam cushions", "Rubber webbing suspension", "Solid wood frame", "50,000 rub Martindale test", "Fade-resistant fabric", "Anti-crush velvet", "Easy assembly (15 minutes)"],
    rating: 4.8,
    reviewCount: 1,
    inStock: true,
    buyLink: "https://article.com",
    whyMatch: "The Hale Rust velvet color and Scandinavian design perfectly match your modern minimalist style. The modular design allows for flexible configuration to suit your living space perfectly."
  },
  {
    id: "2",
    name: "Gwyneth 68\" Light Blue Velvet Loveseat by goop",
    category: "Seating",
    brand: "goop",
    price: 2362,
    originalPrice: 3149,
    images: [
      "/lovable-uploads/6th.png",
      "/lovable-uploads/CB2 (1).jpg",
      "/lovable-uploads/CB2 (2).jpg",
      "/lovable-uploads/CB2 (3).jpg",
      "/lovable-uploads/CB2 (4).jpg"
    ],
    description: "Plush loveseat from goop is \"proof that things don't have to be cold and hard to be chic,\" says Gwyneth Paltrow. \"We're taking the compromise out of the equation with chic furniture that's to be lived in and loved.\" Covered in a smooth velvet fabric in an elegant shade of ice blue, the loveseat feels slightly vintage with a mod silhouette that highlights the high-end upholstery. CB2 exclusive.",
    dimensions: {
      width: "68\"",
      height: "29\"",
      depth: "35.5\"",
      weight: "85 lbs"
    },
    colorOptions: [
      { name: "Light Blue Velvet", hex: "#87CEEB", image: "/lovable-uploads/CB2 (1).jpg" }
    ],
    style: ["Modern", "Vintage", "Chic", "Contemporary"],
    materials: ["Cotton-poly blend velvet", "Engineered wood", "Sinuous wire spring suspension"],
    careInstructions: ["Blot spills immediately with clean, dry cloth", "Spot clean with water-free stain remover", "Professional upholstery cleaning recommended", "Vacuum with handheld attachment", "Rotate cushion periodically", "Avoid direct sunlight"],
    features: ["Hand-assembled frame", "Kiln-dried engineered wood", "Hand-pulled sinuous wire spring suspension", "FSC® Certified sustainable wood", "Made in Vietnam", "CB2 exclusive"],
    rating: 4.7,
    reviewCount: 1,
    inStock: true,
    buyLink: "https://cb2.com",
    whyMatch: "The elegant light blue velvet and vintage-mod silhouette perfectly complements your sophisticated taste. This loveseat brings both comfort and chic style to any living space."
  },
  {
    id: "3",
    name: "Curvo 75\" White Performance Fabric Apartment Sofa by goop",
    category: "Seating",
    brand: "goop",
    price: 3899,
    originalPrice: 3899,
    images: [
      "/lovable-uploads/2d.png",
      "/lovable-uploads/ALB1 (1).jpg",
      "/lovable-uploads/ALB1 (2).jpg",
      "/lovable-uploads/ALB1 (3).jpg",
      "/lovable-uploads/ALB1 (4).jpg"
    ],
    description: "A goop classic, now upholstered in our favorite snow white performance fabric. As Gwyneth Paltrow says: \"It's a nod to Italian midcentury designs by way of its fluid lines.\" The undeniably elegant form doesn't sacrifice on comfort, either: enveloped in a softly textured and durable fabric, its soft crescent shape perches on champagne-finish legs for a light, loungey look. Well-scaled for apartment living. CB2 exclusive.",
    dimensions: {
      width: "75\"",
      height: "31\"",
      depth: "37.5\"",
      weight: "120 lbs"
    },
    colorOptions: [
      { name: "Snow White Performance Fabric", hex: "#FFFFFF", image: "/lovable-uploads/ALB1 (1).jpg" }
    ],
    style: ["Mid-Century Modern", "Italian Design", "Contemporary", "Apartment Living"],
    materials: ["Poly-cotton performance fabric", "Engineered wood", "Sinuous wire spring suspension", "Stainless steel legs"],
    careInstructions: ["Blot spills immediately with clean, absorbent cloth", "Spot clean with damp cloth and mild detergent", "Professional upholstery cleaning recommended", "Vacuum with handheld attachment", "Rotate cushion periodically", "Refer to deck label for care information"],
    features: ["Designed by goop exclusively for CB2", "FSC® Certified sustainable wood", "Hand-pulled sinuous wire spring suspension", "Stainless steel legs with champagne finish", "Performance fabric", "Well-scaled for apartment living"],
    rating: 4.8,
    reviewCount: 115,
    inStock: true,
    buyLink: "https://cb2.com",
    whyMatch: "The elegant Italian midcentury design with fluid lines perfectly matches your sophisticated taste. The snow white performance fabric and champagne-finish legs create a light, loungey look that's ideal for your living space."
  },
  {
    id: "4",
    name: "FINNALA Sofa with chaise lounge, Gunnared beige",
    category: "Seating",
    brand: "IKEA",
    price: 1549,
    originalPrice: 2049,
    images: [
      "/lovable-uploads/e3.png",
      "/lovable-uploads/ikea (1).avif",
      "/lovable-uploads/ikea (2).avif",
      "/lovable-uploads/ikea (3).avif",
      "/lovable-uploads/ikea (4).avif"
    ],
    description: "FINNALA sectional sofa can grow and change with a home and the family. Choose how many seats, the look and function to create a sofa that suits you. A clean design and long-lasting comfort are included.",
    dimensions: {
      width: "322 cm (126 3/4\")",
      height: "85 cm (33 1/2\")",
      depth: "98 cm (38 5/8\")",
      weight: "150 lbs"
    },
    colorOptions: [
      { name: "Gunnared Beige", hex: "#D2B48C", image: "/lovable-uploads/ikea (1).avif" }
    ],
    style: ["Scandinavian", "Modular", "Contemporary", "Family-Friendly"],
    materials: ["Polyester fabric", "Engineered wood", "High-resilience polyurethane foam", "Pocket springs"],
    careInstructions: ["Vacuum regularly", "Spot clean with mild detergent", "Professional cleaning recommended", "Rotate cushions periodically", "Keep away from direct sunlight"],
    features: ["Modular design", "Chaise lounge included", "Removable covers", "High-resilience foam cushions", "Pocket spring construction", "Family-friendly design", "Easy assembly"],
    rating: 4.6,
    reviewCount: 89,
    inStock: true,
    buyLink: "https://ikea.com",
    whyMatch: "The modular FINNALA design with chaise lounge perfectly suits your family's needs. The clean Scandinavian design and long-lasting comfort make it ideal for your living space."
  },
  {
    id: "5",
    name: "Rodez 105\" Saddle Leather Sofa",
    category: "Seating",
    brand: "Studio ANANSI",
    price: 15799,
    originalPrice: 15799,
    images: [
      "/lovable-uploads/4thy.png",
      "/lovable-uploads/cra1 (1).jpg",
      "/lovable-uploads/cra1 (2).jpg",
      "/lovable-uploads/cra1 (3).jpg",
      "/lovable-uploads/cra1 (4).jpg"
    ],
    description: "Low-slung leather sofa by Studio ANANSI is a modern classic. Featuring a welt trim along the perimeter, the oversized frame is wrapped in Moore & Giles full-grain leather with a delicate ruched detail. Crafted by a third generation tannery, the hand-stained leather upholstery is individually selected for its inherent markings and characteristics for a naturally worn-in aesthetic. CB2 exclusive.",
    dimensions: {
      width: "105\"",
      height: "26.5\"",
      depth: "40\"",
      weight: "180 lbs"
    },
    colorOptions: [
      { name: "Dakota Leather in Tobacco", hex: "#8B4513", image: "/lovable-uploads/cra1 (1).jpg" }
    ],
    style: ["Modern Classic", "Leather", "Contemporary", "Luxury"],
    materials: ["Moore & Giles full-grain aniline leather", "Engineered hardwood frame", "Sinuous wire suspension", "Foam-poly blend cushions"],
    careInstructions: ["Refer to deck label for care information", "Vacuum and rotate cushion periodically", "Professional leather cleaning recommended", "Vacuum with handheld attachment", "Leather may patina over time", "Avoid direct sunlight"],
    features: ["Designed by Studio ANANSI", "FSC® Certified sustainable wood", "Moore & Giles full-grain leather", "Sinuous wire suspension", "Removable inset legs", "Hand-stained leather", "Naturally worn-in aesthetic"],
    rating: 4.9,
    reviewCount: 12,
    inStock: true,
    buyLink: "https://cb2.com",
    whyMatch: "The luxurious Moore & Giles full-grain leather and modern classic design perfectly complements your sophisticated taste. The hand-stained leather with natural markings creates a timeless, worn-in aesthetic."
  },
  {
    id: "6",
    name: "Serafin 81\" Brown Leather Daybed",
    category: "Seating",
    brand: "Adam Rogers",
    price: 8499,
    originalPrice: 8499,
    images: [
      "/lovable-uploads/3rd.png",
      "/lovable-uploads/fba  (1).jpg",
      "/lovable-uploads/fba  (2).jpg",
      "/lovable-uploads/fba  (3).jpg",
      "/lovable-uploads/fba  (4).jpg"
    ],
    description: "Vintage-inspired daybed by Adam Rogers brings the cool parts of the '70s back in a generously scaled silhouette. Luxe, semi-aniline cowhide leather will patina over time, adding to the \"had this forever\" feel, while the wood base sports a mid-tone walnut veneer that lets the vertical grain detail shine through.",
    dimensions: {
      width: "81\"",
      height: "26.75\"",
      depth: "37\"",
      weight: "140 lbs"
    },
    colorOptions: [
      { name: "Dakota Leather in Harvest", hex: "#8B4513", image: "/lovable-uploads/fba  (1).jpg" }
    ],
    style: ["Vintage", "70s Inspired", "Contemporary", "Luxury"],
    materials: ["Semi-aniline cowhide leather", "Hardwood frame", "Walnut veneer", "Kiln-dried hardwood"],
    careInstructions: ["Blot spills immediately", "Keep out of direct sunlight", "Professional leather cleaning recommended", "Vacuum with handheld attachment", "Leather may patina over time", "Refer to deck label for care information"],
    features: ["Designed by Adam Rogers", "Benchmade construction", "Certified sustainable hardwood", "Semi-aniline cowhide leather", "Walnut veneer base", "Made in Vietnam", "Vintage-inspired design"],
    rating: 4.8,
    reviewCount: 33,
    inStock: true,
    buyLink: "https://cb2.com",
    whyMatch: "The vintage-inspired design with semi-aniline leather perfectly captures the '70s aesthetic you love. The generous silhouette and walnut veneer base create a timeless, lived-in feel that will age beautifully."
  },



];