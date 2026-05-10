/**
 * SwipeResultCard — one card in the swipe results deck.
 * Contains the stitched room image + product metadata.
 */
export interface SwipeResultCard {
  /** Unique card ID (productId) */
  id: string;
  productId: string;

  /** data URI of the stitched room + product image */
  stitchedImageUrl: string | null;
  /** Still loading the stitch */
  stitchLoading: boolean;
  /** Stitch failed — fall back to product image */
  stitchError: boolean;

  /** Original room image (data URI) */
  roomImageUrl: string;
  /** Raw product image URL */
  productImageUrl: string;

  // Product info
  productName: string;
  storeName: string;
  price: number;
  currency: string;
  productUrl: string;
  category: string;
  styleTags: string[];
  colorTags: string[];
  whySelected: string;
  renderWarnings: string[];

  // Swipe state
  swipeStatus: 'pending' | 'liked' | 'passed';
}

export type SwipeDirection = 'left' | 'right';
