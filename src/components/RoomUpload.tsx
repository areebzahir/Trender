import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Camera, 
  Upload, 
  ArrowRight, 
  X, 
  ImageIcon, 
  Sparkles,
  Home,
  Palette,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RoomUploadProps {
  onContinue: (roomData: { image: File | null; preferences: string; specific?: string }) => void;
  onBack: () => void;
}

export const RoomUpload = ({ onContinue, onBack }: RoomUploadProps) => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [preferences, setPreferences] = useState("");
  const [specificNeeds, setSpecificNeeds] = useState("");
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
    } else {
      onContinue({
        image: uploadedImage,
        preferences,
        specific: specificNeeds
      });
    }
  };

  const quickStyleOptions = [
    "Modern & Minimalist",
    "Cozy & Bohemian", 
    "Scandinavian",
    "Industrial",
    "Traditional",
    "Eclectic"
  ];

  if (step === 2) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <Button 
              variant="ghost" 
              onClick={() => setStep(1)}
              className="absolute left-4 top-4"
            >
              ← Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Tell Us About Your Style
            </h1>
            <p className="text-muted-foreground">
              Help us understand your taste preferences
            </p>
          </div>

          <Card className="p-8 bg-gradient-card border-border/50">
            <div className="space-y-6">
              <div>
                <Label htmlFor="preferences" className="text-base font-medium">
                  What's your style preference? 
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Describe the aesthetic you're drawn to, or select from our suggestions
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {quickStyleOptions.map((style) => (
                    <Button
                      key={style}
                      variant="outline"
                      size="sm"
                      onClick={() => setPreferences(prev => 
                        prev ? `${prev}, ${style}` : style
                      )}
                      className="text-xs hover:bg-primary/10 hover:border-primary/50"
                    >
                      {style}
                    </Button>
                  ))}
                </div>

                <Textarea
                  id="preferences"
                  placeholder="E.g., I love warm colors, natural materials, and clean lines. I'm drawn to pieces that feel both modern and cozy..."
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div>
                <Label htmlFor="specific" className="text-base font-medium">
                  Looking for something specific? <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Tell us if you need particular pieces or have specific requirements
                </p>
                <Textarea
                  id="specific"
                  placeholder="E.g., I need a new sofa for my living room, something comfortable for a family with kids..."
                  value={specificNeeds}
                  onChange={(e) => setSpecificNeeds(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>

              <Button 
                onClick={handleContinue}
                className="w-full" 
                variant="hero"
                size="lg"
                disabled={!preferences.trim()}
              >
                Start Discovering Furniture
                <Sparkles className="ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="absolute left-4 top-4"
          >
            ← Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Upload Your Room
          </h1>
          <p className="text-muted-foreground">
            Share a photo of your space so our AI can understand your style
          </p>
        </div>

        <Card className="p-8 bg-gradient-card border-border/50">
          <div className="space-y-6">
            {/* Upload Area */}
            <div>
              <Label className="text-base font-medium mb-4 block">
                Room Photo
              </Label>
              
              {!imagePreview ? (
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/20"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">
                        Upload a photo of your room
                      </p>
                      <p className="text-muted-foreground text-sm">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Uploaded room"
                    className="w-full h-64 object-cover rounded-lg shadow-soft"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Tips */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-2 flex items-center">
                <ImageIcon className="w-4 h-4 mr-2 text-primary" />
                Photo Tips
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Good lighting helps our AI better analyze your space</li>
                <li>• Include existing furniture and decor in the shot</li>
                <li>• A wide angle showing the full room works best</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleContinue}
                className="flex-1"
                disabled={false}
              >
                Skip Photo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button 
                onClick={handleContinue}
                className="flex-1" 
                variant="hero"
                disabled={!uploadedImage}
              >
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};