import { useState, useRef } from "react";
import { motion } from "framer-motion";
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
  Wand2,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import warmLivingRoom from "@/assets/warm-living-room.jpg";
import abstractDesign from "@/assets/abstract-design.jpg";

interface RoomUploadProps {
  onContinue: (roomData: { image: File | null; preferences: string; specific?: string; location?: string }) => void;
  onBack: () => void;
}

export const RoomUpload = ({ onContinue, onBack }: RoomUploadProps) => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [preferences, setPreferences] = useState("");
  const [specificNeeds, setSpecificNeeds] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // 1. Add location state and geolocation logic at the top of the component
  const [location, setLocation] = useState<string>("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          // Use OpenStreetMap Nominatim for reverse geocoding
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
          if (!response.ok) throw new Error("Failed to fetch address");
          const data = await response.json();
          // Compose a nice address string
          const address = data.display_name ||
            [data.address.road, data.address.city, data.address.state, data.address.country]
              .filter(Boolean).join(", ");
          setLocation(address);
        } catch (err) {
          setLocationError("Could not determine address from location.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setLocationError("Unable to retrieve your location.");
        setIsLocating(false);
      }
    );
  };

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

  // 3. Pass location to onContinue
  const handleContinue = () => {
    onContinue({
      image: uploadedImage,
      preferences,
      specific: specificNeeds,
      location
    });
  };

  const quickStyleOptions = [
    "Modern & Minimalist",
    "Cozy & Bohemian", 
    "Scandinavian",
    "Industrial",
    "Traditional",
    "Eclectic"
  ];

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
              <motion.div 
                className="flex items-center justify-center mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Camera className="w-8 h-8 text-primary mr-3" />
                </motion.div>
                <h1 className="text-5xl font-bold text-foreground drop-shadow-lg">Upload Your Room Photo</h1>
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
                  <Camera className="w-8 h-8 text-primary ml-3" />
                </motion.div>
              </motion.div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Share a photo of your space and let our AI analyze it to suggest perfect furniture matches
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="border-2 border-primary/20 bg-card/80 backdrop-blur-md shadow-2xl">
              <div className="p-8">
                {/* Upload Area */}
                <motion.div 
                  className="mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Label className="text-base font-medium mb-4 block flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2 text-primary" />
                    Room Photo
                  </Label>
                  {!imagePreview ? (
                    <motion.div 
                      className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-primary/5 backdrop-blur-sm"
                      onClick={() => fileInputRef.current?.click()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex flex-col items-center space-y-4">
                        <motion.div 
                          className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-warm"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Camera className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                          <p className="text-foreground font-medium">
                            Upload a photo of your room
                          </p>
                          <p className="text-muted-foreground text-sm">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="outline" size="sm" className="shadow-soft hover:shadow-warm">
                            <Upload className="w-4 h-4 mr-2" />
                            Choose File
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="relative"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <img 
                        src={imagePreview} 
                        alt="Uploaded room"
                        className="w-full h-64 object-cover rounded-lg shadow-warm"
                      />
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={removeImage}
                          className="absolute top-2 right-2 shadow-soft hover:shadow-warm"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </motion.div>

                {/* Prompt Field (new feature, keep) */}
                <div className="relative mb-5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"><Sparkles className="w-5 h-5" /></span>
                  <Input
                    type="text"
                    value={preferences}
                    onChange={e => setPreferences(e.target.value)}
                    placeholder="Describe the furniture you're looking for in this room..."
                    className="pl-12 pr-4 py-3 rounded-xl border border-primary/20 bg-white/60 focus:ring-2 focus:ring-primary/30 transition-all text-lg placeholder:text-muted-foreground"
                    maxLength={200}
                  />
                </div>

                {/* Location Field + Detect Button (new feature, keep) */}
                <div className="flex gap-2 items-center mb-7">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"><Target className="w-5 h-5" /></span>
                    <Input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Enter your city, zip, or address (optional)"
                      className="pl-12 pr-4 py-3 rounded-xl border border-primary/20 bg-white/60 focus:ring-2 focus:ring-primary/30 transition-all text-base flex-1"
                      maxLength={100}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="transition-all"
                  >
                    {isLocating ? 'Locating...' : 'Detect'}
                  </Button>
                </div>
                {locationError && <div className="text-xs text-destructive mt-1 mb-2">{locationError}</div>}

                {/* Continue Button (improved CTA, keep) */}
                <div className="flex justify-center mt-2">
                  <Button
                    onClick={handleContinue}
                    disabled={!uploadedImage || !preferences.trim()}
                    variant="hero"
                    className="disabled:opacity-50 disabled:hover:scale-100 px-8 py-3 flex items-center gap-2 group text-lg font-bold shadow-xl"
                  >
                    Continue
                    <motion.span
                      initial={{ x: 0 }}
                      whileHover={{ x: 10 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="inline-block"
                    >
                      <ArrowRight className="w-6 h-6 ml-1 transition-transform duration-200 group-hover:translate-x-2" />
                    </motion.span>
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};