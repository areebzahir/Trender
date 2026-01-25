import { useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { ChoicePage } from "@/components/ChoicePage";
import { RoomUpload } from "@/components/RoomUpload";
import TrenderSwipeScreen from "@/components/TrenderSwipeScreen";
import { StyleQuiz } from "@/components/StyleQuiz";
import { StyleResults } from "@/components/StyleResults";
import { EnhancedSwipeInterface } from "@/components/EnhancedSwipeInterface";

type AppState = 'landing' | 'choice' | 'upload' | 'quiz' | 'results' | 'swipe' | 'enhanced-swipe';

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
    setCurrentState('swipe');
  };

  const handleQuizComplete = (results: Record<string, string>) => {
    console.log('Quiz completed with results:', results);
    setRoomData(prev => {
      const newData = prev ? { ...prev, quizResults: results } : { image: null, preferences: '', quizResults: results };
      console.log('Setting roomData:', newData);
      return newData;
    });
    setCurrentState('results');
  };

  const handleResultsContinue = () => {
    setCurrentState('swipe');
  };

  const handleUploadFromResults = () => {
    setCurrentState('upload');
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
    // Initialize roomData with empty quiz results for direct quiz access
    setRoomData({
      image: null,
      preferences: '',
      quizResults: {}
    });
    setCurrentState('quiz');
  };

  const handleBackToChoice = () => {
    setCurrentState('choice');
  };

  const handleGoToEnhancedSwipe = () => {
    setCurrentState('enhanced-swipe');
  };

  const handleBackToSwipe = () => {
    setCurrentState('swipe');
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

  if (currentState === 'quiz') {
    return (
      <StyleQuiz
        onComplete={handleQuizComplete}
        onBack={handleBackToChoice}
      />
    );
  }

  if (currentState === 'results' && roomData?.quizResults) {
    return (
      <StyleResults
        results={roomData.quizResults}
        onBack={handleBackToQuiz}
        onContinue={handleResultsContinue}
        onUploadRoom={handleUploadFromResults}
      />
    );
  }

  if (currentState === 'swipe') {
    return (
      <TrenderSwipeScreen
        onBack={handleBackToChoice}
        onGoToEnhancedSwipe={handleGoToEnhancedSwipe}
        roomData={roomData}
      />
    );
  }

  if (currentState === 'enhanced-swipe' && roomData) {
    return (
      <EnhancedSwipeInterface
        onBack={handleBackToSwipe}
        roomData={roomData}
      />
    );
  }

  return <LandingPage onGetStarted={handleGetStarted} />;
};

export default Index;
