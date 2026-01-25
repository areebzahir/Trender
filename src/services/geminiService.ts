class GeminiService {
    private apiKey: string;
    private baseTextUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    private baseVisionUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";
  
    constructor() {
      this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
      if (!this.apiKey) {
        console.warn("⚠️ Gemini API key is missing. Set VITE_GEMINI_API_KEY in .env");
      }
    }
  
    /**
     * Generates text-only response (no image) from Gemini-Pro
     * @param prompt The prompt to send
     */
    async generateText(prompt: string): Promise<string> {
      if (!this.apiKey) return "[Gemini API key missing]";
  
      try {
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
  
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "[No response from Gemini]";
      } catch (err) {
        console.error("Gemini text generation error:", err);
        return "[Error generating content]";
      }
    }
  
    /**
     * Generates response based on image + prompt (Gemini-Pro Vision)
     * @param prompt The prompt to accompany image
     * @param imageFile Image file to analyze
     */
    async generateVisionResponse(prompt: string, imageFile: File): Promise<string> {
      if (!this.apiKey) return "[Gemini API key missing]";
  
      try {
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
  
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "[No response from Gemini Vision]";
      } catch (err) {
        console.error("Gemini Vision generation error:", err);
        return "[Error generating image content]";
      }
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
  