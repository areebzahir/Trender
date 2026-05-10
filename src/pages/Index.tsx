import { useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { ChoicePage } from "@/components/ChoicePage";
import { RoomUploadPage } from "@/components/RoomUploadPage";
import SwipeResultsPage from "@/components/SwipeResultsPage";
import TrenderSwipeScreen from "@/components/TrenderSwipeScreen";
import { StyleQuiz } from "@/components/StyleQuiz";
import { StyleResults } from "@/components/StyleResults";
import { EnhancedSwipeInterface } from "@/components/EnhancedSwipeInterface";
import type { AIAnalysisResult } from "@/types/api";
import type { ProductCandidate, PlacementRecommendation } from "@/lib/room-overlay/types";

type AppState =
  | 'landing'
  | 'choice'
  | 'upload'
  | 'quiz'
  | 'results'
  | 'swipe'
  | 'enhanced-swipe'
  | 'swipe-results'; // AI-powered swipe results with stitched images

interface RoomData {
  image: File | null;
  preferences: string;
  specific?: string;
  quizResults?: Record<string, string>;
}

// Holds everything needed for the swipe results page
interface SwipeResultsData {
  imageBase64: string;
  candidates: ProductCandidate[];
  placement: PlacementRecommendation | null;
  roomType: string;
  designGoal: string;
}

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('landing');
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [swipeData, setSwipeData] = useState<SwipeResultsData | null>(null);

  const handleGetStarted = () => setCurrentState('choice');

  const handleRoomUpload = (data: RoomData) => {
    setRoomData(data);
    setCurrentState('swipe');
  };

  const handleQuizComplete = (results: Record<string, string>) => {
    setRoomData(prev =>
      prev ? { ...prev, quizResults: results }
           : { image: null, preferences: '', quizResults: results }
    );
    setCurrentState('results');
  };

  const handleResultsContinue = () => setCurrentState('swipe');
  const handleUploadFromResults = () => setCurrentState('upload');
  const handleBackToLanding = () => { setCurrentState('landing'); setRoomData(null); };
  const handleRoomDecorating = () => setCurrentState('upload');
  const handleStyleQuiz = () => {
    setRoomData({ image: null, preferences: '', quizResults: {} });
    setCurrentState('quiz');
  };
  const handleBackToChoice = () => setCurrentState('choice');
  const handleGoToEnhancedSwipe = () => setCurrentState('enhanced-swipe');
  const handleBackToSwipe = () => setCurrentState('swipe');

  /** Called by RoomUploadPage when the full AI pipeline completes. */
  const handleAIAnalysisComplete = (result: AIAnalysisResult & {
    candidates?: ProductCandidate[];
    placement?: PlacementRecommendation | null;
  }) => {
    setSwipeData({
      imageBase64: result.imageBase64,
      candidates: result.candidates ?? result.products.map(p => ({
        id: p.id,
        title: p.name,
        storeName: p.storeName,
        price: p.price,
        currency: p.currency,
        productUrl: p.productUrl,
        imageUrl: p.imageUrl,
        imageUrls: [p.imageUrl],
        category: p.category,
        furnitureType: p.category,
        roomType: p.roomTags?.[0] ?? null,
        colors: p.colorTags,
        materials: p.materialTags,
        styleTags: p.styleTags,
        aestheticTags: [],
        widthCm: null,
        heightCm: null,
        depthCm: null,
        structuredScore: 0,
        finalScore: 0,
        whySelected: '',
        renderWarnings: [],
      })),
      placement: result.placement ?? null,
      roomType: result.analysis.roomType,
      designGoal: result.analysis.designGoal,
    });
    setCurrentState('swipe-results');
  };

  const handleStartOver = () => {
    setSwipeData(null);
    setRoomData(null);
    setCurrentState('landing');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (currentState === 'landing')
    return <LandingPage onGetStarted={handleGetStarted} />;

  if (currentState === 'choice')
    return (
      <ChoicePage
        onBack={handleBackToLanding}
        onRoomDecorating={handleRoomDecorating}
        onStyleQuiz={handleStyleQuiz}
      />
    );

  if (currentState === 'upload')
    return (
      <RoomUploadPage
        onAnalysisComplete={handleAIAnalysisComplete}
        onBack={handleBackToChoice}
      />
    );

  if (currentState === 'swipe-results' && swipeData)
    return (
      <SwipeResultsPage
        roomImageBase64={swipeData.imageBase64}
        candidates={swipeData.candidates}
        placement={swipeData.placement}
        roomType={swipeData.roomType}
        designGoal={swipeData.designGoal}
        onBack={() => setCurrentState('upload')}
        onStartOver={handleStartOver}
      />
    );

  if (currentState === 'quiz')
    return (
      <StyleQuiz
        onComplete={handleQuizComplete}
        onBack={handleBackToChoice}
      />
    );

  if (currentState === 'results' && roomData?.quizResults)
    return (
      <StyleResults
        results={roomData.quizResults}
        onBack={() => setCurrentState('quiz')}
        onContinue={handleResultsContinue}
        onUploadRoom={handleUploadFromResults}
      />
    );

  if (currentState === 'swipe')
    return (
      <TrenderSwipeScreen
        onBack={handleBackToChoice}
        onGoToEnhancedSwipe={handleGoToEnhancedSwipe}
        roomData={roomData}
      />
    );

  if (currentState === 'enhanced-swipe' && roomData)
    return (
      <EnhancedSwipeInterface
        onBack={handleBackToSwipe}
        roomData={roomData}
      />
    );

  return <LandingPage onGetStarted={handleGetStarted} />;
};

export default Index;
