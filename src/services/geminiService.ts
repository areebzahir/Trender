/**
 * GeminiService — client-side utility kept for backward compatibility.
 * NOTE: This service no longer reads API keys from the client bundle.
 * All AI calls that require API keys are handled server-side via Netlify Functions.
 * This file is retained only if other components reference it for non-key operations.
 */
class GeminiService {
  private baseTextUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
  private baseVisionUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";

  /**
   * @deprecated Use the server-side /api/analyze-room endpoint instead.
   * This method is a no-op stub kept for backward compatibility.
   */
  async generateText(_prompt: string): Promise<string> {
    console.warn("geminiService.generateText is deprecated. Use POST /api/analyze-room instead.");
    return "";
  }

  /**
   * @deprecated Use the server-side /api/analyze-room endpoint instead.
   * This method is a no-op stub kept for backward compatibility.
   */
  async generateVisionResponse(_prompt: string, _imageFile: File): Promise<string> {
    console.warn("geminiService.generateVisionResponse is deprecated. Use POST /api/analyze-room instead.");
    return "";
  }
}

export const geminiService = new GeminiService();
