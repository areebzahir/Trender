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
  Target,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import warmLivingRoom from "@/assets/warm-living-room.jpg";
import abstractDesign from "@/assets/abstract-design.jpg";

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
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
        {/* Background Images */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-0 left-0 w-1/3 h-full bg-cover bg-center opacity-10"
            style={{ backgroundImage: `url(${warmLivingRoom})` }}
          />
          <div 
            className="absolute top-0 right-0 w-1/3 h-full bg-cover bg-center opacity-10"
            style={{ backgroundImage: `url(${abstractDesign})` }}
          />
        </div>

        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 right-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-secondary/20 rounded-full blur-2xl"></div>
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-8 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 mb-6">
                <div className="flex items-center justify-center mb-4">
                  <Palette className="w-8 h-8 text-primary mr-3 animate-pulse" />
                  <h1 className="text-5xl font-bold text-foreground drop-shadow-lg">Tell Us About Your Style</h1>
                  <Palette className="w-8 h-8 text-primary ml-3 animate-pulse" />
                </div>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Help us understand your design preferences so we can suggest the perfect furniture for your space
                </p>
              </div>
            </div>

            <Card className="border-2 border-primary/20 bg-card/80 backdrop-blur-md shadow-2xl">
              <div className="p-8">
                {/* Quick Style Options */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-primary" />
                    Quick Style Selection
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {quickStyleOptions.map((style) => (
                      <Button
                        key={style}
                        variant={preferences.includes(style) ? "default" : "outline"}
                        onClick={() => {
                          setPreferences(prev => 
                            prev.includes(style) 
                              ? prev.split(", ").filter(p => p !== style).join(", ")
                              : prev ? `${prev}, ${style}` : style
                          );
                        }}
                        className="transition-all duration-300 hover:scale-105 shadow-soft hover:shadow-warm"
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom preferences */}
                <div className="mb-8">
                  <label className="block text-sm font-medium mb-3 text-foreground flex items-center">
                    <Home className="w-4 h-4 mr-2 text-primary" />
                    Describe your ideal style and preferences
                  </label>
                  <Textarea
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder="I love modern minimalist designs with clean lines and neutral colors..."
                    className="min-h-[120px] bg-background/70 backdrop-blur-sm border-border/50 focus:border-primary transition-all duration-300 shadow-soft focus:shadow-warm"
                  />
                </div>

                {/* Specific needs */}
                <div className="mb-8">
                  <label className="block text-sm font-medium mb-3 text-foreground flex items-center">
                    <Camera className="w-4 h-4 mr-2 text-primary" />
                    Any specific needs or requirements?
                  </label>
                  <Textarea
                    value={specificNeeds}
                    onChange={(e) => setSpecificNeeds(e.target.value)}
                    placeholder="Pet-friendly materials, storage solutions, budget considerations..."
                    className="min-h-[100px] bg-background/70 backdrop-blur-sm border-border/50 focus:border-primary transition-all duration-300 shadow-soft focus:shadow-warm"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(1)}
                    className="transition-all duration-300 hover:scale-105 shadow-soft hover:shadow-warm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Photo
                  </Button>
                  <Button 
                    onClick={handleContinue}
                    disabled={!preferences.trim()}
                    variant="hero"
                    className="disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Discovering Furniture
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
      {/* Background Images */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 left-0 w-1/2 h-full bg-cover bg-center opacity-8"
          style={{ backgroundImage: `url(${warmLivingRoom})` }}
        />
        <div 
          className="absolute top-0 right-0 w-1/2 h-full bg-cover bg-center opacity-8"
          style={{ backgroundImage: `url(${abstractDesign})` }}
        />
      </div>

      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-secondary/20 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-8 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 mb-6">
              <div className="flex items-center justify-center mb-4">
                <Camera className="w-8 h-8 text-primary mr-3 animate-pulse" />
                <h1 className="text-5xl font-bold text-foreground drop-shadow-lg">Upload Your Room Photo</h1>
                <Camera className="w-8 h-8 text-primary ml-3 animate-pulse" />
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Share a photo of your space and let our AI analyze it to suggest perfect furniture matches
              </p>
            </div>
          </div>

          <Card className="border-2 border-primary/20 bg-card/80 backdrop-blur-md shadow-2xl">
            <div className="p-8">
              {/* Upload Area */}
              <div className="mb-8">
                <Label className="text-base font-medium mb-4 block flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2 text-primary" />
                  Room Photo
                </Label>
                
                {!imagePreview ? (
                  <div 
                    className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-primary/5 backdrop-blur-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-warm">
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
                      <Button variant="outline" size="sm" className="shadow-soft hover:shadow-warm">
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
                      className="w-full h-64 object-cover rounded-lg shadow-warm"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={removeImage}
                      className="absolute top-2 right-2 shadow-soft hover:shadow-warm"
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
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-8 backdrop-blur-sm">
                <h3 className="font-medium text-foreground mb-2 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-primary" />
                  Photo Tips
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Good lighting helps our AI better analyze your space</li>
                  <li>• Include existing furniture and decor in the shot</li>
                  <li>• A wide angle showing the full room works best</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center">
                <Button 
                  onClick={handleContinue}
                  disabled={!uploadedImage}
                  variant="hero"
                  className="disabled:opacity-50 disabled:hover:scale-100"
                >
                  Continue
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};