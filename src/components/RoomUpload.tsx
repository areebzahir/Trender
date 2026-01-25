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

  // Location detection logic (fix and polish)
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
            [data.address.city, data.address.state, data.address.country]
              .filter(Boolean).join(", ");
          if (!address) throw new Error("No address found");
          setLocation(address);
        } catch (err) {
          setLocationError("Could not determine address from location. Please enter your city or address manually.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setLocationError("Unable to retrieve your location. Please enter your city or address manually.");
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
          variant="outline" 
          onClick={onBack}
          className="mb-8 text-lg font-semibold px-6 py-3 bg-white/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 hover:bg-white/90 text-primary hover:text-primary/80 transition-all duration-300 hover:scale-105 shadow-soft hover:shadow-warm rounded-xl"
        >
          <ArrowLeft className="w-6 h-6 mr-3" />
          Back to Choices
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-12 mb-8 shadow-lg">
              <motion.div 
                className="flex items-center justify-center mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Camera className="w-12 h-12 text-primary mr-4" />
                </motion.div>
                <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-lg">Upload Your Room Photo</h1>
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
                  <Camera className="w-12 h-12 text-primary ml-4" />
                </motion.div>
              </motion.div>
              <p className="text-2xl text-black/90 leading-relaxed font-medium">
                Share a photo of your space and let our AI analyze it to suggest perfect furniture matches
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="border border-primary/20 bg-white/60 backdrop-blur-sm shadow-lg rounded-2xl">
              <div className="p-10">
                {/* Upload Area */}
                <motion.div 
                  className="mb-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Label className="text-xl font-semibold mb-6 block flex items-center text-black">
                    <ImageIcon className="w-7 h-7 mr-3 text-primary" />
                    Room Photo
                  </Label>
                  {!imagePreview ? (
                    <motion.div 
                      className="border-2 border-dashed border-primary/30 rounded-2xl p-12 text-center hover:border-primary/50 transition-all duration-300 cursor-pointer bg-white/80 hover:bg-white/90"
                      onClick={() => fileInputRef.current?.click()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex flex-col items-center space-y-6">
                        <motion.div 
                          className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-warm"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Camera className="w-10 h-10 text-white" />
                        </motion.div>
                        <div>
                          <p className="text-black font-semibold text-lg mb-2">
                            Upload a photo of your room
                          </p>
                          <p className="text-black/70 text-base">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="outline" size="lg" className="shadow-soft hover:shadow-warm px-8 py-3 text-base font-medium border-2">
                            <Upload className="w-5 h-5 mr-3" />
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
                <div className="relative mb-8">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary"><Sparkles className="w-6 h-6" /></span>
                  <Input
                    type="text"
                    value={preferences}
                    onChange={e => setPreferences(e.target.value)}
                    placeholder="Describe the furniture you're looking for in this room..."
                    className="pl-14 pr-6 py-4 rounded-2xl border border-primary/20 bg-white/90 focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all text-lg placeholder:text-black/50 font-medium text-black"
                    maxLength={200}
                  />
                </div>

                {/* Location Field + Detect Button (new feature, keep) */}
                <div className="flex gap-4 items-center mb-8">
                  <div className="relative flex-1">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-accent"><Target className="w-6 h-6" /></span>
                    <Input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Enter your city, zip, or address (optional)"
                      className="pl-14 pr-6 py-4 rounded-2xl border border-accent/20 bg-white/90 focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all text-lg flex-1 font-medium text-black placeholder:text-black/50"
                      maxLength={100}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="transition-all border border-accent/30 text-accent hover:bg-accent/5 hover:text-accent/80 px-6 py-4 rounded-2xl font-medium bg-white/80"
                  >
                    {isLocating ? (<span className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full"></span>) : 'Detect'}
                  </Button>
                </div>
                {locationError && (
                  <div className="text-destructive text-sm mt-3 font-medium bg-destructive/10 rounded-xl px-4 py-3 shadow-sm border border-destructive/20">{locationError}</div>
                )}

                {/* Continue Button (improved CTA, keep) */}
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={handleContinue}
                    disabled={!uploadedImage || !preferences.trim()}
                    variant="hero"
                    className="disabled:opacity-50 disabled:hover:scale-100 px-12 py-6 flex items-center gap-3 group text-xl font-bold shadow-2xl rounded-2xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
                  >
                    Continue to AI Styling
                    <motion.span
                      initial={{ x: 0 }}
                      whileHover={{ x: 10 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="inline-block"
                    >
                      <ArrowRight className="w-7 h-7 ml-2 transition-transform duration-200 group-hover:translate-x-2" />
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