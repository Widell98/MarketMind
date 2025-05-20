
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import MarketPulse from '../components/MarketPulse';
import FlashBriefs from '../components/FlashBriefs';
import MemoryCheck from '../components/MemoryCheck';
import Onboarding from '../components/Onboarding';
import { UserProgress, defaultUserProgress } from '../mockData/quizData';

const Index = () => {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [userLevel, setUserLevel] = useState<'novice' | 'analyst' | 'pro'>('novice');
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>(defaultUserProgress);

  // Check onboarding status and user progress
  useEffect(() => {
    // Check for onboarding status
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
      
      // Load user progress
      const savedProgress = localStorage.getItem('marketMentor_progress');
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        setUserProgress(progress);
        
        // Use progress level if available
        if (progress.level) {
          setUserLevel(progress.level as 'novice' | 'analyst' | 'pro');
        }
      }
    }
    
    // Determine if we should show quiz today
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    
    // For demo purposes we'll show the quiz if:
    // 1. User is onboarded
    // 2. It's a weekday (Monday-Friday)
    // 3. User hasn't completed a quiz today
    if (savedOnboardingState === 'true' && dayOfWeek >= 1 && dayOfWeek <= 5) {
      const savedProgress = localStorage.getItem('marketMentor_progress');
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        const lastQuizDate = progress.lastQuizDate;
        const todayStr = today.toISOString().split('T')[0];
        
        // Show quiz if user hasn't completed one today
        if (lastQuizDate !== todayStr) {
          setShowQuiz(true);
        }
      } else {
        // No progress saved, show quiz
        setShowQuiz(true);
      }
    }
  }, []);

  const handleOnboardingComplete = (level: string, interests: string[]) => {
    setIsOnboarded(true);
    setUserLevel(level as 'novice' | 'analyst' | 'pro');
    setUserInterests(interests);
    setShowQuiz(true); // Show quiz after onboarding
    
    // Save onboarding state
    localStorage.setItem('marketMentor_onboarded', 'true');
    localStorage.setItem('marketMentor_level', level);
    localStorage.setItem('marketMentor_interests', JSON.stringify(interests));
    
    // Initialize user progress
    const initialProgress = {
      ...defaultUserProgress,
      level: level
    };
    localStorage.setItem('marketMentor_progress', JSON.stringify(initialProgress));
    setUserProgress(initialProgress);
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
    
    // Reload progress after quiz completion
    const savedProgress = localStorage.getItem('marketMentor_progress');
    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress));
    }
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
          <h1 className="text-xl font-semibold text-finance-navy dark:text-gray-200">
            {getGreeting()}, {userLevel === 'pro' ? 'Expert' : userLevel === 'analyst' ? 'Analyst' : 'Investor'}
          </h1>
          <p className="text-finance-gray dark:text-gray-400">
            {new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          
          {/* User Stats */}
          <div className="flex items-center mt-2 space-x-3">
            {userProgress.streakDays > 0 && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full dark:bg-amber-900 dark:bg-opacity-30 dark:text-amber-300">
                🔥 {userProgress.streakDays} day streak
              </span>
            )}
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300">
              Level: {userProgress.level}
            </span>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full dark:bg-purple-900 dark:bg-opacity-30 dark:text-purple-300">
              {userProgress.points} pts
            </span>
          </div>
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

// Helper function to get appropriate greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'God morgon';
  if (hour < 18) return 'God eftermiddag';
  return 'God kväll';
};

export default Index;
