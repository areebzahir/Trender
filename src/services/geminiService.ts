class GeminiService {
    private apiKey: string;
    private baseTextUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    private baseVisionUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";
  
    constructor() {
      this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
      if (!this.apiKey) {
        console.warn("⚠️ Gemini API key is missing. Set VITE_GEMINI_API_KEY in .env file");
      }
    }
  
    /**
     * Generates text-only response (no image) from Gemini-Pro
     * @param prompt The prompt to send
     */
    async generateText(prompt: string): Promise<string> {
      if (!this.apiKey) {
        console.warn("🔑 Gemini API key missing, using fallback response");
        return this.getFallbackTextResponse(prompt);
      }
  
      try {
        console.log("🤖 Generating text with Gemini:", prompt.substring(0, 100) + "...");
        
        const response = await fetch(`${this.baseTextUrl}?key=${this.apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ]
          })
        });
  
        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "[No response from Gemini]";
        console.log("✅ Gemini text response received");
        return result;
      } catch (err) {
        console.error("Gemini text generation error:", err);
        return this.getFallbackTextResponse(prompt);
      }
    }
  
    /**
     * Generates response based on image + prompt (Gemini-Pro Vision)
     * @param prompt The prompt to accompany image
     * @param imageFile Image file to analyze
     */
    async generateVisionResponse(prompt: string, imageFile: File): Promise<string> {
      if (!this.apiKey) {
        console.warn("🔑 Gemini API key missing, using fallback response");
        return this.getFallbackVisionResponse(prompt, imageFile);
      }
  
      try {
        console.log("👁️ Analyzing image with Gemini Vision:", imageFile.name);
        
        const base64Image = await this.convertToBase64(imageFile);
        const response = await fetch(`${this.baseVisionUrl}?key=${this.apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  },
                  {
                    inlineData: {
                      mimeType: imageFile.type,
                      data: base64Image
                    }
                  }
                ]
              }
            ]
          })
        });
  
        if (!response.ok) {
          throw new Error(`Gemini Vision API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "[No response from Gemini Vision]";
        console.log("✅ Gemini Vision response received");
        return result;
      } catch (err) {
        console.error("Gemini Vision generation error:", err);
        return this.getFallbackVisionResponse(prompt, imageFile);
      }
    }
  
    /**
     * Provides fallback text response when API is unavailable
     */
    private getFallbackTextResponse(prompt: string): string {
      const fallbacks = [
        "Your style preferences suggest a sophisticated taste for modern design with warm, inviting elements. You appreciate quality craftsmanship and pieces that tell a story.",
        "Based on your choices, you're drawn to contemporary aesthetics with natural materials and thoughtful design details that create a harmonious living space.",
        "Your design sensibility leans toward curated, intentional pieces that balance form and function while reflecting your personal aesthetic journey."
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    /**
     * Provides fallback vision response when API is unavailable
     */
    private getFallbackVisionResponse(prompt: string, imageFile: File): string {
      return `Your uploaded room image shows a space with great potential for thoughtful furniture curation. The lighting and layout suggest you appreciate both comfort and style, making it perfect for pieces that blend functionality with aesthetic appeal.`;
    }

    /**
     * Converts an image file to base64
     * @param file File to convert
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
  }
  
  export const geminiService = new GeminiService();
  