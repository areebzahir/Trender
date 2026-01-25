import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import orangeChairModernWall from "@/assets/orange-chair-modern-wall.jpg";
import pinkChairMinimal from "@/assets/pink-chair-minimal.jpg";

interface QuizOption {
  id: string;
  label: string;
  image: string;
  description?: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

interface StyleQuizProps {
  onComplete: (results: Record<string, string>) => void;
  onBack?: () => void;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: "colors",
    question: "Which color palette speaks to you?",
    options: [
      {
        id: "warm",
        label: "Warm & Earthy",
        image: "/lovable-uploads/782484ea-826f-4a16-a594-f61989d759dd.png",
        description: "Terracotta, sage, cream tones"
      },
      {
        id: "cool",
        label: "Cool & Calm",
        image: "/lovable-uploads/3b4c1d68-4f5a-4c4a-a5b6-ce4b84271c82.png",
        description: "Blues, grays, whites"
      },
      {
        id: "bold",
        label: "Bold & Vibrant",
        image: "/lovable-uploads/da769313-b8cb-4ace-8564-4aaf8255ee14.png",
        description: "Rich jewel tones"
      },
      {
        id: "neutral",
        label: "Neutral & Minimal",
        image: "/lovable-uploads/245d2203-5707-42b8-b7e8-69c7ec4eb939.png",
        description: "Beiges, whites, naturals"
      }
    ]
  },
  {
    id: "style",
    question: "What design style resonates with you?",
    options: [
      {
        id: "modern",
        label: "Modern Minimalist",
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
        description: "Clean lines, simple forms"
      },
      {
        id: "bohemian",
        label: "Bohemian Eclectic",
        image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=300&fit=crop",
        description: "Textured, layered, artistic"
      },
      {
        id: "industrial",
        label: "Industrial Chic",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
        description: "Metal, concrete, raw materials"
      },
      {
        id: "scandinavian",
        label: "Scandinavian Cozy",
        image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&h=300&fit=crop",
        description: "Light woods, hygge comfort"
      }
    ]
  },
  {
    id: "materials",
    question: "Which materials appeal to you most?",
    options: [
      {
        id: "natural",
        label: "Natural Wood",
        image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop",
        description: "Oak, walnut, pine"
      },
      {
        id: "metal",
        label: "Metal & Glass",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
        description: "Steel, brass, chrome"
      },
      {
        id: "fabric",
        label: "Soft Textiles",
        image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400&h=300&fit=crop",
        description: "Velvet, linen, cotton"
      },
      {
        id: "mixed",
        label: "Mixed Materials",
        image: "https://images.unsplash.com/photo-1549497538-303791108f95?w=400&h=300&fit=crop",
        description: "Combination of textures"
      }
    ]
  },
  {
    id: "lifestyle",
    question: "How do you use your living space?",
    options: [
      {
        id: "entertaining",
        label: "Entertaining Guests",
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
        description: "Social gatherings, dinner parties"
      },
      {
        id: "relaxing",
        label: "Peaceful Retreat",
        image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=300&fit=crop",
        description: "Reading, meditation, rest"
      },
      {
        id: "working",
        label: "Productive Workspace",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
        description: "Home office, creative projects"
      },
      {
        id: "family",
        label: "Family Living",
        image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&h=300&fit=crop",
        description: "Kids, pets, daily life"
      }
    ]
  }
];

export const StyleQuiz = ({ onComplete, onBack }: StyleQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const question = quizQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === quizQuestions.length - 1;
  const canProceed = selectedOption !== null;

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleNext = () => {
    if (!selectedOption) return;

    const newAnswers = { ...answers, [question.id]: selectedOption };
    setAnswers(newAnswers);

    if (isLastQuestion) {
      onComplete(newAnswers);
    } else {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setSelectedOption(answers[quizQuestions[currentQuestion - 1].id] || null);
    } else {
      onBack?.();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
      {/* Enhanced Background Images */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 left-0 w-1/2 h-full bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${orangeChairModernWall})` }}
        />
        <div 
          className="absolute top-0 right-0 w-1/2 h-full bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${pinkChairMinimal})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-40 right-20 w-60 h-60 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-r from-secondary/30 to-primary/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        <Button 
          variant="ghost" 
          onClick={handlePrevious}
          className="mb-6 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 bg-white/10 backdrop-blur-sm border border-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentQuestion === 0 ? 'Back' : 'Previous'}
        </Button>

        <div className="max-w-5xl mx-auto">
          {/* Enhanced Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-6 shadow-2xl">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-primary rounded-full p-3 mr-4 shadow-warm">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-lg font-display">
                  Discover Your Style
                </h1>
                <div className="bg-gradient-primary rounded-full p-3 ml-4 shadow-warm">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed font-body">
                Answer a few questions to help us understand your unique design preferences
              </p>
            </div>
          </div>

          {/* Enhanced Card */}
          <Card className="border-2 border-primary/30 bg-white/20 backdrop-blur-xl shadow-2xl animate-fade-in rounded-3xl overflow-hidden">
            <div className="p-10">
              {/* Enhanced Progress */}
              <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-foreground">Question {currentQuestion + 1} of {quizQuestions.length}</span>
                  <span className="text-lg font-semibold text-primary">{Math.round(((currentQuestion + 1) / quizQuestions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden shadow-inner">
                  <div 
                    className="bg-gradient-primary h-4 rounded-full transition-all duration-700 shadow-warm relative"
                    style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Enhanced Question */}
              <div className="text-center mb-10">
                <h2 className="text-4xl font-bold text-foreground mb-6 font-display leading-tight">
                  {question.question}
                </h2>
                <p className="text-lg text-muted-foreground font-body">
                  Choose the option that best represents your style preference
                </p>
              </div>

              {/* Enhanced Options Grid */}
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                {question.options.map((option, index) => (
                  <Card 
                    key={option.id}
                    className={`cursor-pointer transition-all duration-500 hover:scale-105 overflow-hidden rounded-2xl ${
                      selectedOption === option.id 
                        ? 'border-2 border-primary bg-primary/10 shadow-2xl ring-4 ring-primary/30 scale-105' 
                        : 'border border-border/50 hover:border-primary/50 hover:bg-accent/10 shadow-lg hover:shadow-warm'
                    }`}
                    onClick={() => handleOptionSelect(option.id)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img 
                        src={option.image} 
                        alt={option.label}
                        className="w-full h-full object-cover transition-all duration-700 hover:scale-110"
                      />
                      {selectedOption === option.id && (
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-primary/20 flex items-center justify-center">
                          <div className="bg-white rounded-full p-3 shadow-warm">
                            <Sparkles className="w-8 h-8 text-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold text-foreground font-display">{option.label}</h3>
                        {selectedOption === option.id && (
                          <Badge className="bg-gradient-primary text-white shadow-soft animate-pulse">Selected</Badge>
                        )}
                      </div>
                      {option.description && (
                        <p className="text-base text-muted-foreground font-body leading-relaxed">{option.description}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Enhanced Navigation */}
              <div className="flex justify-center">
                <Button 
                  onClick={handleNext}
                  disabled={!canProceed}
                  variant="hero"
                  size="lg"
                  className={`min-w-48 h-14 text-lg font-semibold transition-all duration-300 ${
                    !canProceed ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                  }`}
                >
                  {isLastQuestion ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Get My Results
                      <Sparkles className="w-5 h-5 ml-3" />
                    </>
                  ) : (
                    <>
                      Continue Journey
                      <ArrowRight className="w-5 h-5 ml-3" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};