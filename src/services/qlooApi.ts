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
}

class QlooService {
  private apiKey: string;
  private baseUrl = 'https://api.qloo.com/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_QLOO_API_KEY;
  }

  async analyzeTasteProfile(preferences: string, roomImage?: File): Promise<QlooTasteProfile> {
    try {
      // Simulate Qloo API call for taste analysis
      // In production, this would make actual API calls to Qloo
      const mockProfile: QlooTasteProfile = {
        styles: this.extractStyles(preferences),
        colors: this.extractColors(preferences),
        materials: this.extractMaterials(preferences),
        brands: this.suggestBrands(preferences),
        aesthetics: this.identifyAesthetics(preferences),
        culturalReferences: this.findCulturalReferences(preferences)
      };

      return mockProfile;
    } catch (error) {
      console.error('Error analyzing taste profile:', error);
      throw new Error('Failed to analyze taste profile');
    }
  }

  async getFurnitureRecommendations(tasteProfile: QlooTasteProfile, limit = 20): Promise<QlooRecommendation[]> {
    try {
      // Simulate Qloo recommendations based on taste profile
      const recommendations: QlooRecommendation[] = [
        {
          id: 'qloo-1',
          name: 'Minimalist Oak Dining Table',
          category: 'Tables',
          style: ['Scandinavian', 'Modern', 'Minimalist'],
          confidence: 0.92,
          reasoning: 'Your preference for clean lines and natural materials aligns perfectly with this piece'
        },
        {
          id: 'qloo-2',
          name: 'Bouclé Accent Chair',
          category: 'Seating',
          style: ['Contemporary', 'Cozy', 'Textural'],
          confidence: 0.88,
          reasoning: 'The textural bouclé fabric matches your love for tactile, comfortable pieces'
        }
      ];

      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to get recommendations');
    }
  }

  private extractStyles(preferences: string): string[] {
    const styleKeywords = {
      'modern': ['modern', 'contemporary', 'sleek', 'clean'],
      'scandinavian': ['scandinavian', 'nordic', 'minimalist', 'light wood'],
      'bohemian': ['bohemian', 'boho', 'eclectic', 'colorful', 'textured'],
      'industrial': ['industrial', 'metal', 'concrete', 'raw', 'urban'],
      'mid-century': ['mid-century', 'retro', 'vintage', '60s', 'atomic'],
      'traditional': ['traditional', 'classic', 'formal', 'elegant']
    };

    const foundStyles: string[] = [];
    const lowerPrefs = preferences.toLowerCase();

    Object.entries(styleKeywords).forEach(([style, keywords]) => {
      if (keywords.some(keyword => lowerPrefs.includes(keyword))) {
        foundStyles.push(style);
      }
    });

    return foundStyles.length > 0 ? foundStyles : ['modern', 'contemporary'];
  }

  private extractColors(preferences: string): string[] {
    const colorKeywords = {
      'warm': ['warm', 'cozy', 'terracotta', 'rust', 'orange', 'red'],
      'cool': ['cool', 'blue', 'green', 'sage', 'mint'],
      'neutral': ['neutral', 'beige', 'cream', 'white', 'gray', 'natural'],
      'earth': ['earth', 'brown', 'tan', 'wood', 'natural']
    };

    const foundColors: string[] = [];
    const lowerPrefs = preferences.toLowerCase();

    Object.entries(colorKeywords).forEach(([color, keywords]) => {
      if (keywords.some(keyword => lowerPrefs.includes(keyword))) {
        foundColors.push(color);
      }
    });

    return foundColors.length > 0 ? foundColors : ['neutral', 'warm'];
  }

  private extractMaterials(preferences: string): string[] {
    const materialKeywords = {
      'wood': ['wood', 'oak', 'walnut', 'pine', 'natural'],
      'metal': ['metal', 'steel', 'brass', 'iron', 'copper'],
      'fabric': ['fabric', 'linen', 'cotton', 'wool', 'soft'],
      'leather': ['leather', 'hide', 'suede'],
      'glass': ['glass', 'crystal', 'transparent']
    };

    const foundMaterials: string[] = [];
    const lowerPrefs = preferences.toLowerCase();

    Object.entries(materialKeywords).forEach(([material, keywords]) => {
      if (keywords.some(keyword => lowerPrefs.includes(keyword))) {
        foundMaterials.push(material);
      }
    });

    return foundMaterials.length > 0 ? foundMaterials : ['wood', 'fabric'];
  }

  private suggestBrands(preferences: string): string[] {
    // Based on style preferences, suggest relevant brands
    const lowerPrefs = preferences.toLowerCase();
    const brands: string[] = [];

    if (lowerPrefs.includes('modern') || lowerPrefs.includes('contemporary')) {
      brands.push('Article', 'West Elm', 'CB2');
    }
    if (lowerPrefs.includes('scandinavian') || lowerPrefs.includes('minimalist')) {
      brands.push('IKEA', 'Muji', 'HAY');
    }
    if (lowerPrefs.includes('luxury') || lowerPrefs.includes('high-end')) {
      brands.push('Restoration Hardware', 'Pottery Barn', 'Crate & Barrel');
    }

    return brands.length > 0 ? brands : ['Article', 'West Elm', 'IKEA'];
  }

  private identifyAesthetics(preferences: string): string[] {
    const aestheticKeywords = {
      'japandi': ['japandi', 'japanese', 'zen', 'minimal', 'natural'],
      'maximalist': ['maximalist', 'bold', 'colorful', 'eclectic', 'vibrant'],
      'cottagecore': ['cottagecore', 'rustic', 'cozy', 'vintage', 'floral'],
      'brutalist': ['brutalist', 'concrete', 'raw', 'geometric', 'stark']
    };

    const foundAesthetics: string[] = [];
    const lowerPrefs = preferences.toLowerCase();

    Object.entries(aestheticKeywords).forEach(([aesthetic, keywords]) => {
      if (keywords.some(keyword => lowerPrefs.includes(keyword))) {
        foundAesthetics.push(aesthetic);
      }
    });

    return foundAesthetics.length > 0 ? foundAesthetics : ['modern', 'contemporary'];
  }

  private findCulturalReferences(preferences: string): string[] {
    // Extract cultural references that might influence design taste
    const culturalKeywords = {
      'scandinavian': ['hygge', 'lagom', 'nordic', 'danish'],
      'japanese': ['wabi-sabi', 'zen', 'muji', 'minimalism'],
      'mediterranean': ['mediterranean', 'coastal', 'rustic', 'warm'],
      'industrial': ['brooklyn', 'loft', 'warehouse', 'urban']
    };

    const foundReferences: string[] = [];
    const lowerPrefs = preferences.toLowerCase();

    Object.entries(culturalKeywords).forEach(([reference, keywords]) => {
      if (keywords.some(keyword => lowerPrefs.includes(keyword))) {
        foundReferences.push(reference);
      }
    });

    return foundReferences;
  }
}

export const qlooService = new QlooService();
export type { QlooTasteProfile, QlooRecommendation };