import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Camera, Sparkles, ArrowRight, Zap, Target, Palette } from "lucide-react";
import heroImage from "@/assets/hero-living-room.jpg";
import furnitureShowcase from "@/assets/furniture-showcase.jpg";
import { RobotScene } from "@/components/RobotScene";

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: Camera,
      title: "Upload Your Room",
      description: "Snap a photo of your space and let our AI understand your style",
      color: "text-primary"
    },
    {
      icon: Sparkles,
      title: "AI Style Analysis", 
      description: "Advanced algorithms analyze your taste using Qloo's cultural intelligence",
      color: "text-accent"
    },
    {
      icon: Heart,
      title: "Swipe & Match",
      description: "Swipe through curated furniture that perfectly fits your aesthetic",
      color: "text-primary-glow"
    },
    {
      icon: Target,
      title: "Perfect Matches",
      description: "Save your favorites and get personalized room design recommendations",
      color: "text-secondary-foreground"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-6xl md:text-8xl font-bold text-white mb-6 animate-float tracking-tight">
              Trender
            </h1>
            <p className="font-body text-xl md:text-2xl text-white/90 mb-4 font-light tracking-wide">
              AI Furniture Expert
            </p>
            <p className="font-body text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              Discover furniture that matches your unique style. Upload your room, swipe through 
              AI-curated pieces, and create the perfect space you've always dreamed of.
            </p>
            <Button 
              variant="hero" 
              size="lg" 
              onClick={onGetStarted}
              className="font-body text-lg px-8 py-4 group font-medium"
            >
              Start Matching Furniture
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              How Trender Works
            </h2>
            <p className="font-body text-xl text-muted-foreground max-w-2xl mx-auto">
              Your personal AI stylist that learns your taste and finds furniture you'll love
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="p-6 text-center hover:shadow-warm transition-all duration-300 cursor-pointer group bg-gradient-card border-border/50"
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-body text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="font-body text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive 3D Furniture Scene */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Interactive 3D Robot
            </h2>
            <p className="font-body text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience advanced robotics with stunning 3D visualization and AI-powered interactions
            </p>
          </div>
          <RobotScene />
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
                Discover Your Perfect Style
              </h2>
              <p className="font-body text-lg text-muted-foreground mb-8 leading-relaxed">
                Our AI-powered platform uses advanced taste profiling to understand your unique 
                aesthetic preferences. From minimalist modern to cozy bohemian, we'll help you 
                discover furniture that truly reflects who you are.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-body text-sm font-medium">AI-Powered</span>
                </div>
                <div className="flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full">
                  <Palette className="w-4 h-4 text-accent" />
                  <span className="font-body text-sm font-medium">Style Analysis</span>
                </div>
                <div className="flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full">
                  <Heart className="w-4 h-4 text-secondary-foreground" />
                  <span className="font-body text-sm font-medium">Personalized</span>
                </div>
              </div>
              <Button 
                variant="warm" 
                size="lg"
                onClick={onGetStarted}
                className="font-body group font-medium"
              >
                Try It Now
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-warm opacity-20 rounded-2xl"></div>
              <img 
                src={furnitureShowcase} 
                alt="Curated furniture pieces"
                className="w-full rounded-2xl shadow-warm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10"></div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to Find Your Perfect Furniture?
          </h2>
          <p className="font-body text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of users who've discovered their ideal home aesthetic with Trender
          </p>
          <Button 
            variant="secondary" 
            size="lg"
            onClick={onGetStarted}
            className="font-body text-lg px-8 py-4 group bg-white/90 hover:bg-white hover:scale-105 font-medium"
          >
            Start Your Style Journey
            <Sparkles className="ml-2 group-hover:rotate-12 transition-transform" />
          </Button>
        </div>
      </section>
    </div>
  );
};