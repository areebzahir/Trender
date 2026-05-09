import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeAfterPreviewProps {
  beforeImageUrl: string;
  afterImageUrl: string | null;
  isLoading: boolean;
  isError: boolean;
  /** true → the "after" image is a styled mockup, not a product-placed composite */
  isFallbackMode: boolean;
  onRetry: () => void;
}

/**
 * BeforeAfterPreview — hero component showing the original room alongside
 * the AI-generated preview. Handles loading, error, and fallback states.
 */
export const BeforeAfterPreview = ({
  beforeImageUrl,
  afterImageUrl,
  isLoading,
  isError,
  isFallbackMode,
  onRetry,
}: BeforeAfterPreviewProps) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ── Before panel ── */}
        <div className="relative rounded-2xl overflow-hidden bg-[#F7F4F0] aspect-[4/3]">
          <img
            src={beforeImageUrl}
            alt="Your original room"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-3">
            <span className="bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
              Before
            </span>
          </div>
        </div>

        {/* ── After panel ── */}
        <div className="relative rounded-2xl overflow-hidden bg-[#F7F4F0] aspect-[4/3] flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#F7F4F0]">
              {/* Skeleton shimmer */}
              <div className="w-full h-full absolute inset-0 bg-gradient-to-r from-[#EDE7DD] via-[#F7F4F0] to-[#EDE7DD] animate-pulse" />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-8 h-8 text-[#F76A1C]" />
                </motion.div>
                <p className="text-sm text-[#A5846E] font-medium">Generating preview…</p>
              </div>
            </div>
          )}

          {!isLoading && isError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <AlertCircle className="w-8 h-8 text-[#A5846E]" />
              <p className="text-sm text-[#A5846E]">Preview generation failed.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="border-[#DCD8CF] text-[#2D1B00] hover:bg-[#F4E3E1]/50 rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !isError && afterImageUrl && (
            <>
              <img
                src={afterImageUrl}
                alt="AI-generated room preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="bg-[#F76A1C]/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
                  After
                </span>
                {isFallbackMode && (
                  <span className="bg-black/60 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-full backdrop-blur-sm">
                    Visual Inspiration Preview
                  </span>
                )}
              </div>
            </>
          )}

          {!isLoading && !isError && !afterImageUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <Sparkles className="w-8 h-8 text-[#DCD8CF]" />
              <p className="text-sm text-[#A5846E]">Preview not available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
