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
  images: string[];
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  dimensions?: { width: string; height: string; depth: string };
  colorOptions?: string[];
  brand: string;
  buyLink: string;
  storeLocations?: { name: string; address: string; lat: number; lng: number; }[];
}

class QlooService {
  private apiKey: string;
  private baseUrl = 'https://hackathon.api.qloo.com';
  private debug = false; // Set to true to use mock data, false to use real API

  constructor() {
    this.apiKey = 'Y4gNqwXM147eASE5H7NYttv7_cdS6atnHpwTtfwCRw8';
    console.log('🔑 Qloo API initialized with hackathon endpoint');
  }

  /**
   * Main method to generate taste profile from preferences + image (if any)
   */
  async analyzeTasteProfile(preferences: string, roomImage?: File): Promise<QlooTasteProfile> {
    console.log('🎨 Analyzing taste profile with preferences:', preferences);
    
    if (this.debug) {
      return this.getMockTasteProfile(preferences);
    }

    try {
      // First, let's test the connection
      const isConnected = await this.testConnection();
      if (!isConnected) {
        console.warn('⚠️ API connection failed, using mock data');
        return this.getMockTasteProfile(preferences);
      }

      const payload: any = {
        preferences: preferences,
        context: "furniture_interior_design",
        domain: "home_decor"
      };

      // If we have an image, convert it to base64 and include it
      if (roomImage) {
        console.log('📸 Processing room image:', roomImage.name);
        try {
          const base64Image = await this.convertToBase64(roomImage);
          payload.image = {
            data: base64Image,
            mimeType: roomImage.type
          };
        } catch (error) {
          console.warn('Failed to process image, continuing without it:', error);
        }
      }

      console.log('📤 Sending request to Qloo API:', { ...payload, image: payload.image ? '[IMAGE_DATA]' : undefined });

      const response = await fetch(`${this.baseUrl}/taste-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Qloo API error: ${response.status} - ${errorText}`);
        
        // If it's a 404 or endpoint not found, try alternative endpoints
        if (response.status === 404) {
          console.log('🔄 Trying alternative endpoint...');
          return await this.tryAlternativeEndpoints(preferences, roomImage);
        }
        
        throw new Error(`Qloo API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Qloo API response:', result);
      
      // Transform the API response to match our interface
      const tasteProfile: QlooTasteProfile = {
        styles: result.styles || result.design_styles || this.extractStyles(preferences),
        colors: result.colors || result.color_preferences || this.extractColors(preferences),
        materials: result.materials || result.material_preferences || this.extractMaterials(preferences),
        brands: result.brands || result.preferred_brands || this.suggestBrands(preferences),
        aesthetics: result.aesthetics || result.aesthetic_preferences || this.identifyAesthetics(preferences),
        culturalReferences: result.culturalReferences || result.cultural_influences || this.findCulturalReferences(preferences),
      };

      return tasteProfile;
    } catch (error) {
      console.error('Error analyzing taste profile:', error);
      console.log('🔄 Falling back to mock data due to API error');
      return this.getMockTasteProfile(preferences);
    }
  }

  /**
   * Try alternative API endpoints if the main one fails
   */
  private async tryAlternativeEndpoints(preferences: string, roomImage?: File): Promise<QlooTasteProfile> {
    const alternativeEndpoints = [
      '/v1/taste-profile',
      '/api/taste-profile',
      '/profile/analyze',
      '/analyze'
    ];

    for (const endpoint of alternativeEndpoints) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        
        const payload = {
          text: preferences,
          preferences: preferences,
          context: "furniture_interior_design",
          domain: "home_decor"
        };

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
            "x-api-key": this.apiKey,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Success with endpoint ${endpoint}:`, result);
          
          return {
            styles: result.styles || result.design_styles || this.extractStyles(preferences),
            colors: result.colors || result.color_preferences || this.extractColors(preferences),
            materials: result.materials || result.material_preferences || this.extractMaterials(preferences),
            brands: result.brands || result.preferred_brands || this.suggestBrands(preferences),
            aesthetics: result.aesthetics || result.aesthetic_preferences || this.identifyAesthetics(preferences),
            culturalReferences: result.culturalReferences || result.cultural_influences || this.findCulturalReferences(preferences),
          };
        }
      } catch (error) {
        console.log(`❌ Endpoint ${endpoint} failed:`, error);
        continue;
      }
    }

    // If all endpoints fail, return mock data
    console.log('🔄 All endpoints failed, using mock data');
    return this.getMockTasteProfile(preferences);
  }

  /**
   * Gets furniture recommendations from Qloo API
   */
  async getFurnitureRecommendations(tasteProfile: QlooTasteProfile, limit = 20): Promise<QlooRecommendation[]> {
    console.log('🛋️ Getting furniture recommendations for profile:', tasteProfile);
    
    if (this.debug) {
      return this.getMockRecommendations();
    }

    try {
      const payload = {
        taste_profile: tasteProfile,
        profile: tasteProfile,
        preferences: {
          styles: tasteProfile.styles,
          colors: tasteProfile.colors,
          materials: tasteProfile.materials,
          brands: tasteProfile.brands
        },
        limit: limit,
        count: limit,
        category: "furniture",
        domain: "home_decor",
        include_metadata: true,
        include_images: true
      };

      console.log('📤 Sending recommendations request:', payload);

      // Try multiple recommendation endpoints
      const recommendationEndpoints = [
        '/recommendations',
        '/v1/recommendations',
        '/api/recommendations',
        '/recommend',
        '/furniture/recommend'
      ];

      for (const endpoint of recommendationEndpoints) {
        try {
          console.log(`🔄 Trying recommendations endpoint: ${endpoint}`);
          
          const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${this.apiKey}`,
              "x-api-key": this.apiKey,
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Recommendations success with ${endpoint}:`, result);

            // Transform API response to our format
            const items = result.recommendations || result.items || result.data || result.results || [];
            
            if (items.length === 0) {
              console.warn('⚠️ API returned empty recommendations, using mock data');
              return this.getMockRecommendations();
            }

            const recommendations: QlooRecommendation[] = items.map((item: any, index: number) => ({
              id: item.id || item.qloo_id || `qloo-${index + 1}`,
              name: item.name || item.title || item.product_name || `Recommended Item ${index + 1}`,
              category: item.category || item.product_category || 'Furniture',
              style: Array.isArray(item.styles) ? item.styles : 
                     Array.isArray(item.style) ? item.style : 
                     typeof item.style === 'string' ? [item.style] : ['Modern'],
              confidence: item.confidence || item.score || item.match_score || (0.7 + Math.random() * 0.3),
              reasoning: item.reasoning || item.description || item.why_recommended || 'This item matches your taste profile based on your preferences',
              images: this.extractImages(item),
              price: item.price || item.cost || Math.floor(Math.random() * 1000) + 200,
              originalPrice: item.original_price || item.msrp,
              rating: item.rating || item.stars || (4 + Math.random()),
              reviewCount: item.review_count || item.reviews || Math.floor(Math.random() * 200) + 50,
              dimensions: item.dimensions || { width: '80cm', height: '75cm', depth: '60cm' },
              colorOptions: item.color_options || item.colors || item.available_colors || ['Natural', 'Dark'],
              brand: item.brand || item.manufacturer || 'Design Studio',
              buyLink: item.buy_link || item.url || item.purchase_url || 'https://example.com',
              storeLocations: item.store_locations || item.stores
            }));

            return recommendations;
          } else {
            const errorText = await response.text();
            console.log(`❌ Endpoint ${endpoint} failed: ${response.status} - ${errorText}`);
          }
        } catch (error) {
          console.log(`❌ Endpoint ${endpoint} error:`, error);
          continue;
        }
      }

      // If all endpoints fail, return mock data
      console.log('🔄 All recommendation endpoints failed, using mock data');
      return this.getMockRecommendations();

    } catch (error) {
      console.error("Error getting recommendations:", error);
      console.log('🔄 Falling back to mock recommendations due to API error');
      return this.getMockRecommendations();
    }
  }

  /**
   * Extract images from API response with fallbacks
   */
  private extractImages(item: any): string[] {
    const fallbackImages = [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop'
    ];

    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      return item.images;
    }
    
    if (item.image && typeof item.image === 'string') {
      return [item.image];
    }
    
    if (item.image_url && typeof item.image_url === 'string') {
      return [item.image_url];
    }
    
    if (item.photo && typeof item.photo === 'string') {
      return [item.photo];
    }

    return fallbackImages;
  }

  /**
   * Test API connectivity with multiple endpoints
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Qloo API connection...');
      
      // Try health check endpoints
      const healthEndpoints = [
        '/health',
        '/status',
        '/ping',
        '/',
        '/v1/health'
      ];

      for (const endpoint of healthEndpoints) {
        try {
          console.log(`🔄 Testing endpoint: ${endpoint}`);
          
          const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${this.apiKey}`,
              "x-api-key": this.apiKey,
            },
          });

          if (response.ok) {
            console.log(`✅ Qloo API connection successful via ${endpoint}`);
            return true;
          } else {
            console.log(`⚠️ Endpoint ${endpoint} returned: ${response.status}`);
          }
        } catch (error) {
          console.log(`❌ Endpoint ${endpoint} failed:`, error);
          continue;
        }
      }

      // If health checks fail, try a simple POST request to see if the API is responsive
      try {
        console.log('🔄 Testing with simple POST request...');
        const response = await fetch(`${this.baseUrl}/test`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
            "x-api-key": this.apiKey,
          },
          body: JSON.stringify({ test: true }),
        });

        // Even if it returns an error, if we get a response, the API is reachable
        console.log(`📡 API is reachable, status: ${response.status}`);
        return true;
      } catch (error) {
        console.error('❌ Complete API connection failure:', error);
        return false;
      }
    } catch (error) {
      console.error('❌ Qloo API connection error:', error);
      return false;
    }
  }

  /**
   * Convert file to base64
   */
  private convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1]; // Strip `data:image/...;base64,`
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  // ========== 🎭 Mock Data Methods ==========

  private getMockTasteProfile(preferences: string): QlooTasteProfile {
    console.log('🎭 Using mock taste profile for preferences:', preferences);
    return {
      styles: this.extractStyles(preferences),
      colors: this.extractColors(preferences),
      materials: this.extractMaterials(preferences),
      brands: this.suggestBrands(preferences),
      aesthetics: this.identifyAesthetics(preferences),
      culturalReferences: this.findCulturalReferences(preferences),
    };
  }

  private getMockRecommendations(): QlooRecommendation[] {
    console.log('🎭 Using mock recommendations');
    return [
      {
        id: 'qloo-1',
        name: 'Minimalist Oak Dining Table',
        category: 'Tables',
        style: ['Scandinavian', 'Modern', 'Minimalist'],
        confidence: 0.92,
        reasoning: 'Your preference for clean lines and natural materials aligns perfectly with this piece. The oak construction and minimalist design create the sophisticated yet approachable aesthetic you\'re drawn to.',
        images: [
          'https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop'
        ],
        price: 799,
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
        reasoning: 'The textural bouclé fabric matches your love for tactile, comfortable pieces. This chair brings warmth and visual interest while maintaining the sophisticated aesthetic you prefer.',
        images: [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&h=800&fit=crop'
        ],
        price: 499,
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
        reasoning: 'The warm brass finish complements your sophisticated color palette perfectly. This arc design adds functional elegance while creating beautiful ambient lighting in your space.',
        images: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=800&fit=crop'
        ],
        price: 299,
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
        reasoning: 'The organic texture and calming sage color perfectly match your aesthetic preferences. This piece brings natural elements into your space while maintaining contemporary appeal.',
        images: [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&h=800&fit=crop'
        ],
        price: 549,
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
        reasoning: 'The natural wood grain and organic edge bring authenticity that aligns perfectly with your style preferences. This piece celebrates natural materials while maintaining modern sophistication.',
        images: [
          'https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=800&fit=crop'
        ],
        price: 899,
        originalPrice: 1199,
        brand: 'Timber & Stone',
        buyLink: 'https://timberandstone.com/walnut-coffee-table',
        rating: 4.9,
        reviewCount: 89,
        dimensions: { width: '120cm', height: '45cm', depth: '60cm' },
        colorOptions: ['Natural Walnut', 'Dark Walnut'],
        storeLocations: [
          { name: 'Timber & Stone Workshop', address: '654 Wood St, Austin', lat: 30.2672, lng: -97.7431 },
        ],
      },
      {
        id: 'qloo-6',
        name: 'Ceramic Vase Collection',
        category: 'Decor',
        style: ['Modern', 'Minimalist', 'Artisanal'],
        confidence: 0.87,
        reasoning: 'These handcrafted pieces add organic texture while maintaining clean aesthetic lines. The collection brings artisanal quality to your curated space.',
        images: [
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&h=800&fit=crop'
        ],
        price: 129,
        originalPrice: 159,
        brand: 'Clay Studio',
        buyLink: 'https://claystudio.com/vase-collection',
        rating: 4.4,
        reviewCount: 92,
        dimensions: { width: '15cm', height: '25cm', depth: '15cm' },
        colorOptions: ['Cream', 'Terracotta', 'Sage', 'Charcoal'],
        storeLocations: [
          { name: 'Clay Studio Gallery', address: '987 Art District, Seattle', lat: 47.6062, lng: -122.3321 },
        ],
      },
      {
        id: 'qloo-7',
        name: 'Modular Sectional Sofa',
        category: 'Seating',
        style: ['Contemporary', 'Modular', 'Comfortable'],
        confidence: 0.91,
        reasoning: 'This modular design offers flexibility while maintaining the clean lines you appreciate. The neutral fabric and contemporary silhouette make it perfect for your evolving space.',
        images: [
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&h=800&fit=crop'
        ],
        price: 1299,
        originalPrice: 1599,
        brand: 'Modern Living',
        buyLink: 'https://modernliving.com/modular-sectional',
        rating: 4.6,
        reviewCount: 234,
        dimensions: { width: '240cm', height: '85cm', depth: '160cm' },
        colorOptions: ['Light Grey', 'Charcoal', 'Cream'],
        storeLocations: [
          { name: 'Modern Living Showroom', address: '456 Design Ave, Miami', lat: 25.7617, lng: -80.1918 },
        ],
      },
      {
        id: 'qloo-8',
        name: 'Industrial Bookshelf',
        category: 'Storage',
        style: ['Industrial', 'Modern', 'Functional'],
        confidence: 0.84,
        reasoning: 'The combination of wood and metal speaks to your appreciation for mixed materials. This piece offers both storage and display opportunities while adding architectural interest.',
        images: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1549497538-303791108f95?w=800&h=800&fit=crop'
        ],
        price: 449,
        brand: 'Urban Forge',
        buyLink: 'https://urbanforge.com/industrial-bookshelf',
        rating: 4.5,
        reviewCount: 167,
        dimensions: { width: '120cm', height: '180cm', depth: '35cm' },
        colorOptions: ['Natural Wood', 'Dark Walnut'],
        storeLocations: [
          { name: 'Urban Forge Workshop', address: '789 Industrial Blvd, Denver', lat: 39.7392, lng: -104.9903 },
        ],
      }
    ];
  }

  // ========== 🧠 Preference Extractors ==========

  private extractStyles(preferences: string): string[] {
    const styleKeywords = {
      modern: ['modern', 'contemporary', 'sleek', 'clean', 'minimal'],
      scandinavian: ['scandinavian', 'nordic', 'minimalist', 'light wood', 'hygge'],
      bohemian: ['bohemian', 'boho', 'eclectic', 'colorful', 'textured', 'layered'],
      industrial: ['industrial', 'metal', 'concrete', 'raw', 'urban', 'loft'],
      'mid-century': ['mid-century', 'retro', 'vintage', '60s', 'atomic', 'mcm'],
      traditional: ['traditional', 'classic', 'formal', 'elegant', 'timeless'],
      rustic: ['rustic', 'farmhouse', 'country', 'reclaimed', 'weathered'],
      transitional: ['transitional', 'blend', 'mixed', 'balanced']
    };
    return this.matchFromKeywords(styleKeywords, preferences, ['modern', 'contemporary']);
  }

  private extractColors(preferences: string): string[] {
    const colorKeywords = {
      warm: ['warm', 'cozy', 'terracotta', 'rust', 'orange', 'red', 'amber'],
      cool: ['cool', 'blue', 'green', 'sage', 'mint', 'teal', 'navy'],
      neutral: ['neutral', 'beige', 'cream', 'white', 'gray', 'natural', 'taupe'],
      earth: ['earth', 'brown', 'tan', 'wood', 'natural', 'ochre'],
      bold: ['bold', 'vibrant', 'bright', 'colorful', 'statement'],
      monochrome: ['monochrome', 'black', 'white', 'grayscale']
    };
    return this.matchFromKeywords(colorKeywords, preferences, ['neutral', 'warm']);
  }

  private extractMaterials(preferences: string): string[] {
    const materialKeywords = {
      wood: ['wood', 'oak', 'walnut', 'pine', 'natural', 'timber', 'bamboo'],
      metal: ['metal', 'steel', 'brass', 'iron', 'copper', 'aluminum'],
      fabric: ['fabric', 'linen', 'cotton', 'wool', 'soft', 'textile', 'upholstered'],
      leather: ['leather', 'hide', 'suede', 'faux leather'],
      glass: ['glass', 'crystal', 'transparent', 'acrylic'],
      stone: ['stone', 'marble', 'granite', 'concrete', 'ceramic'],
      rattan: ['rattan', 'wicker', 'cane', 'natural fiber']
    };
    return this.matchFromKeywords(materialKeywords, preferences, ['wood', 'fabric']);
  }

  private suggestBrands(preferences: string): string[] {
    const lower = preferences.toLowerCase();
    const brands: string[] = [];
    
    if (lower.includes('modern') || lower.includes('contemporary')) {
      brands.push('Article', 'West Elm', 'CB2', 'Design Within Reach');
    }
    if (lower.includes('scandinavian') || lower.includes('minimalist')) {
      brands.push('IKEA', 'Muji', 'HAY', 'String Furniture');
    }
    if (lower.includes('luxury') || lower.includes('high-end')) {
      brands.push('Restoration Hardware', 'Crate & Barrel', 'Pottery Barn');
    }
    if (lower.includes('affordable') || lower.includes('budget')) {
      brands.push('IKEA', 'Target', 'Wayfair', 'Overstock');
    }
    if (lower.includes('vintage') || lower.includes('mid-century')) {
      brands.push('Herman Miller', 'Knoll', 'Eames', 'Vintage');
    }
    
    return brands.length > 0 ? brands : ['Article', 'West Elm', 'CB2'];
  }

  private identifyAesthetics(preferences: string): string[] {
    const aestheticKeywords = {
      japandi: ['japandi', 'japanese', 'zen', 'minimal', 'natural', 'wabi-sabi'],
      maximalist: ['maximalist', 'bold', 'colorful', 'eclectic', 'vibrant', 'layered'],
      cottagecore: ['cottagecore', 'rustic', 'cozy', 'vintage', 'floral', 'pastoral'],
      brutalist: ['brutalist', 'concrete', 'raw', 'geometric', 'stark'],
      biophilic: ['biophilic', 'nature', 'plants', 'organic', 'natural light'],
      grandmillennial: ['grandmillennial', 'traditional', 'chinoiserie', 'floral', 'antique']
    };
    return this.matchFromKeywords(aestheticKeywords, preferences, ['modern', 'contemporary']);
  }

  private findCulturalReferences(preferences: string): string[] {
    const culturalKeywords = {
      scandinavian: ['hygge', 'lagom', 'nordic', 'danish', 'swedish'],
      japanese: ['wabi-sabi', 'zen', 'muji', 'minimalism', 'ma'],
      mediterranean: ['mediterranean', 'coastal', 'rustic', 'warm', 'terracotta'],
      industrial: ['brooklyn', 'loft', 'warehouse', 'urban', 'converted'],
      parisian: ['parisian', 'french', 'chic', 'elegant', 'classic'],
      californian: ['californian', 'laid-back', 'natural', 'indoor-outdoor']
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