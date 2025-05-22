
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import MarketPulse from '../components/MarketPulse';
import FlashBriefs from '../components/FlashBriefs';
import MemoryCheck from '../components/MemoryCheck';
import Onboarding from '../components/Onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { UserProgress, defaultUserProgress, getLearningPathRecommendations } from '../mockData/quizData';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [userLevel, setUserLevel] = useState<'novice' | 'analyst' | 'pro'>('novice');
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>(defaultUserProgress);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);

  // Check auth status first
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch user profile data after authentication
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (error) throw error;
          
          if (data) {
            // User has a profile, consider them onboarded
            setIsOnboarded(true);
            setUserLevel(data.level as 'novice' | 'analyst' | 'pro');
            setUserInterests(data.interests || []);
            console.log('Profile loaded:', data);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setProfileLoading(false);
        }
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Check onboarding status and user progress
  useEffect(() => {
    if (isOnboarded) {
      // Check for onboarding status
      const savedOnboardingState = localStorage.getItem('marketMentor_onboarded');
      if (savedOnboardingState === 'true') {
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
          
          // Generate learning recommendations
          const learningRecs = getLearningPathRecommendations(progress);
          setRecommendations(learningRecs);
          
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
    }
  }, [isOnboarded]);

  const handleOnboardingComplete = async (level: string, interests: string[]) => {
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
    
    // Set initial recommendations
    setRecommendations(getLearningPathRecommendations(initialProgress));
    
    // Update user profile in Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            level: level, 
            interests: interests 
          })
          .eq('id', user.id);
        
        if (error) throw error;
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
    
    // Reload progress after quiz completion
    const savedProgress = localStorage.getItem('marketMentor_progress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setUserProgress(progress);
      
      // Update recommendations based on new progress
      setRecommendations(getLearningPathRecommendations(progress));
    }
  };

  // Show loading state during authentication
  if (loading || profileLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-finance-navy" />
        </div>
      </Layout>
    );
  }

  // Show onboarding if not onboarded
  if (!isOnboarded && user) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-finance-navy dark:text-gray-200">
            {getGreeting()}, {user?.user_metadata?.display_name || 'Investor'}
          </h1>
          <p className="text-finance-gray dark:text-gray-400">
            {new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          
          {/* User Stats */}
          <div className="flex flex-wrap items-center mt-2 gap-2">
            {userProgress.streakDays > 0 && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full dark:bg-amber-900 dark:bg-opacity-30 dark:text-amber-300">
                🔥 {userProgress.streakDays} day streak
              </span>
            )}
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300">
              Level: {userLevel}
            </span>
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full dark:bg-purple-900 dark:bg-opacity-30 dark:text-purple-300">
              {userProgress.points} pts
            </span>
            {userProgress.quizAccuracy !== undefined && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full dark:bg-green-900 dark:bg-opacity-30 dark:text-green-300">
                Accuracy: {Math.round(userProgress.quizAccuracy)}%
              </span>
            )}
          </div>
        </div>

        {/* Learning Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-6 animate-fade-in">
            <Alert className="bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-900">
              <BookOpen className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <AlertTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Learning Path
              </AlertTitle>
              <AlertDescription className="text-xs text-blue-700 dark:text-blue-400">
                <p className="mb-2">Based on your progress, we recommend:</p>
                <ul className="pl-5 list-disc space-y-1">
                  {recommendations.slice(0, 3).map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

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
