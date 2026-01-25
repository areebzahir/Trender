import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

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
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
        description: "Terracotta, sage, cream tones"
      },
      {
        id: "cool",
        label: "Cool & Calm",
        image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=300&fit=crop",
        description: "Blues, grays, whites"
      },
      {
        id: "bold",
        label: "Bold & Vibrant",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
        description: "Rich jewel tones"
      },
      {
        id: "neutral",
        label: "Neutral & Minimal",
        image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&h=300&fit=crop",
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
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={handlePrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentQuestion === 0 ? 'Back' : 'Previous'}
          </Button>
          <div className="text-center">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Style Discovery</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {quizQuestions.length}
            </p>
          </div>
          <div className="w-16" /> {/* Spacer */}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-8">
          <div 
            className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {question.question}
          </h2>
          <p className="text-muted-foreground">
            Choose the option that best represents your style preference
          </p>
        </div>

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {question.options.map((option) => (
            <Card 
              key={option.id}
              className={`cursor-pointer transition-all duration-200 overflow-hidden hover:shadow-warm ${
                selectedOption === option.id 
                  ? 'ring-2 ring-primary border-primary shadow-warm' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => handleOptionSelect(option.id)}
            >
              <div className="aspect-video overflow-hidden">
                <img 
                  src={option.image} 
                  alt={option.label}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{option.label}</h3>
                  {selectedOption === option.id && (
                    <Badge variant="default">Selected</Badge>
                  )}
                </div>
                {option.description && (
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-center">
          <Button 
            onClick={handleNext}
            disabled={!canProceed}
            variant="hero"
            size="lg"
            className="min-w-32"
          >
            {isLastQuestion ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get Results
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};