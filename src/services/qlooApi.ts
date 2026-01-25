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
  private debug = true; // Using mock data for now - set to false when API is ready

  constructor() {
    this.apiKey = import.meta.env.VITE_QLOO_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ Missing Qloo API key. Set VITE_QLOO_API_KEY in .env file');
    }
  }

  /**
   * Main method to generate taste profile from preferences + image (if any)
   */
  async analyzeTasteProfile(preferences: string, roomImage?: File): Promise<QlooTasteProfile> {
    console.log('🎨 Analyzing taste profile with preferences:', preferences);
    
    if (this.debug) {
      // Simulated mock version
      const mockProfile = {
        styles: this.extractStyles(preferences),
        colors: this.extractColors(preferences),
        materials: this.extractMaterials(preferences),
        brands: this.suggestBrands(preferences),
        aesthetics: this.identifyAesthetics(preferences),
        culturalReferences: this.findCulturalReferences(preferences),
      };
      
      console.log('✅ Generated taste profile:', mockProfile);
      return mockProfile;
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
      console.log('✅ Qloo API response:', result);
      return result;
    } catch (error) {
      console.error('Error analyzing taste profile:', error);
      // Fallback to mock data if API fails
      console.log('🔄 Falling back to mock data');
      return this.analyzeTasteProfile(preferences, roomImage);
    }
  }

  /**
   * Gets real or mock recommendations
   */
  async getFurnitureRecommendations(tasteProfile: QlooTasteProfile, limit = 20, trending = false): Promise<QlooRecommendation[]> {
    console.log('🛋️ Getting furniture recommendations for profile:', tasteProfile);
    
    if (this.debug) {
      const mockRecommendations = [
        {
          id: 'qloo-1',
          name: 'Minimalist Oak Dining Table',
          category: 'Tables',
          style: ['Scandinavian', 'Modern', 'Minimalist'],
          confidence: 0.92,
          reasoning: 'Your preference for clean lines and natural materials aligns perfectly with this piece',
          images: [
            'https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop'
          ],
          price: 799.99,
          brand: 'Nordic Home',
          buyLink: 'https://nordichome.com/oak-dining-table',
          rating: 4.5,
          reviewCount: 120,
          dimensions: { width: '120cm', height: '75cm', depth: '80cm' },
          colorOptions: ['Natural Oak', 'Dark Walnut'],
          storeLocations: [
            { name: 'Nordic Home Showroom', address: '123 Design District, NYC', lat: 40.7128, lng: -74.0060 },
          ],
        },
        {
          id: 'qloo-2',
          name: 'Bouclé Accent Chair',
          category: 'Seating',
          style: ['Contemporary', 'Cozy', 'Textural'],
          confidence: 0.88,
          reasoning: 'The textural bouclé fabric matches your love for tactile, comfortable pieces',
          images: [
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&h=800&fit=crop'
          ],
          price: 499.00,
          brand: 'Comfort Living',
          buyLink: 'https://comfortliving.com/boucle-chair',
          rating: 4.8,
          reviewCount: 85,
          dimensions: { width: '80cm', height: '90cm', depth: '85cm' },
          colorOptions: ['Cream', 'Grey', 'Blush'],
          storeLocations: [
            { name: 'Comfort Living Store', address: '456 Furniture Row, LA', lat: 34.0522, lng: -118.2437 },
          ],
        },
        {
          id: 'qloo-3',
          name: 'Brass Arc Floor Lamp',
          category: 'Lighting',
          style: ['Modern', 'Industrial', 'Contemporary'],
          confidence: 0.85,
          reasoning: 'The warm brass finish complements your sophisticated color palette',
          images: [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=800&fit=crop'
          ],
          price: 299.00,
          brand: 'Lumina Design',
          buyLink: 'https://luminadesign.com/brass-arc-lamp',
          rating: 4.6,
          reviewCount: 203,
          dimensions: { width: '50cm', height: '180cm', depth: '50cm' },
          colorOptions: ['Brass', 'Black', 'Chrome'],
          storeLocations: [
            { name: 'Lumina Showroom', address: '789 Light Ave, Chicago', lat: 41.8781, lng: -87.6298 },
          ],
        },
        {
          id: 'qloo-4',
          name: 'Woven Sage Accent Chair',
          category: 'Seating',
          style: ['Bohemian', 'Modern', 'Eclectic'],
          confidence: 0.90,
          reasoning: 'The organic texture and calming sage color perfectly match your aesthetic preferences',
          images: [
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&h=800&fit=crop'
          ],
          price: 549.00,
          brand: 'Artisan Collective',
          buyLink: 'https://artisancollective.com/sage-chair',
          rating: 4.7,
          reviewCount: 156,
          dimensions: { width: '75cm', height: '85cm', depth: '80cm' },
          colorOptions: ['Sage Green', 'Cream', 'Dusty Rose'],
          storeLocations: [
            { name: 'Artisan Gallery', address: '321 Craft St, Portland', lat: 45.5152, lng: -122.6784 },
          ],
        },
        {
          id: 'qloo-5',
          name: 'Live Edge Walnut Coffee Table',
          category: 'Tables',
          style: ['Modern', 'Rustic Modern', 'Organic'],
          confidence: 0.93,
          reasoning: 'The natural wood grain and organic edge bring authenticity that aligns with your style',
          images: [
            'https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop',
            'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop'
          ],
          price: 899.00,
          originalPrice: 1199.00,
          brand: 'Timber & Stone',
          buyLink: 'https://timberandstone.com/walnut-coffee-table',
          rating: 4.9,
          reviewCount: 89,
          dimensions: { width: '120cm', height: '45cm', depth: '60cm' },
          colorOptions: ['Natural Walnut', 'Dark Walnut'],
          storeLocations: [
            { name: 'Timber & Stone Workshop', address: '654 Wood St, Austin', lat: 30.2672, lng: -97.7431 },
          ],
        }
      ];
      
      console.log('✅ Generated mock recommendations:', mockRecommendations);
      return mockRecommendations;
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
      console.log('✅ Qloo recommendations:', result);
      return result;
    } catch (error) {
      console.error("Error getting recommendations:", error);
      // Fallback to mock data if API fails
      console.log('🔄 Falling back to mock recommendations');
      return this.getFurnitureRecommendations(tasteProfile, limit, trending);
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
