import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import MarketPulse from '../components/MarketPulse';
import FlashBriefs from '../components/FlashBriefs';
import MemoryCheck from '../components/MemoryCheck';
import Onboarding from '../components/Onboarding';
import StockCaseCard from '../components/StockCaseCard';
import { useAuth } from '@/contexts/AuthContext';
import { useStockCases } from '@/hooks/useStockCases';
import { UserProgress, defaultUserProgress, getLearningPathRecommendations } from '../mockData/quizData';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Loader2, UserPlus, TrendingUp, Plus, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { stockCases, loading: stockCasesLoading } = useStockCases();
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

  const handleViewStockCaseDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh] sm:h-[70vh]">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-finance-navy" />
        </div>
      </Layout>
    );
  }

  if (user && !isOnboarded && !profileLoading) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Layout>
      <div className="space-y-6 lg:space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Market Mentor
          </h1>
          
          {/* User Stats */}
          {user && (
            <div className="flex flex-wrap justify-center items-center mt-3 gap-2">
              {userProgress.streakDays > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  🔥 {userProgress.streakDays} day streak
                </Badge>
              )}
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                Level: {userLevel}
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                {userProgress.points} pts
              </Badge>
            </div>
          )}
        </div>

        {/* Stock Cases Section - First */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {user ? 'Dina följda aktiecases' : 'Populära aktiecases'}
              </h2>
            </div>
            {user && (
              <Button 
                onClick={() => navigate('/admin/stock-cases')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Skapa case
              </Button>
            )}
          </div>

          {stockCasesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : stockCases.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <TrendingUp className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {user ? 'Inga aktiecases än' : 'Inga publika aktiecases än'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {user 
                  ? 'Börja följa andra användare eller skapa ditt första aktiecase!'
                  : 'Registrera dig för att se och skapa aktiecases.'
                }
              </p>
              {user ? (
                <Button onClick={() => navigate('/admin/stock-cases')}>
                  Skapa ditt första case
                </Button>
              ) : (
                <Button onClick={() => navigate('/auth')}>
                  Registrera dig
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stockCases.map((stockCase) => (
                <StockCaseCard
                  key={stockCase.id}
                  stockCase={stockCase}
                  onViewDetails={handleViewStockCaseDetails}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quiz Section */}
        {user && showQuiz && (
          <div className="mb-6">
            <MemoryCheck onComplete={handleQuizComplete} difficulty={userLevel} />
          </div>
        )}

        {/* Learning Recommendations */}
        {user && recommendations.length > 0 && (
          <Alert className="bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-900">
            <BookOpen className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <AlertTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Learning Path
            </AlertTitle>
            <AlertDescription className="text-xs text-blue-700 dark:text-blue-400">
              <p className="mb-2">Baserat på dina framsteg rekommenderar vi:</p>
              <ul className="pl-5 list-disc space-y-1">
                {recommendations.slice(0, 3).map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Always show quiz for guests or when not daily quiz time */}
        {(!user || !showQuiz) && (
          <div className="mb-6">
            <MemoryCheck onComplete={handleQuizComplete} difficulty={userLevel} />
          </div>
        )}

        {/* Market Pulse Section */}
        <MarketPulse />

        {/* Flash Briefs Section */}
        <FlashBriefs />

        {/* Guest Call-to-Action */}
        {!user && (
          <Alert className="bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-900">
            <UserPlus className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <AlertTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Gå med i communityn
            </AlertTitle>
            <AlertDescription className="text-xs text-blue-700 dark:text-blue-400">
              <p className="mb-3">Registrera dig för att följa andra investerare och skapa egna aktiecases!</p>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => navigate('/auth')}
              >
                Registrera dig
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Layout>
  );
};

export default Index;
