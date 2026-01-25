import { useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { RoomUpload } from "@/components/RoomUpload";
import { SwipeInterface } from "@/components/SwipeInterface";

type AppState = 'landing' | 'upload' | 'swipe';

interface RoomData {
  image: File | null;
  preferences: string;
  specific?: string;
}

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('landing');
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  const handleGetStarted = () => {
    setCurrentState('upload');
  };

  const handleRoomUpload = (data: RoomData) => {
    setRoomData(data);
    setCurrentState('swipe');
  };

  const handleBackToLanding = () => {
    setCurrentState('landing');
    setRoomData(null);
  };

  const handleBackToUpload = () => {
    setCurrentState('upload');
  };

  if (currentState === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (currentState === 'upload') {
    return (
      <RoomUpload 
        onContinue={handleRoomUpload}
        onBack={handleBackToLanding}
      />
    );
  }

  if (currentState === 'swipe' && roomData) {
    return (
      <SwipeInterface 
        onBack={handleBackToUpload}
        roomData={roomData}
      />
    );
  }

  return <LandingPage onGetStarted={handleGetStarted} />;
};

export default Index;
