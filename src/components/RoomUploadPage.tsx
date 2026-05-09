import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  ImageIcon,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AIAnalysisResult } from '@/types/api';

// ─── Validation helpers ───────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return 'Only JPEG, PNG, and WebP images are supported.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Image must be 10 MB or smaller.';
  }
  return null;
}

export function isPromptValid(prompt: string): boolean {
  return prompt.trim().length > 0;
}

export function isFormReady(file: File | null, prompt: string): boolean {
  return file !== null && isPromptValid(prompt);
}

// ─── Prompt suggestions ───────────────────────────────────────────────────────

const PROMPT_SUGGESTIONS = [
  'Make this room look modern and cozy',
  'Add a beige sofa and warm lighting',
  'Make this room look luxury under $800',
  'Show me furniture that matches my room colours',
  'Give this room a Scandinavian minimalist feel',
  'Add warm earth tones and natural materials',
];

interface PromptSuggestionsProps {
  onSelect: (suggestion: string) => void;
}

const PromptSuggestions = ({ onSelect }: PromptSuggestionsProps) => (
  <div className="flex flex-wrap gap-2">
    {PROMPT_SUGGESTIONS.map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => onSelect(s)}
        className="text-xs px-3 py-1.5 rounded-full border border-[#DCD8CF] text-[#A5846E] bg-white/60 hover:bg-[#F4E3E1]/60 hover:border-[#F76A1C]/40 hover:text-[#2D1B00] transition-all duration-200 backdrop-blur-sm"
      >
        {s}
      </button>
    ))}
  </div>
);

// ─── Image drop zone ──────────────────────────────────────────────────────────

interface ImageDropZoneProps {
  onFile: (file: File) => void;
  error: string | null;
}

const ImageDropZone = ({ onFile, error }: ImageDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
        isDragging
          ? 'border-[#F76A1C] bg-[#FFF3EE] scale-[1.01]'
          : error
          ? 'border-red-300 bg-red-50/50'
          : 'border-[#DCD8CF] bg-[#F7F4F0]/60 hover:border-[#F76A1C]/60 hover:bg-[#FFF3EE]/40'
      }`}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Upload className="w-10 h-10 text-[#A5846E]" />
      </motion.div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[#2D1B00]">Drop your room photo here</p>
        <p className="text-xs text-[#A5846E] mt-1">or click to browse — JPEG, PNG, WebP up to 10 MB</p>
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface RoomUploadPageProps {
  onAnalysisComplete: (result: AIAnalysisResult) => void;
  onBack: () => void;
}

export const RoomUploadPage = ({ onAnalysisComplete, onBack }: RoomUploadPageProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    const err = validateImageFile(file);
    if (err) {
      setImageError(err);
      return;
    }
    setImageError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
  };

  // ── Form submission pipeline ───────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!isFormReady(imageFile, prompt) || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Convert image to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Strip the data URI prefix: "data:image/jpeg;base64,"
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile!);
      });

      // 2. Analyze room
      const analyzeRes = await fetch('/api/analyze-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, prompt }),
      });
      if (!analyzeRes.ok) {
        const err = await analyzeRes.json().catch(() => ({ error: 'Analysis failed.' }));
        throw new Error(err.error ?? 'Room analysis failed. Please try again.');
      }
      const { analysis } = await analyzeRes.json();

      // 3. Recommend products
      const productsRes = await fetch('/api/recommend-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis }),
      });
      const productsData = productsRes.ok
        ? await productsRes.json()
        : { products: [] };

      // 4. Generate room preview (non-blocking — failure is graceful)
      let previewUrl: string | null = null;
      let isFallbackPreview = true;
      try {
        const productImageUrls = (productsData.products ?? [])
          .slice(0, 3)
          .map((p: { imageUrl: string }) => p.imageUrl);

        const previewRes = await fetch('/api/generate-room-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, productImageUrls, prompt }),
        });
        if (previewRes.ok) {
          const previewData = await previewRes.json();
          previewUrl = previewData.previewUrl ?? null;
          isFallbackPreview = previewData.isFallback ?? true;
        }
      } catch {
        // Preview failure is non-fatal
      }

      // 5. Store image and save session
      let imageUrl = imagePreview ?? '';
      let sessionId = '';
      try {
        const saveRes = await fetch('/api/save-design', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: imagePreview ?? '',
            analysis,
            selectedProductIds: (productsData.products ?? []).map((p: { id: string }) => p.id),
            previewImageUrl: previewUrl,
          }),
        });
        if (saveRes.ok) {
          const saveData = await saveRes.json();
          sessionId = saveData.id ?? '';
        }
      } catch {
        // Save failure is non-fatal
      }

      onAnalysisComplete({
        imageBase64: base64,
        imageUrl,
        analysis,
        products: productsData.products ?? [],
        previewUrl,
        isFallbackPreview,
        sessionId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      // Never show stack traces
      setSubmitError(message.replace(/\s+at\s+\w+.*$/gm, '').trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = isFormReady(imageFile, prompt) && !isSubmitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F4F0] via-[#EDE7DD] to-[#DCD8CF]">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-8 text-[#A5846E] hover:text-[#2D1B00] hover:bg-[#F4E3E1]/50 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-[#2D1B00] mb-3 tracking-tight">
            Personalize Your Room
          </h1>
          <p className="text-[#A5846E] text-base max-w-md mx-auto leading-relaxed">
            Upload a photo of your room and describe what you want. Our AI will analyze your space
            and recommend furniture that fits perfectly.
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* ── Image upload ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/40"
          >
            <h2 className="text-sm font-semibold text-[#2D1B00] mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#F76A1C]" />
              Upload your room photo
            </h2>

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Your room"
                  className="w-full max-h-72 object-contain bg-[#F7F4F0]"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <ImageDropZone onFile={handleFile} error={imageError} />
            )}
          </motion.div>

          {/* ── Prompt input ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/40"
          >
            <h2 className="text-sm font-semibold text-[#2D1B00] mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F76A1C]" />
              Describe what you want
            </h2>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="e.g. Make this room look modern and cozy with warm lighting"
                className="w-full resize-none rounded-xl border border-[#DCD8CF] bg-white/80 px-4 py-3 text-sm text-[#2D1B00] placeholder:text-[#A5846E]/60 focus:outline-none focus:ring-2 focus:ring-[#F76A1C]/30 focus:border-[#F76A1C]/60 transition-all"
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] text-[#A5846E]">
                {prompt.length}/500
              </span>
            </div>

            {/* Suggestions */}
            <div className="mt-4">
              <p className="text-[10px] text-[#A5846E] uppercase tracking-wider mb-2 font-medium">
                Try a suggestion
              </p>
              <PromptSuggestions onSelect={setPrompt} />
            </div>
          </motion.div>

          {/* ── Submit error ── */}
          {submitError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{submitError}</span>
            </motion.div>
          )}

          {/* ── Analyze button ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-6 text-base font-semibold rounded-2xl bg-gradient-to-r from-[#F76A1C] to-[#F8A87B] hover:from-[#F8A87B] hover:to-[#F76A1C] text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing your room…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Analyze Room
                </span>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
