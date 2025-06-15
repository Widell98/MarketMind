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
import { BookOpen, Loader2, UserPlus, TrendingUp, Newspaper, Users, Activity, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showFollowedOnly, setShowFollowedOnly] = useState(false);
  const { stockCases, loading: stockCasesLoading, deleteStockCase } = useStockCases(showFollowedOnly);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [userLevel, setUserLevel] = useState<'novice' | 'analyst' | 'pro'>('novice');
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>(defaultUserProgress);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("aktiecases");

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

  const handleDeleteStockCase = async (id: string) => {
    try {
      await deleteStockCase(id);
    } catch (error) {
      // Error is already handled in the deleteStockCase function
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh] sm:h-[70vh] lg:h-[80vh]">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 animate-spin text-finance-navy" />
        </div>
      </Layout>
    );
  }

  if (user && !isOnboarded && !profileLoading) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <Layout>
      <div className="section-spacing">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="heading-responsive font-bold text-gray-900 dark:text-gray-100 mb-2 lg:mb-4 xl:mb-6">
            Market Mentor
          </h1>
          {/* User level badges under main title */}
          {user && (
            <div className="flex flex-wrap justify-center items-center mt-3 lg:mt-4 xl:mt-6 gap-2 lg:gap-3 xl:gap-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 lg:text-base xl:text-lg lg:px-4 lg:py-2">
                Level: {userLevel}
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 lg:text-base xl:text-lg lg:px-4 lg:py-2">
                {userProgress.points} pts
              </Badge>
              {userProgress.streakDays > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 lg:text-base xl:text-lg lg:px-4 lg:py-2">
                  🔥 {userProgress.streakDays} day streak
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Community Section - visas ENDAST på aktiecases */}
        {activeTab === "aktiecases" && (
          <div className="dashboard-grid">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 card-hover-desktop">
              <CardHeader className="pb-2 lg:pb-3">
                <div className="flex items-center gap-2 lg:gap-3">
                  <Users className="w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-blue-600 dark:text-blue-400" />
                  <CardTitle className="text-lg lg:text-xl xl:text-2xl text-blue-800 dark:text-blue-200">Community</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-blue-900 dark:text-blue-100 mb-1 lg:mb-2">
                  {user ? '1,234' : '---'}
                </div>
                <p className="text-sm lg:text-base xl:text-lg text-blue-700 dark:text-blue-300">Aktiva medlemmar</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 card-hover-desktop">
              <CardHeader className="pb-2 lg:pb-3">
                <div className="flex items-center gap-2 lg:gap-3">
                  <Activity className="w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-green-600 dark:text-green-400" />
                  <CardTitle className="text-lg lg:text-xl xl:text-2xl text-green-800 dark:text-green-200">Cases idag</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-green-900 dark:text-green-100 mb-1 lg:mb-2">
                  {stockCases.length}
                </div>
                <p className="text-sm lg:text-base xl:text-lg text-green-700 dark:text-green-300">Nya aktiecases</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 card-hover-desktop">
              <CardHeader className="pb-2 lg:pb-3">
                <div className="flex items-center gap-2 lg:gap-3">
                  <Trophy className="w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-purple-600 dark:text-purple-400" />
                  <CardTitle className="text-lg lg:text-xl xl:text-2xl text-purple-800 dark:text-purple-200">Topplista</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl lg:text-3xl xl:text-4xl font-bold text-purple-900 dark:text-purple-100 mb-1 lg:mb-2">
                  {user ? '#47' : '---'}
                </div>
                <p className="text-sm lg:text-base xl:text-lg text-purple-700 dark:text-purple-300">Din ranking</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs Section */}
        <div className="pt-6 lg:pt-8 xl:pt-10">
          <Tabs defaultValue="aktiecases" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex lg:h-12 xl:h-14">
              <TabsTrigger value="aktiecases" className="flex items-center gap-2 lg:px-6 xl:px-8 lg:text-base xl:text-lg">
                <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5" />
                Aktiecases
              </TabsTrigger>
              <TabsTrigger value="larodel" className="flex items-center gap-2 lg:px-6 xl:px-8 lg:text-base xl:text-lg">
                <BookOpen className="w-4 h-4 lg:w-5 lg:h-5" />
                Lärodel
              </TabsTrigger>
            </TabsList>
            
            {/* Aktiecases Tab */}
            <TabsContent value="aktiecases" className="section-spacing mt-6 lg:mt-8">
              {/* Stock Cases Section */}
              <div className="section-spacing">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                    <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 xl:w-10 xl:h-10 text-blue-600 dark:text-blue-400" />
                    <h2 className="subheading-responsive font-bold text-gray-900 dark:text-gray-100">
                      {showFollowedOnly ? 'Följda aktiecases' : 'Alla aktiecases'}
                    </h2>
                  </div>
                  
                  {user && (
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <span className="text-sm lg:text-base xl:text-lg text-gray-600 dark:text-gray-400">
                        {showFollowedOnly ? 'Följda' : 'Alla'}
                      </span>
                      <Switch
                        checked={showFollowedOnly}
                        onCheckedChange={setShowFollowedOnly}
                        className="lg:scale-110 xl:scale-125"
                      />
                    </div>
                  )}
                </div>

                {stockCasesLoading ? (
                  <div className="flex justify-center py-12 lg:py-16 xl:py-20">
                    <Loader2 className="h-8 w-8 lg:h-12 lg:w-12 xl:h-16 xl:w-16 animate-spin text-blue-600" />
                  </div>
                ) : stockCases.length === 0 ? (
                  <div className="text-center py-12 lg:py-16 xl:py-20 bg-gray-50 dark:bg-gray-800 rounded-lg lg:rounded-xl">
                    <TrendingUp className="w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 text-gray-400 dark:text-gray-600 mx-auto mb-4 lg:mb-6" />
                    <h3 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2 lg:mb-4">
                      {showFollowedOnly 
                        ? 'Du följer inga aktiecases än' 
                        : user 
                          ? 'Inga aktiecases än' 
                          : 'Inga publika aktiecases än'
                      }
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 lg:mb-6 lg:text-lg xl:text-xl">
                      {showFollowedOnly
                        ? 'Börja följa andra användares aktiecases för att se dem här!'
                        : user 
                          ? 'Börja följa andra användare eller skapa ditt första aktiecase!'
                          : 'Registrera dig för att se och skapa aktiecases.'
                      }
                    </p>
                    {user ? (
                      <Button onClick={() => navigate('/profile')} className="btn-responsive lg:text-base xl:text-lg">
                        Gå till profil för att skapa case
                      </Button>
                    ) : (
                      <Button onClick={() => navigate('/auth')} className="btn-responsive lg:text-base xl:text-lg">
                        Registrera dig
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="stock-case-grid">
                    {stockCases.map((stockCase) => (
                      <StockCaseCard
                        key={stockCase.id}
                        stockCase={stockCase}
                        onViewDetails={handleViewStockCaseDetails}
                        onDelete={handleDeleteStockCase}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Guest Call-to-Action for Aktiecases */}
              {!user && (
                <Alert className="bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-900 lg:p-6 xl:p-8">
                  <UserPlus className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-blue-500 dark:text-blue-400" />
                  <AlertTitle className="text-sm lg:text-base xl:text-lg font-medium text-blue-800 dark:text-blue-300">
                    Gå med i communityn
                  </AlertTitle>
                  <AlertDescription className="text-xs lg:text-sm xl:text-base text-blue-700 dark:text-blue-400">
                    <p className="mb-3 lg:mb-4">Registrera dig för att följa andra investerare och skapa egna aktiecases!</p>
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 text-white btn-responsive"
                      onClick={() => navigate('/auth')}
                    >
                      Registrera dig
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Lärodel Tab */}
            <TabsContent value="larodel" className="section-spacing mt-6 lg:mt-8">
              {/* Quiz Section */}
              {user && showQuiz && (
                <div className="mb-6 lg:mb-8 xl:mb-10">
                  <MemoryCheck onComplete={handleQuizComplete} difficulty={userLevel} />
                </div>
              )}

              {/* Learning Recommendations */}
              {user && recommendations.length > 0 && (
                <Alert className="bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-900 lg:p-6 xl:p-8">
                  <BookOpen className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-blue-500 dark:text-blue-400" />
                  <AlertTitle className="text-sm lg:text-base xl:text-lg font-medium text-blue-800 dark:text-blue-300">
                    Learning Path
                  </AlertTitle>
                  <AlertDescription className="text-xs lg:text-sm xl:text-base text-blue-700 dark:text-blue-400">
                    <p className="mb-2 lg:mb-3">Baserat på dina framsteg rekommenderar vi:</p>
                    <ul className="pl-5 list-disc space-y-1 lg:space-y-2">
                      {recommendations.slice(0, 3).map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Always show quiz for guests or when not daily quiz time */}
              {(!user || !showQuiz) && (
                <div className="mb-6 lg:mb-8 xl:mb-10">
                  <MemoryCheck onComplete={handleQuizComplete} difficulty={userLevel} />
                </div>
              )}

              {/* Desktop layout for Market Pulse and Flash Briefs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-10">
                {/* Market Pulse Section */}
                <div>
                  <MarketPulse />
                </div>

                {/* Flash Briefs Section */}
                <div>
                  <FlashBriefs />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
