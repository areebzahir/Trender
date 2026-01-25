interface GPTExplanation {
  reasoning: string;
  styleMatch: string;
  personalizedNote: string;
}

interface RoomVisualization {
  description: string;
  placementSuggestions: string[];
  colorHarmony: string;
  styleIntegration: string;
}

class GPTService {
  async generateFurnitureExplanation(
    furnitureName: string,
    userPreferences: string,
    tasteProfile: any
  ): Promise<GPTExplanation> {
    try {
      // Simulate GPT-4 explanation generation
      // In production, this would make actual API calls to OpenAI
      
      const explanations = [
        {
          reasoning: `This ${furnitureName.toLowerCase()} perfectly captures your love for ${tasteProfile.styles?.[0] || 'modern'} design. The clean lines and thoughtful proportions create the sophisticated yet approachable aesthetic you're drawn to.`,
          styleMatch: `${tasteProfile.styles?.[0] || 'Modern'} • ${tasteProfile.colors?.[0] || 'Neutral'} Palette`,
          personalizedNote: `Based on your preferences for ${userPreferences.split(',')[0]?.toLowerCase() || 'contemporary pieces'}, this piece would be a perfect anchor for your space.`
        },
        {
          reasoning: `The ${furnitureName.toLowerCase()} embodies the ${tasteProfile.aesthetics?.[0] || 'contemporary'} vibe you're cultivating. Its ${tasteProfile.materials?.[0] || 'natural'} materials and thoughtful design speak to your refined taste.`,
          styleMatch: `${tasteProfile.materials?.[0] || 'Wood'} & ${tasteProfile.colors?.[0] || 'Warm'} Tones`,
          personalizedNote: `This aligns beautifully with your vision of a space that feels both curated and lived-in.`
        }
      ];

      return explanations[Math.floor(Math.random() * explanations.length)];
    } catch (error) {
      console.error('Error generating explanation:', error);
      return {
        reasoning: `This ${furnitureName.toLowerCase()} matches your style preferences with its thoughtful design and quality craftsmanship.`,
        styleMatch: 'Contemporary Design',
        personalizedNote: 'A great addition to your curated space.'
      };
    }
  }

  async generateRoomVisualization(
    furnitureName: string,
    roomDescription: string,
    userPreferences: string
  ): Promise<RoomVisualization> {
    try {
      // Simulate room visualization description
      return {
        description: `Imagine this ${furnitureName.toLowerCase()} as the centerpiece of your ${roomDescription || 'living space'}. The piece would create a natural focal point while maintaining the flow and functionality you value.`,
        placementSuggestions: [
          'Position near natural light to highlight the materials',
          'Create a conversation area with complementary seating',
          'Allow breathing room around the piece for visual impact'
        ],
        colorHarmony: 'The warm tones would beautifully complement your existing palette while adding depth and richness to the space.',
        styleIntegration: 'This piece bridges your current aesthetic with the elevated, curated look you\'re moving toward.'
      };
    } catch (error) {
      console.error('Error generating room visualization:', error);
      return {
        description: `This ${furnitureName.toLowerCase()} would be a beautiful addition to your space.`,
        placementSuggestions: ['Consider placement for optimal visual impact'],
        colorHarmony: 'Complements your existing color scheme',
        styleIntegration: 'Integrates well with your current style'
      };
    }
  }

  async generateStyleSummary(
    swipeHistory: any[],
    tasteProfile: any
  ): Promise<string> {
    try {
      const likedItems = swipeHistory.filter(item => item.liked);
      const styles = tasteProfile.styles || [];
      const colors = tasteProfile.colors || [];

      return `Your style is emerging as a beautiful blend of ${styles.join(' and ')} influences. You're drawn to pieces that feel both ${colors[0] || 'sophisticated'} and approachable, with an eye for quality materials and thoughtful design. 

Based on your selections, you appreciate furniture that tells a story while serving a purpose. Your ideal space balances comfort with visual interest, creating an environment that feels curated yet lived-in.

Key themes in your taste:
• ${styles[0] || 'Contemporary'} design with ${colors[0] || 'warm'} undertones
• Quality materials like ${tasteProfile.materials?.[0] || 'natural wood'} and ${tasteProfile.materials?.[1] || 'soft fabrics'}
• Pieces that create conversation without overwhelming the space

Your evolving aesthetic suggests someone who values both form and function, with a preference for pieces that will age beautifully and remain relevant for years to come.`;
    } catch (error) {
      console.error('Error generating style summary:', error);
      return 'Your style is developing beautifully with a focus on quality, comfort, and timeless design.';
    }
  }
}

export const gptService = new GPTService();
export type { GPTExplanation, RoomVisualization };