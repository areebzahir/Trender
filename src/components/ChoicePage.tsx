import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Camera, Palette } from "lucide-react";

interface ChoicePageProps {
  onBack: () => void;
  onRoomDecorating: () => void;
  onStyleQuiz: () => void;
}

export const ChoicePage = ({ onBack, onRoomDecorating, onStyleQuiz }: ChoicePageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-8 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            Choose Your Journey
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            How would you like to discover your perfect furniture match?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Room Decorating Option */}
          <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-105">
            <div className="aspect-[4/5] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-950/20 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute top-6 left-6">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-2xl font-bold mb-2 text-foreground">Room Decorating</h2>
                <p className="text-muted-foreground mb-4">
                  Upload a photo of your space and let our AI analyze your room to suggest perfect furniture matches
                </p>
                <Button 
                  onClick={onRoomDecorating}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Upload Your Room
                </Button>
              </div>
            </div>
          </Card>

          {/* Style Quiz Option */}
          <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-105">
            <div className="aspect-[4/5] bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950/20 dark:to-pink-950/20 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute top-6 left-6">
                <Palette className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-2xl font-bold mb-2 text-foreground">Tell Us About Your Style</h2>
                <p className="text-muted-foreground mb-4">
                  Take our personalized quiz to discover your unique style preferences and get tailored recommendations
                </p>
                <Button 
                  onClick={onStyleQuiz}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Start Style Quiz
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Both paths lead to personalized furniture recommendations just for you
          </p>
        </div>
      </div>
    </div>
  );
};