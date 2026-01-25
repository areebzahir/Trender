import { useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { ChoicePage } from "@/components/ChoicePage";
import { RoomUpload } from "@/components/RoomUpload";
import { EnhancedSwipeInterface } from "@/components/EnhancedSwipeInterface";
import { StyleQuiz } from "@/components/StyleQuiz";

type AppState = 'landing' | 'choice' | 'upload' | 'quiz' | 'swipe';

interface RoomData {
  image: File | null;
  preferences: string;
  specific?: string;
  quizResults?: Record<string, string>;
}

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('landing');
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  const handleGetStarted = () => {
    setCurrentState('choice');
  };

  const handleRoomUpload = (data: RoomData) => {
    setRoomData(data);
    setCurrentState('quiz');
  };

  const handleQuizComplete = (results: Record<string, string>) => {
    setRoomData(prev => prev ? { ...prev, quizResults: results } : null);
    setCurrentState('swipe');
  };

  const handleBackToLanding = () => {
    setCurrentState('landing');
    setRoomData(null);
  };

  const handleBackToUpload = () => {
    setCurrentState('upload');
  };

  const handleBackToQuiz = () => {
    setCurrentState('quiz');
  };

  const handleRoomDecorating = () => {
    setCurrentState('upload');
  };

  const handleStyleQuiz = () => {
    setCurrentState('quiz');
  };

  const handleBackToChoice = () => {
    setCurrentState('choice');
  };

  if (currentState === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (currentState === 'choice') {
    return (
      <ChoicePage 
        onBack={handleBackToLanding}
        onRoomDecorating={handleRoomDecorating}
        onStyleQuiz={handleStyleQuiz}
      />
    );
  }

  if (currentState === 'upload') {
    return (
      <RoomUpload 
        onContinue={handleRoomUpload}
        onBack={handleBackToChoice}
      />
    );
  }

  if (currentState === 'quiz' && roomData) {
    return (
      <StyleQuiz
        onComplete={handleQuizComplete}
        onBack={handleBackToChoice}
      />
    );
  }

  if (currentState === 'swipe' && roomData) {
    return (
      <EnhancedSwipeInterface 
        onBack={handleBackToQuiz}
        roomData={roomData}
      />
    );
  }

  return <LandingPage onGetStarted={handleGetStarted} />;
};

export default Index;
