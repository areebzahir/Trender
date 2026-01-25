interface QlooTasteProfile {
  styles: string[];
  colors: string[];
  materials: string[];
  brands: string[];
  aesthetics: string[];
  culturalReferences: string[];
}

interface QlooRecommendation {
  id: string;
  name: string;
  category: string;
  style: string[];
  confidence: number;
  reasoning: string;
  images: string[]; // Added for product images
  price: number; // Added for product price
  originalPrice?: number; // Optional original price
  rating?: number; // Optional rating
  reviewCount?: number; // Optional review count
  dimensions?: { width: string; height: string; depth: string }; // Optional dimensions
  colorOptions?: string[]; // Optional color options
  brand: string; // Added for brand
  buyLink: string; // Added for direct purchase link
  storeLocations?: { name: string; address: string; lat: number; lng: number; }[]; // Added for nearby store locations
}

class QlooService {
  private apiKey: string;
  private baseUrl = 'https://api.qloo.com/v1';
  private debug = false; // Toggle to false in production

  constructor() {
    this.apiKey = import.meta.env.VITE_QLOO_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ Missing Qloo API key. Set VITE_QLOO_API_KEY in .env');
    }
  }

  /**
   * Main method to generate taste profile from preferences + image (if any)
   */
  async analyzeTasteProfile(preferences: string, roomImage?: File): Promise<QlooTasteProfile> {
    if (this.debug) {
      // Simulated mock version
      return {
        styles: this.extractStyles(preferences),
        colors: this.extractColors(preferences),
        materials: this.extractMaterials(preferences),
        brands: this.suggestBrands(preferences),
        aesthetics: this.identifyAesthetics(preferences),
        culturalReferences: this.findCulturalReferences(preferences),
      };
    }

    try {
      const formData = new FormData();
      formData.append("preferences", preferences);
      if (roomImage) formData.append("image", roomImage);

      const response = await fetch(`${this.baseUrl}/taste-profile`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Qloo API error: ${response.status} - ${errorText}`);
      }

      const result: QlooTasteProfile = await response.json();
      return result;
    } catch (error) {
      console.error('Error analyzing taste profile:', error);
      throw new Error('Failed to analyze taste profile');
    }
  }

  /**
   * Gets real or mock recommendations
   */
  async getFurnitureRecommendations(tasteProfile: QlooTasteProfile, limit = 20, trending = false): Promise<QlooRecommendation[]> {
    if (this.debug) {
      return [
        {
          id: 'qloo-1',
          name: 'Minimalist Oak Dining Table',
          category: 'Tables',
          style: ['Scandinavian', 'Modern', 'Minimalist'],
          confidence: 0.92,
          reasoning: 'Your preference for clean lines and natural materials aligns perfectly with this piece',
          images: ['/assets/furniture-showcase.jpg'], // Mock image
          price: 799.99,
          brand: 'Example Brand',
          buyLink: 'https://example.com/product/1',
          rating: 4.5,
          reviewCount: 120,
          dimensions: { width: '120cm', height: '75cm', depth: '80cm' },
          colorOptions: ['Natural Oak', 'Dark Walnut'],
          storeLocations: [
            { name: 'Design Emporium', address: '123 Main St, Anytown', lat: 34.0522, lng: -118.2437 },
          ],
        },
        {
          id: 'qloo-2',
          name: 'Bouclé Accent Chair',
          category: 'Seating',
          style: ['Contemporary', 'Cozy', 'Textural'],
          confidence: 0.88,
          reasoning: 'The textural bouclé fabric matches your love for tactile, comfortable pieces',
          images: ['/assets/furniture-showcase.jpg'], // Mock image
          price: 499.00,
          brand: 'Comfort Living',
          buyLink: 'https://example.com/product/2',
          rating: 4.8,
          reviewCount: 85,
          dimensions: { width: '80cm', height: '90cm', depth: '85cm' },
          colorOptions: ['Cream', 'Grey', 'Blush'],
          storeLocations: [
            { name: 'Urban Home', address: '456 Oak Ave, Anytown', lat: 34.0522, lng: -118.2437 },
          ],
        },
      ];
    }

    try {
      const endpoint = trending ? `${this.baseUrl}/trending/recommendations` : `${this.baseUrl}/recommendations`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify({ tasteProfile, limit }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }

      const result: QlooRecommendation[] = await response.json();
      return result;
    } catch (error) {
      console.error("Error getting recommendations:", error);
      throw new Error("Failed to get recommendations");
    }
  }

  // ========== 🧠 Preference Extractors ==========

  private extractStyles(preferences: string): string[] {
    const styleKeywords = {
      modern: ['modern', 'contemporary', 'sleek', 'clean'],
      scandinavian: ['scandinavian', 'nordic', 'minimalist', 'light wood'],
      bohemian: ['bohemian', 'boho', 'eclectic', 'colorful', 'textured'],
      industrial: ['industrial', 'metal', 'concrete', 'raw', 'urban'],
      'mid-century': ['mid-century', 'retro', 'vintage', '60s', 'atomic'],
      traditional: ['traditional', 'classic', 'formal', 'elegant']
    };
    return this.matchFromKeywords(styleKeywords, preferences, ['modern']);
  }

  private extractColors(preferences: string): string[] {
    const colorKeywords = {
      warm: ['warm', 'cozy', 'terracotta', 'rust', 'orange', 'red'],
      cool: ['cool', 'blue', 'green', 'sage', 'mint'],
      neutral: ['neutral', 'beige', 'cream', 'white', 'gray', 'natural'],
      earth: ['earth', 'brown', 'tan', 'wood', 'natural']
    };
    return this.matchFromKeywords(colorKeywords, preferences, ['neutral']);
  }

  private extractMaterials(preferences: string): string[] {
    const materialKeywords = {
      wood: ['wood', 'oak', 'walnut', 'pine', 'natural'],
      metal: ['metal', 'steel', 'brass', 'iron', 'copper'],
      fabric: ['fabric', 'linen', 'cotton', 'wool', 'soft'],
      leather: ['leather', 'hide', 'suede'],
      glass: ['glass', 'crystal', 'transparent']
    };
    return this.matchFromKeywords(materialKeywords, preferences, ['wood']);
  }

  private suggestBrands(preferences: string): string[] {
    const lower = preferences.toLowerCase();
    const brands: string[] = [];
    if (lower.includes('modern') || lower.includes('contemporary')) brands.push('Article', 'West Elm', 'CB2');
    if (lower.includes('scandinavian') || lower.includes('minimalist')) brands.push('IKEA', 'Muji', 'HAY');
    if (lower.includes('luxury') || lower.includes('high-end')) brands.push('Restoration Hardware', 'Crate & Barrel');
    return brands.length > 0 ? brands : ['Article', 'West Elm'];
  }

  private identifyAesthetics(preferences: string): string[] {
    const aestheticKeywords = {
      japandi: ['japandi', 'japanese', 'zen', 'minimal', 'natural'],
      maximalist: ['maximalist', 'bold', 'colorful', 'eclectic', 'vibrant'],
      cottagecore: ['cottagecore', 'rustic', 'cozy', 'vintage', 'floral'],
      brutalist: ['brutalist', 'concrete', 'raw', 'geometric', 'stark']
    };
    return this.matchFromKeywords(aestheticKeywords, preferences, ['modern']);
  }

  private findCulturalReferences(preferences: string): string[] {
    const culturalKeywords = {
      scandinavian: ['hygge', 'lagom', 'nordic', 'danish'],
      japanese: ['wabi-sabi', 'zen', 'muji', 'minimalism'],
      mediterranean: ['mediterranean', 'coastal', 'rustic', 'warm'],
      industrial: ['brooklyn', 'loft', 'warehouse', 'urban']
    };
    return this.matchFromKeywords(culturalKeywords, preferences, []);
  }

  private matchFromKeywords(
    dictionary: Record<string, string[]>,
    preferences: string,
    fallback: string[] = []
  ): string[] {
    const found: string[] = [];
    const lowerPrefs = preferences.toLowerCase();

    Object.entries(dictionary).forEach(([key, words]) => {
      if (words.some(word => lowerPrefs.includes(word))) {
        found.push(key);
      }
    });

    return found.length > 0 ? found : fallback;
  }
}

export const qlooService = new QlooService();
export type { QlooTasteProfile, QlooRecommendation };
