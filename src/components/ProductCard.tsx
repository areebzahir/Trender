import type { Product } from '@/types/product';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

/**
 * ProductCard — displays a single AI-recommended product with buy link.
 * Handles out-of-stock state, style tag badges, and image fallback.
 */
export const ProductCard = ({ product }: ProductCardProps) => {
  const {
    name,
    storeName,
    price,
    currency,
    affiliateUrl,
    productUrl,
    imageUrl,
    cleanImageUrl,
    styleTags,
    inStock,
  } = product;

  const buyHref = affiliateUrl || productUrl;
  const displayImage = cleanImageUrl || imageUrl;

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#EDE7DD]/60">
      {/* Product Image */}
      <div className="relative overflow-hidden aspect-square bg-[#F7F4F0]">
        <img
          src={displayImage}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/90 text-[#2D1B00] text-xs font-semibold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Store name */}
        <p className="text-xs text-[#A5846E] font-medium uppercase tracking-wide">
          {storeName}
        </p>

        {/* Product name */}
        <h3 className="text-sm font-semibold text-[#2D1B00] leading-snug line-clamp-2 group-hover:text-[#F76A1C] transition-colors duration-200">
          {name}
        </h3>

        {/* Style tags */}
        {styleTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {styleTags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-2 py-0.5 bg-[#F4E3E1]/60 text-[#A5846E] border-0 rounded-full capitalize"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Price + Buy button */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#EDE7DD]/60">
          <span className="text-base font-bold text-[#F76A1C]">{formattedPrice}</span>

          {inStock ? (
            <a
              href={buyHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#2D1B00] hover:bg-[#F76A1C] text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors duration-200"
              aria-label={`Buy ${name} at ${storeName}`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Buy Now
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          ) : (
            <button
              disabled
              aria-disabled="true"
              className="inline-flex items-center gap-1.5 bg-[#DCD8CF] text-[#A5846E] text-xs font-semibold px-3 py-2 rounded-xl cursor-not-allowed"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
