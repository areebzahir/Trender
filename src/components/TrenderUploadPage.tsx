import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, MapPin, ArrowRight, Image as ImageIcon, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import warmLivingRoom from '@/assets/warm-living-room.jpg';
import abstractDesign from '@/assets/abstract-design.jpg';

// ... FloatingParticle and GlowingOrb components as provided ...

const FloatingParticle = ({ delay = 0, duration = 4, x = 0, y = 0 }) => (
  <motion.div
    className="absolute w-1 h-1 bg-orange-300/30 rounded-full"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{
      y: [0, -20, 0],
      opacity: [0.3, 0.8, 0.3],
      scale: [1, 1.5, 1],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

const GlowingOrb = ({ size = 100, color = "orange", x = 20, y = 30, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-xl opacity-20`}
    style={{
      width: size,
      height: size,
      left: `${x}%`,
      top: `${y}%`,
      background: `radial-gradient(circle, ${color === 'orange' ? '#fb923c' : '#f97316'}, transparent)`
    }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.1, 0.3, 0.1],
    }}
    transition={{
      duration: 6,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

const TrenderUploadPage: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [location, setLocation] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    // Simulate location detection
    setTimeout(() => {
      setLocation("New York, NY");
      setIsDetectingLocation(false);
    }, 2000);
  };

  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2
  }));

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Images (blend with overlays) */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute top-0 left-0 w-1/2 h-full bg-cover bg-center opacity-80"
          style={{ backgroundImage: `url(${warmLivingRoom})` }}
        />
        <div 
          className="absolute top-0 right-0 w-1/2 h-full bg-cover bg-center opacity-80"
          style={{ backgroundImage: `url(${abstractDesign})` }}
        />
        {/* Decorative overlays for color blending */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 via-amber-25/60 to-orange-100/80" />
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 right-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-secondary/20 rounded-full blur-2xl"></div>
        </div>
        {/* Floating Particles */}
        {particles.map((particle) => (
          <FloatingParticle
            key={particle.id}
            x={particle.x}
            y={particle.y}
            delay={particle.delay}
            duration={particle.duration}
          />
        ))}
        {/* Glowing Orbs */}
        <GlowingOrb x={10} y={20} size={200} color="orange" delay={0} />
        <GlowingOrb x={80} y={60} size={150} color="amber" delay={2} />
        <GlowingOrb x={60} y={10} size={100} color="orange" delay={4} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent mb-6 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <motion.span
              className="inline-block"
              animate={{
                textShadow: [
                  "0 0 20px rgba(251, 146, 60, 0.3)",
                  "0 0 40px rgba(251, 146, 60, 0.5)",
                  "0 0 20px rgba(251, 146, 60, 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Upload Your Room Photo
            </motion.span>
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-orange-700/80 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Our AI stylist will scan your space and style it with culturally relevant furniture that matches your vibe.
          </motion.p>
        </motion.div>
        {/* ...rest of the provided code for upload, prompt, location, and CTA... */}
        {/* Upload Module */}
        <motion.div
          className="max-w-4xl mx-auto mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Card className="relative overflow-hidden bg-white/20 backdrop-blur-xl border-white/30 shadow-2xl">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-amber-400/10"
              animate={{
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <div className="relative p-8">
              {!uploadedImage ? (
                <motion.div
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                    isDragging 
                      ? 'border-orange-400 bg-orange-50/50 scale-105' 
                      : 'border-orange-300/50 hover:border-orange-400/70'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="mb-6"
                    animate={{
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Upload className="w-16 h-16 mx-auto text-orange-500" />
                  </motion.div>
                  <h3 className="text-2xl font-semibold text-orange-800 mb-4">
                    Drop your room photo here
                  </h3>
                  <p className="text-orange-600 mb-6">
                    or click to browse your files
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Choose Photo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                </motion.div>
              ) : (
                <motion.div
                  className="relative rounded-2xl overflow-hidden"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <img
                    src={uploadedImage}
                    alt="Uploaded room"
                    className="w-full h-64 object-cover"
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  />
                  <Button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/30"
                    size="sm"
                  >
                    Change Photo
                  </Button>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
        {/* Prompt Input */}
        <motion.div
          className="max-w-4xl mx-auto mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Card className="bg-white/20 backdrop-blur-xl border-white/30 shadow-2xl">
            <div className="p-8">
              <div className="relative">
                <motion.div
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5 text-orange-500" />
                </motion.div>
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the furniture you want in this space (e.g. 'sleek beige L-sofa, walnut coffee table')"
                  className="pl-14 pr-4 py-6 text-lg bg-white/50 border-orange-200/50 focus:border-orange-400 focus:ring-orange-400/20 rounded-xl transition-all duration-300"
                />
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  animate={{
                    boxShadow: prompt 
                      ? ["0 0 0 0 rgba(251, 146, 60, 0)", "0 0 0 4px rgba(251, 146, 60, 0.1)", "0 0 0 0 rgba(251, 146, 60, 0)"]
                      : "none"
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </div>
          </Card>
        </motion.div>
        {/* Location Section */}
        <motion.div
          className="max-w-4xl mx-auto mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <Card className="bg-white/20 backdrop-blur-xl border-white/30 shadow-2xl">
            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-500" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter your location"
                    className="pl-14 pr-4 py-6 text-lg bg-white/50 border-orange-200/50 focus:border-orange-400 focus:ring-orange-400/20 rounded-xl"
                  />
                </div>
                <Button
                  onClick={detectLocation}
                  disabled={isDetectingLocation}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <motion.div
                    animate={isDetectingLocation ? { rotate: 360 } : {}}
                    transition={{ duration: 1, repeat: isDetectingLocation ? Infinity : 0 }}
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                  </motion.div>
                  {isDetectingLocation ? 'Detecting...' : 'Detect Location'}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
        {/* Continue Button */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-700 hover:via-amber-700 hover:to-orange-600 text-white px-12 py-6 text-xl font-semibold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 relative overflow-hidden group"
              disabled={!uploadedImage || !prompt || !location}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              />
              <span className="relative flex items-center">
                <Zap className="w-6 h-6 mr-3" />
                Continue to AI Styling
                <motion.div
                  className="ml-3"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-6 h-6" />
                </motion.div>
              </span>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default TrenderUploadPage; 