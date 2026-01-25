import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Camera, Palette, Upload, Sparkles } from "lucide-react";
import modernLivingRoom from "@/assets/modern-living-room-1.jpg";
import orangeChairModern from "@/assets/orange-chair-modern.jpg";

interface ChoicePageProps {
  onBack: () => void;
  onRoomDecorating: () => void;
  onStyleQuiz: () => void;
}

export const ChoicePage = ({ onBack, onRoomDecorating, onStyleQuiz }: ChoicePageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden flex flex-col py-6">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-secondary/20 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10 flex flex-col h-full">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-8 animate-fade-in">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-primary mr-2 animate-pulse" />
              <h1 className="text-4xl font-bold text-foreground drop-shadow-lg">
                Choose Your Journey
              </h1>
              <Sparkles className="w-6 h-6 text-primary ml-2 animate-pulse" />
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Discover your perfect furniture match through personalized experiences designed just for you
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-6">
          {/* Room Decorating Option */}
          <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:scale-105 animate-fade-in">
            <div className="aspect-[3/4] relative">
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${modernLivingRoom})` }}
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
              {/* Accent Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute top-8 left-8 p-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                <Upload className="w-8 h-8 text-white" />
              </div>
              
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="flex items-center mb-3">
                  <Camera className="w-6 h-6 mr-2 text-primary" />
                  <span className="text-sm font-medium uppercase tracking-wider text-primary">AI Powered</span>
                </div>
                <h2 className="text-3xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                  Room Decorating
                </h2>
                <p className="text-white/90 mb-6 leading-relaxed">
                  Upload a photo of your space and let our advanced AI analyze your room to suggest perfect furniture matches tailored to your style
                </p>
                <Button 
                  onClick={onRoomDecorating}
                  className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 backdrop-blur-sm transition-all duration-300 h-12 text-lg font-semibold hover:scale-105"
                >
                  Upload Your Room Photo
                </Button>
              </div>
            </div>
          </Card>

          {/* Style Quiz Option */}
          <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:scale-105 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="aspect-[3/4] relative">
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${orangeChairModern})` }}
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
              {/* Accent Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute top-8 left-8 p-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 group-hover:bg-white/20 transition-all duration-300">
                <Palette className="w-8 h-8 text-white" />
              </div>
              
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="flex items-center mb-3">
                  <Sparkles className="w-6 h-6 mr-2 text-accent" />
                  <span className="text-sm font-medium uppercase tracking-wider text-accent">Personalized</span>
                </div>
                <h2 className="text-3xl font-bold mb-3 group-hover:text-accent transition-colors duration-300">
                  Tell Us About Your Style
                </h2>
                <p className="text-white/90 mb-6 leading-relaxed">
                  Take our expertly crafted quiz to discover your unique design preferences and get tailored recommendations that match your personality
                </p>
                <Button 
                  onClick={onStyleQuiz}
                  className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 hover:border-white/50 backdrop-blur-sm transition-all duration-300 h-12 text-lg font-semibold hover:scale-105"
                >
                  Discover Your Style
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center mt-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 max-w-2xl mx-auto">
            <p className="text-muted-foreground mb-1 text-base">
              ✨ Both paths lead to personalized furniture recommendations
            </p>
            <p className="text-xs text-muted-foreground/80">
              Powered by advanced AI • Curated by design experts • Tailored just for you
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};