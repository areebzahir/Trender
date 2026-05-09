/**
 * Product — a record in the product catalogue used for AI-driven recommendations.
 */
export interface Product {
  id: string;
  name: string;
  storeName: string;
  category: string;
  price: number;
  currency: string;
  productUrl: string;
  affiliateUrl: string;
  imageUrl: string;
  /** Cleaned/processed image URL suitable for display (no watermarks, cropped) */
  cleanImageUrl: string;
  /** e.g. ["cream", "walnut", "white"] */
  colorTags: string[];
  /** e.g. ["modern", "minimalist", "scandinavian"] */
  styleTags: string[];
  /** e.g. ["velvet", "solid wood", "brass"] */
  materialTags: string[];
  /** e.g. ["living room", "bedroom"] */
  roomTags: string[];
  dimensions: {
    width: string;
    height: string;
    depth: string;
  };
  inStock: boolean;
}
