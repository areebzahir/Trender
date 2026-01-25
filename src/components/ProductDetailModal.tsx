import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Star, 
  Ruler, 
  Heart,
  ExternalLink,
  ShoppingCart,
  Truck,
  Shield,
  Package
} from "lucide-react";
import { ImageCarousel } from "./ImageCarousel";
import { ColorPalette } from "./ColorPalette";
import { type FurnitureItem } from "@/data/sampleFurniture";

interface ProductDetailModalProps {
  item: FurnitureItem;
  onClose: () => void;
  onLike: () => void;
  onBuy: () => void;
}

export const ProductDetailModal = ({ item, onClose, onLike, onBuy }: ProductDetailModalProps) => {
  const [selectedColor, setSelectedColor] = useState(item.colorOptions[0]?.name);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleColorSelect = (color: any) => {
    setSelectedColor(color.name);
    // Find image for this color and update carousel
    const colorImageIndex = item.images.findIndex(img => 
      item.colorOptions.find(c => c.name === color.name)?.image === img
    );
    if (colorImageIndex >= 0) {
      setCurrentImageIndex(colorImageIndex);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Images */}
            <div className="space-y-4">
              <ImageCarousel 
                images={item.images}
                alt={item.name}
                className="aspect-square"
              />
              
              {/* Image thumbnails */}
              <div className="flex gap-2 overflow-x-auto">
                {item.images.map((image, index) => (
                  <button
                    key={index}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img 
                      src={image} 
                      alt={`${item.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{item.name}</h1>
                <p className="text-muted-foreground mb-2">{item.brand}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-3xl font-bold text-primary">${item.price}</span>
                  {item.originalPrice && (
                    <>
                      <span className="text-xl text-muted-foreground line-through">${item.originalPrice}</span>
                      <Badge variant="destructive">
                        Save ${item.originalPrice - item.price}
                      </Badge>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-current text-accent" />
                    {item.rating} ({item.reviewCount} reviews)
                  </div>
                  <Badge variant={item.inStock ? "default" : "secondary"}>
                    {item.inStock ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>

                <p className="text-muted-foreground">{item.description}</p>
              </div>

              {/* Color Options */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Available Colors</h3>
                <ColorPalette 
                  colors={item.colorOptions}
                  selectedColor={selectedColor}
                  onColorSelect={handleColorSelect}
                  showImages={true}
                />
              </div>

              {/* Dimensions & Specs */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Specifications</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Width:</span>
                    <span className="ml-2 text-foreground">{item.dimensions.width}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Height:</span>
                    <span className="ml-2 text-foreground">{item.dimensions.height}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Depth:</span>
                    <span className="ml-2 text-foreground">{item.dimensions.depth}</span>
                  </div>
                  {item.dimensions.weight && (
                    <div>
                      <span className="text-muted-foreground">Weight:</span>
                      <span className="ml-2 text-foreground">{item.dimensions.weight}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Materials */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Materials</h3>
                <div className="flex flex-wrap gap-2">
                  {item.materials.map((material) => (
                    <Badge key={material} variant="outline">{material}</Badge>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Features</h3>
                <ul className="space-y-1">
                  {item.features.map((feature, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Care Instructions */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Care Instructions</h3>
                <ul className="space-y-1">
                  {item.careInstructions.map((instruction, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 bg-accent rounded-full mt-2 flex-shrink-0"></span>
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Service Icons */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
                <div className="flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  Free Shipping
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  2 Year Warranty
                </div>
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  Easy Returns
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={onBuy}
                  disabled={!item.inStock}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {item.inStock ? `Buy Now - $${item.price}` : 'Out of Stock'}
                </Button>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={onLike}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Add to Favorites
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.open(item.buyLink, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View at Store
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};