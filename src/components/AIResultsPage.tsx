import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Sparkles, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BeforeAfterPreview } from '@/components/BeforeAfterPreview';
import { ColorPalette } from '@/components/ColorPalette';
import { ProductCard } from '@/components/ProductCard';
import type { AIAnalysisResult } from '@/types/api';

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
    <div className="w-16 h-16 rounded-full bg-[#F4E3E1]/60 flex items-center justify-center">
      <Package className="w-7 h-7 text-[#A5846E]" />
    </div>
    <div>
      <h3 className="text-base font-semibold text-[#2D1B00] mb-1">No matching products found</h3>
      <p className="text-sm text-[#A5846E] max-w-xs mx-auto leading-relaxed">
        Try adjusting your prompt — for example, mention a specific style, colour, or budget.
      </p>
    </div>
  </div>
);

// ─── Section wrapper ──────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section = ({ title, children }: SectionProps) => (
  <section className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/40">
    <h2 className="text-sm font-semibold text-[#2D1B00] uppercase tracking-wider mb-5 flex items-center gap-2">
      <Sparkles className="w-4 h-4 text-[#F76A1C]" />
      {title}
    </h2>
    {children}
  </section>
);

// ─── Main component ───────────────────────────────────────────────────────────

interface AIResultsPageProps {
  result: AIAnalysisResult;
  onBack: () => void;
  onStartOver: () => void;
}

export const AIResultsPage = ({ result, onBack, onStartOver }: AIResultsPageProps) => {
  const { imageBase64, previewUrl, isFallbackPreview, analysis, products } = result;

  // Per-section preview state (allows retry without re-running full pipeline)
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(previewUrl);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const handleRetryPreview = async () => {
    setPreviewLoading(true);
    setPreviewError(false);
    try {
      const productImageUrls = products.slice(0, 3).map((p) => p.imageUrl);
      const res = await fetch('/api/generate-room-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          productImageUrls,
          prompt: analysis.designGoal,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentPreviewUrl(data.previewUrl ?? null);
      } else {
        setPreviewError(true);
      }
    } catch {
      setPreviewError(true);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Reconstruct the before image URL from base64
  const beforeImageUrl = `data:image/jpeg;base64,${imageBase64}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F4F0] via-[#EDE7DD] to-[#DCD8CF]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-[#A5846E] hover:text-[#2D1B00] hover:bg-[#F4E3E1]/50 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant="ghost"
            onClick={onStartOver}
            className="text-[#A5846E] hover:text-[#2D1B00] hover:bg-[#F4E3E1]/50 rounded-xl"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </div>

        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-[#2D1B00] tracking-tight mb-2">
            Your Room Transformation
          </h1>
          <p className="text-[#A5846E] text-sm">
            {analysis.designGoal} · {analysis.roomType}
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* ── Hero: Before / After preview ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Section title="Before & After">
              <BeforeAfterPreview
                beforeImageUrl={beforeImageUrl}
                afterImageUrl={currentPreviewUrl}
                isLoading={previewLoading}
                isError={previewError}
                isFallbackMode={isFallbackPreview}
                onRetry={handleRetryPreview}
              />
              {isFallbackPreview && currentPreviewUrl && (
                <p className="text-xs text-[#A5846E] mt-3 text-center">
                  This is a visual inspiration preview — see the exact recommended products below.
                </p>
              )}
            </Section>
          </motion.div>

          {/* ── AI Analysis summary ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Section title="Room Analysis">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <p className="text-[10px] text-[#A5846E] uppercase tracking-wider mb-1">Room type</p>
                  <p className="font-medium text-[#2D1B00] capitalize">{analysis.roomType}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A5846E] uppercase tracking-wider mb-1">Current style</p>
                  <p className="font-medium text-[#2D1B00] capitalize">{analysis.currentStyle}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A5846E] uppercase tracking-wider mb-1">Design goal</p>
                  <p className="font-medium text-[#2D1B00] capitalize">{analysis.designGoal}</p>
                </div>
              </div>
              <p className="text-sm text-[#A5846E] leading-relaxed border-t border-[#EDE7DD]/60 pt-4">
                {analysis.reasoning}
              </p>
            </Section>
          </motion.div>

          {/* ── Colour palette ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Section title="Colour Palette">
              <ColorPalette
                recommendedPalette={analysis.recommendedPalette}
                detectedColors={analysis.detectedColors}
              />
            </Section>
          </motion.div>

          {/* ── Recommended products ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <Section title={`Recommended Products${products.length > 0 ? ` (${products.length})` : ''}`}>
              {products.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.05 * i }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              )}
            </Section>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
