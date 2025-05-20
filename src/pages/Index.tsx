
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import MarketPulse from '../components/MarketPulse';
import FlashBriefs from '../components/FlashBriefs';
import MemoryCheck from '../components/MemoryCheck';
import Onboarding from '../components/Onboarding';

const Index = () => {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [userLevel, setUserLevel] = useState<'novice' | 'analyst' | 'pro'>('novice');
  const [userInterests, setUserInterests] = useState<string[]>([]);

  // Check if we should show the memory check quiz (every other day)
  useEffect(() => {
    const today = new Date();
    const shouldShowQuiz = today.getDate() % 2 === 0; // Show on even days
    
    // For demo purposes, we'll always show the quiz if user is onboarded
    setShowQuiz(isOnboarded);

    // In a real app, we'd load onboarding state from local storage or a database
    const savedOnboardingState = localStorage.getItem('marketMentor_onboarded');
    if (savedOnboardingState === 'true') {
      setIsOnboarded(true);
      
      const savedLevel = localStorage.getItem('marketMentor_level') as 'novice' | 'analyst' | 'pro';
      if (savedLevel) {
        setUserLevel(savedLevel);
      }
      
      const savedInterests = localStorage.getItem('marketMentor_interests');
      if (savedInterests) {
        setUserInterests(JSON.parse(savedInterests));
      }
    }
  }, []);

  const handleOnboardingComplete = (level: string, interests: string[]) => {
    setIsOnboarded(true);
    setUserLevel(level as 'novice' | 'analyst' | 'pro');
    setUserInterests(interests);
    
    // Save onboarding state
    localStorage.setItem('marketMentor_onboarded', 'true');
    localStorage.setItem('marketMentor_level', level);
    localStorage.setItem('marketMentor_interests', JSON.stringify(interests));
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
  };

  // Show onboarding if not onboarded
  if (!isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-finance-navy">God morgon!</h1>
          <p className="text-finance-gray">
            {new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Show Quiz if it's quiz day */}
        {showQuiz && (
          <MemoryCheck onComplete={handleQuizComplete} difficulty={userLevel} />
        )}

        {/* Market Pulse Section */}
        <MarketPulse />
        
        {/* Flash Briefs Section */}
        <FlashBriefs />
      </div>
    </Layout>
  );
};

export default Index;
