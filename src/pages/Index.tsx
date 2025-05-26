
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
import { BookOpen, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch user profile data only if authenticated
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setProfileLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (error) throw error;
          
          if (data) {
            setIsOnboarded(true);
            setUserLevel(data.level as 'novice' | 'analyst' | 'pro');
            
            if (data.interests) {
              if (Array.isArray(data.interests)) {
                setUserInterests(data.interests.map(item => String(item)));
              } else {
                console.warn('Interests data is not an array:', data.interests);
                setUserInterests([]);
              }
            } else {
              setUserInterests([]);
            }
            
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

  // Check onboarding status and user progress for authenticated users
  useEffect(() => {
    if (user && isOnboarded) {
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
        
        const savedProgress = localStorage.getItem('marketMentor_progress');
        if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          setUserProgress(progress);
          
          const learningRecs = getLearningPathRecommendations(progress);
          setRecommendations(learningRecs);
          
          if (progress.level) {
            setUserLevel(progress.level as 'novice' | 'analyst' | 'pro');
          }
        }
      }
      
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      if (savedOnboardingState === 'true' && dayOfWeek >= 1 && dayOfWeek <= 5) {
        const savedProgress = localStorage.getItem('marketMentor_progress');
        if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          const lastQuizDate = progress.lastQuizDate;
          const todayStr = today.toISOString().split('T')[0];
          
          if (lastQuizDate !== todayStr) {
            setShowQuiz(true);
          }
        } else {
          setShowQuiz(true);
        }
      }
    }
  }, [user, isOnboarded]);

  const handleOnboardingComplete = async (level: string, interests: string[]) => {
    setIsOnboarded(true);
    setUserLevel(level as 'novice' | 'analyst' | 'pro');
    setUserInterests(interests);
    setShowQuiz(true);
    
    localStorage.setItem('marketMentor_onboarded', 'true');
    localStorage.setItem('marketMentor_level', level);
    localStorage.setItem('marketMentor_interests', JSON.stringify(interests));
    
    const initialProgress = {
      ...defaultUserProgress,
      level: level
    };
    localStorage.setItem('marketMentor_progress', JSON.stringify(initialProgress));
    setUserProgress(initialProgress);
    
    setRecommendations(getLearningPathRecommendations(initialProgress));
    
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
    
    const savedProgress = localStorage.getItem('marketMentor_progress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setUserProgress(progress);
      setRecommendations(getLearningPathRecommendations(progress));
    }
  };

  // Show loading state only during authentication, not for the entire page
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh] sm:h-[70vh]">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-finance-navy" />
        </div>
      </Layout>
    );
  }

  // Show onboarding only for authenticated users who haven't completed it
  if (user && !isOnboarded && !profileLoading) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content - Takes full width on mobile, 2 columns on desktop */}
        <div className="lg:col-span-2">
          {/* Greeting Section */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-finance-navy dark:text-gray-200">
              {getGreeting()}{user ? `, ${user?.user_metadata?.display_name || 'Investor'}` : ''}
            </h1>
            <p className="text-sm sm:text-base text-finance-gray dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            
            {/* User Stats - only for authenticated users */}
            {user && (
              <div className="flex flex-wrap items-center mt-3 gap-2">
                {userProgress.streakDays > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full dark:bg-amber-900 dark:bg-opacity-30 dark:text-amber-300">
                    🔥 {userProgress.streakDays} day streak
                  </span>
                )}
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300">
                  Level: {userLevel}
                </span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full dark:bg-purple-900 dark:bg-opacity-30 dark:text-purple-300">
                  {userProgress.points} pts
                </span>
                {userProgress.quizAccuracy !== undefined && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full dark:bg-green-900 dark:bg-opacity-30 dark:text-green-300">
                    Accuracy: {Math.round(userProgress.quizAccuracy)}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quiz Section */}
          <div className="mb-6 lg:mb-8">
            {/* Show Quiz for authenticated users */}
            {user && showQuiz && (
              <MemoryCheck onComplete={handleQuizComplete} difficulty={userLevel} />
            )}

            {/* Show Quiz for guests but with basic difficulty */}
            {!user && (
              <MemoryCheck onComplete={() => {}} difficulty="novice" />
            )}
          </div>
        </div>

        {/* Sidebar - Full width on mobile, 1 column on desktop */}
        <div className="lg:col-span-1">
          {/* Guest Call-to-Action */}
          {!user && (
            <div className="mb-6 animate-fade-in">
              <Alert className="bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-900">
                <UserPlus className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <AlertTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Få personaliserade frågor
                </AlertTitle>
                <AlertDescription className="text-xs text-blue-700 dark:text-blue-400">
                  <p className="mb-3">Registrera dig för att få frågor anpassade till din nivå och dina intressen!</p>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                    onClick={() => navigate('/auth')}
                  >
                    Registrera dig
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Learning Recommendations - only for authenticated users */}
          {user && recommendations.length > 0 && (
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
        </div>

        {/* Full width content sections */}
        <div className="lg:col-span-3 space-y-6 lg:space-y-8">
          {/* Market Pulse Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <MarketPulse />
            <FlashBriefs />
          </div>
        </div>
      </div>
    </Layout>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'God morgon';
  if (hour < 18) return 'God eftermiddag';
  return 'God kväll';
};

export default Index;
