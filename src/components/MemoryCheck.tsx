
import React, { useState, useEffect } from 'react';
import { 
  quizQuestions, 
  badges, 
  UserProgress, 
  defaultUserProgress, 
  userLevels, 
  getAdaptiveQuestions 
} from '../mockData/quizData';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, BookOpen, Award, ChevronRight, UserPlus, Zap, Target, TrendingUp, ToggleLeft, ToggleRight } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { useCompletedQuestions } from '@/hooks/useCompletedQuestions';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import DynamicMemoryCheck from './DynamicMemoryCheck';

interface MemoryCheckProps {
  onComplete: () => void;
  difficulty?: 'novice' | 'analyst' | 'pro';
}

const DAILY_QUIZ_LIMIT = 3;

const MemoryCheck: React.FC<MemoryCheckProps> = ({ 
  onComplete, 
  difficulty = 'novice' 
}) => {
  const { user } = useAuth();
  const { updateProgress, progress, refetch: refetchProgress } = useProgressTracking();
  const { completedQuestions, markQuestionCompleted } = useCompletedQuestions();
  const [isDynamicMode, setIsDynamicMode] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress>(defaultUserProgress);
  const [showLearningModule, setShowLearningModule] = useState(false);
  const [streakGained, setStreakGained] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState<typeof badges[0] | null>(null);
  const [activeTab, setActiveTab] = useState<string>("content");
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<boolean>(true);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  const [dailyQuestionsCompleted, setDailyQuestionsCompleted] = useState(0);
  
  // Check how many questions user has completed today
  useEffect(() => {
    if (user) {
      checkDailyQuizProgress();
    } else {
      checkLocalDailyProgress();
    }
  }, [user]);

  const checkDailyQuizProgress = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('user_completed_quizzes')
        .select('id')
        .eq('user_id', user.id)
        .gte('completed_at', `${today}T00:00:00.000Z`)
        .lt('completed_at', `${today}T23:59:59.999Z`);

      if (error) throw error;

      setDailyQuestionsCompleted(data?.length || 0);
    } catch (error) {
      console.error('Error checking daily quiz progress:', error);
    }
  };

  const checkLocalDailyProgress = () => {
    const savedProgress = localStorage.getItem('marketMentor_progress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setUserProgress(progress);
      
      const today = new Date().toISOString().split('T')[0];
      if (progress.lastQuizDate === today) {
        // Count today's completed quizzes from localStorage
        const todayQuizzes = progress.completedQuizzes?.filter((id: string) => {
          // For localStorage, we'll track by checking if it's in today's completed list
          return true; // Simplified - in localStorage we'll reset daily
        });
        setDailyQuestionsCompleted(Math.min(todayQuizzes?.length || 0, DAILY_QUIZ_LIMIT));
      } else {
        setDailyQuestionsCompleted(0);
      }
    }
  };

  // If dynamic mode is enabled and user is logged in, show the dynamic component
  if (isDynamicMode && user) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-finance-navy dark:text-gray-200">
            AI-Powered Quiz
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Static</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDynamicMode(!isDynamicMode)}
              className="p-1"
            >
              {isDynamicMode ? (
                <ToggleRight className="w-6 h-6 text-blue-600" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-gray-400" />
              )}
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">AI</span>
          </div>
        </div>
        <DynamicMemoryCheck 
          onComplete={onComplete} 
          difficulty={difficulty}
          userProgress={userProgress}
        />
      </div>
    );
  }

  // Check if user has reached daily limit
  if (dailyQuestionsCompleted >= DAILY_QUIZ_LIMIT) {
    return (
      <div className="card-finance p-5 text-center animate-fade-in dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-2 dark:text-white">Daily Limit Reached!</h3>
        <p className="text-sm mb-4 dark:text-gray-300">
          You've completed your {DAILY_QUIZ_LIMIT} daily questions. Come back tomorrow for more!
        </p>
        <div className="text-2xl mb-3">🎯</div>
        <Badge className="bg-green-500 text-white" variant="secondary">
          {dailyQuestionsCompleted}/{DAILY_QUIZ_LIMIT} Questions Complete
        </Badge>
      </div>
    );
  }
  
  // Set day of week for quiz theme
  const today = new Date();
  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
  
  // Find today's questions (or use difficulty filtered questions if none match)
  const matchingDayQuestions = quizQuestions.filter(q => 
    q.day === dayOfWeek as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'
  );
  
  // Filter by difficulty if no day-specific questions or if we want to ensure difficulty level
  const filteredQuestions = matchingDayQuestions.length > 0 
    ? matchingDayQuestions.filter(q => q.difficulty === difficulty)
    : quizQuestions.filter(q => q.difficulty === difficulty);
  
  // Use day-specific questions if available, otherwise fall back to difficulty-filtered
  let allAvailableQuestions = filteredQuestions.length > 0 ? filteredQuestions : matchingDayQuestions;
  
  // Filter out completed questions for logged-in users
  if (user && completedQuestions.length > 0) {
    allAvailableQuestions = allAvailableQuestions.filter(q => !completedQuestions.includes(q.id));
  }
  
  // If all questions are completed, reset and show all questions again
  if (allAvailableQuestions.length === 0) {
    allAvailableQuestions = filteredQuestions.length > 0 ? filteredQuestions : quizQuestions.filter(q => q.difficulty === difficulty);
  }
  
  // Apply adaptive question selection if enabled
  const availableQuestions = adaptiveDifficulty 
    ? getAdaptiveQuestions(userProgress, allAvailableQuestions)
    : allAvailableQuestions;

  // Limit to remaining questions for today - but ensure we always have at least 1 question
  const remainingQuestions = Math.max(1, DAILY_QUIZ_LIMIT - dailyQuestionsCompleted);
  const questions = availableQuestions.slice(0, remainingQuestions);
    
  const currentQuestion = questions[currentQuestionIndex];
  
  console.log('Quiz State Debug:', {
    currentQuestionIndex,
    totalQuestions: questions.length,
    totalQuestionsAnswered,
    dailyQuestionsCompleted,
    remainingQuestions,
    isCompleted
  });
  
  if (!currentQuestion) {
    return (
      <div className="card-finance p-5 text-center animate-fade-in dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-2 dark:text-white">No Questions Available</h3>
        <p className="text-sm mb-4 dark:text-gray-300">
          You've completed all available questions for your difficulty level. Great job!
        </p>
        <Button onClick={onComplete} className="bg-finance-lightBlue text-white">
          Continue Learning
        </Button>
      </div>
    );
  }
  
  const handleOptionSelect = async (optionIndex: number) => {
    if (isAnswered) return;
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    if (isCorrect) {
      setCorrectAnswers(correctAnswers + 1);
    }
    
    // Increment the total questions answered counter
    setTotalQuestionsAnswered(prev => prev + 1);
    
    // Update progress based on user login status
    if (user) {
      // Calculate quiz score (0-100 based on correctness)
      const quizScore = isCorrect ? 100 : 0;
      await updateProgress(quizScore, isCorrect);
      await markQuestionCompleted(currentQuestion.id);
      
      // Update category progress
      if (isCorrect) {
        const { data: categoryData } = await supabase
          .from('user_quiz_categories')
          .select('*')
          .eq('user_id', user.id)
          .eq('category', currentQuestion.category)
          .maybeSingle();

        if (categoryData) {
          await supabase
            .from('user_quiz_categories')
            .update({
              correct_answers: categoryData.correct_answers + 1,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('category', currentQuestion.category);
        } else {
          await supabase
            .from('user_quiz_categories')
            .insert({
              user_id: user.id,
              category: currentQuestion.category,
              correct_answers: 1
            });
        }
      }

      // Refresh progress data immediately
      await refetchProgress();

      // Check and award badges
      if (isCorrect) {
        const { data: categoryProgress } = await supabase
          .from('user_quiz_categories')
          .select('correct_answers')
          .eq('user_id', user.id)
          .eq('category', currentQuestion.category)
          .single();

        if (categoryProgress && categoryProgress.correct_answers >= 5) {
          const categoryBadgeMap = {
            'macro': 'macro_master',
            'stocks': 'tech_titan',
            'commodities': 'wildcard_wizard',
            'historical': 'history_buff',
            'concept': 'fundamental_fanatic'
          };

          const badgeId = categoryBadgeMap[currentQuestion.category as keyof typeof categoryBadgeMap];
          if (badgeId) {
            const { data: existingBadge } = await supabase
              .from('user_badges')
              .select('*')
              .eq('user_id', user.id)
              .eq('badge_id', badgeId)
              .maybeSingle();

            if (!existingBadge) {
              await supabase
                .from('user_badges')
                .insert({
                  user_id: user.id,
                  badge_id: badgeId
                });

              setEarnedBadge(badges.find(b => b.id === badgeId) || null);
            }
          }
        }
      }
    } else {
      updateUserProgressLocal(isCorrect);
    }
  };
  
  // LocalStorage-based progress update for non-logged users
  const updateUserProgressLocal = (isCorrect: boolean) => {
    const newProgress = { ...userProgress };
    
    const today = new Date().toISOString().split('T')[0];
    const lastQuizDate = newProgress.lastQuizDate;
    
    if (newProgress.totalQuizzesTaken === undefined) {
      newProgress.totalQuizzesTaken = 0;
    }
    
    newProgress.totalQuizzesTaken += 1;
    
    const totalCorrect = Object.values(newProgress.correctByCategory).reduce((sum, val) => sum + val, 0);
    newProgress.quizAccuracy = totalCorrect / newProgress.totalQuizzesTaken * 100;
    
    if (lastQuizDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastQuizDate === yesterdayStr) {
        newProgress.streakDays += 1;
        setStreakGained(true);
        
        if (!newProgress.longestStreak || newProgress.streakDays > newProgress.longestStreak) {
          newProgress.longestStreak = newProgress.streakDays;
        }
        
        if (newProgress.streakDays === 3 && !newProgress.badges.includes('streak_3')) {
          newProgress.badges.push('streak_3');
          setEarnedBadge(badges.find(b => b.id === 'streak_3') || null);
        } else if (newProgress.streakDays === 7 && !newProgress.badges.includes('streak_7')) {
          newProgress.badges.push('streak_7');
          setEarnedBadge(badges.find(b => b.id === 'streak_7') || null);
        }
      } else if (lastQuizDate !== today) {
        newProgress.streakDays = 1;
      }
    } else {
      newProgress.streakDays = 1;
      newProgress.badges.push('first_quiz');
      setEarnedBadge(badges.find(b => b.id === 'first_quiz') || null);
    }
    
    newProgress.lastQuizDate = today;
    
    if (isCorrect && currentQuestion) {
      newProgress.points += 10;
      
      const category = currentQuestion.category;
      if (!newProgress.correctByCategory[category]) {
        newProgress.correctByCategory[category] = 0;
      }
      newProgress.correctByCategory[category] += 1;
    }
    
    if (currentQuestion && !newProgress.completedQuizzes.includes(currentQuestion.id)) {
      newProgress.completedQuizzes.push(currentQuestion.id);
    }
    
    for (let i = userLevels.length - 1; i >= 0; i--) {
      if (newProgress.points >= userLevels[i].requiredPoints) {
        newProgress.level = userLevels[i].id;
        break;
      }
    }
    
    localStorage.setItem('marketMentor_progress', JSON.stringify(newProgress));
    setUserProgress(newProgress);
  };
  
  const handleNextQuestion = () => {
    console.log('handleNextQuestion called - Current state:', {
      currentQuestionIndex,
      totalQuestions: questions.length,
      totalQuestionsAnswered,
      dailyQuestionsCompleted
    });
    
    // Check if this is the last question in our quiz set
    const isLastQuestionInSet = currentQuestionIndex >= questions.length - 1;
    
    // Check if we've reached the daily limit after this question
    const willReachDailyLimit = (totalQuestionsAnswered) >= DAILY_QUIZ_LIMIT;
    
    console.log('Next question logic:', {
      isLastQuestionInSet,
      willReachDailyLimit,
      shouldComplete: isLastQuestionInSet || willReachDailyLimit
    });
    
    if (isLastQuestionInSet || willReachDailyLimit) {
      console.log('Completing quiz');
      
      // Update daily questions completed count
      setDailyQuestionsCompleted(prev => prev + 1);
      
      if (!user) {
        setShowRegistrationPrompt(true);
        return;
      }
      
      setIsCompleted(true);
      
      // Check for perfect score badge
      if (correctAnswers === totalQuestionsAnswered && user) {
        const checkPerfectScoreBadge = async () => {
          const { data: existingBadge } = await supabase
            .from('user_badges')
            .select('*')
            .eq('user_id', user.id)
            .eq('badge_id', 'perfect_score')
            .maybeSingle();

          if (!existingBadge) {
            await supabase
              .from('user_badges')
              .insert({
                user_id: user.id,
                badge_id: 'perfect_score'
              });
            setEarnedBadge(badges.find(b => b.id === 'perfect_score') || null);
          }
        };
        checkPerfectScoreBadge();
      }
      
      setTimeout(() => onComplete(), 3000);
    } else {
      console.log('Moving to next question');
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setEarnedBadge(null);
      setStreakGained(false);
    }
  };
  
  const getOptionClass = (index: number) => {
    if (!isAnswered) {
      return 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600';
    }
    
    if (index === currentQuestion.correctAnswer) {
      return 'border-finance-green bg-green-50 dark:bg-green-900 dark:bg-opacity-20 dark:border-green-700';
    }
    
    if (index === selectedOption && selectedOption !== currentQuestion.correctAnswer) {
      return 'border-finance-red bg-red-50 dark:bg-red-900 dark:bg-opacity-20 dark:border-red-700';
    }
    
    return 'border-gray-200 opacity-70 dark:border-gray-700 dark:opacity-50';
  };
  
  const trackLearningModuleView = async () => {
    if (!currentQuestion || !currentQuestion.learningModule || !user) return;
    
    const moduleId = `${currentQuestion.category}_${currentQuestion.id}`;
    
    try {
      await supabase
        .from('user_learning_modules')
        .upsert({
          user_id: user.id,
          module_id: moduleId
        });
    } catch (error) {
      console.error('Error tracking learning module view:', error);
    }
  };
  
  const openLearningModule = () => {
    if (currentQuestion.learningModule) {
      setShowLearningModule(true);
      if (user) {
        trackLearningModuleView();
      }
      setActiveTab("content");
    }
  };
  
  if (isCompleted) {
    return (
      <div className="card-finance p-5 text-center animate-fade-in dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-2 dark:text-white">Daily Quiz Completed!</h3>
        <p className="text-sm mb-4 dark:text-gray-300">
          You got <span className="font-semibold">{correctAnswers}</span> out of <span className="font-semibold">{totalQuestionsAnswered}</span> correct
        </p>
        <div className="text-2xl mb-3">🎯</div>
        <Badge className="bg-green-500 text-white mb-4" variant="secondary">
          {dailyQuestionsCompleted + 1}/{DAILY_QUIZ_LIMIT} Daily Questions Complete
        </Badge>
        
        {earnedBadge && (
          <div className="mt-2 mb-4">
            <div className="text-3xl mb-3 animate-scale-in">{earnedBadge.icon}</div>
            <Badge className="bg-green-500 text-white" variant="secondary">{earnedBadge.name}</Badge>
            <p className="text-xs text-gray-600 mt-2 dark:text-gray-400">{earnedBadge.description}</p>
          </div>
        )}
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Come back tomorrow for {DAILY_QUIZ_LIMIT} new questions!
        </p>
      </div>
    );
  }
  
  return (
    <div className="mb-8 animate-slide-up">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-finance-navy dark:text-gray-200">
          Memory Check: {currentQuestion.theme}
        </h2>
        <div className="flex items-center space-x-2">
          {user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Static</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDynamicMode(!isDynamicMode)}
                className="p-1"
              >
                {isDynamicMode ? (
                  <ToggleRight className="w-6 h-6 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                )}
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">AI</span>
            </div>
          )}
          <span className="badge-finance bg-amber-100 text-amber-800 dark:bg-amber-900 dark:bg-opacity-30 dark:text-amber-300">
            {dailyQuestionsCompleted + totalQuestionsAnswered + 1}/{DAILY_QUIZ_LIMIT} Today
          </span>
          <span className="badge-finance bg-finance-lightBlue bg-opacity-10 text-finance-lightBlue dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300">
            Question {currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
      </div>
      
      <div className="card-finance p-4 mb-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-finance-gray dark:text-gray-400">{currentQuestion.context}</span>
          {currentQuestion.category && (
            <Badge variant="outline" className="text-xs dark:text-gray-300">
              {currentQuestion.category.charAt(0).toUpperCase() + currentQuestion.category.slice(1)}
            </Badge>
          )}
        </div>
        
        <h3 className="text-base font-medium mb-4 dark:text-white">{currentQuestion.question}</h3>
        
        <div className="space-y-2 mb-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`w-full text-left p-3 border rounded-md transition-colors ${getOptionClass(index)} dark:text-gray-200`}
              onClick={() => handleOptionSelect(index)}
              disabled={isAnswered}
            >
              <div className="text-sm">{option}</div>
            </button>
          ))}
        </div>
        
        {isAnswered && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className={`text-sm ${selectedOption === currentQuestion.correctAnswer ? 'text-finance-green dark:text-green-400' : 'text-finance-red dark:text-red-400'} mb-3`}>
              {selectedOption === currentQuestion.correctAnswer ? 'Correct! 🎯' : 'Incorrect 🧐'}
            </div>
            <p className="text-xs text-finance-gray mb-4 dark:text-gray-400">{currentQuestion.explanation}</p>
            
            <div className="flex flex-col sm:flex-row sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2">
              {currentQuestion.learningModule && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={openLearningModule}
                  className="text-finance-blue dark:text-blue-400 dark:border-blue-900"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Learn More
                </Button>
              )}
              
              <Button 
                onClick={handleNextQuestion}
                className="w-full sm:w-auto bg-finance-lightBlue text-white hover:bg-finance-blue dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                {(currentQuestionIndex < questions.length - 1 && totalQuestionsAnswered < DAILY_QUIZ_LIMIT) ? 'Next Question' : 'Complete Quiz'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            {user && streakGained && (
              <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-medium">
                🔥 Streak increased!
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Registration Prompt Dialog for Non-logged users */}
      <AlertDialog open={showRegistrationPrompt} onOpenChange={setShowRegistrationPrompt}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-finance-navy dark:text-gray-200">
              <UserPlus className="w-5 h-5 mr-2 text-blue-500" />
              Create Account for Full Experience
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Great job! You answered <span className="font-semibold text-finance-navy dark:text-gray-200">{correctAnswers} out of {totalQuestionsAnswered}</span> questions correctly.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">With an account you get:</h4>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                  <li className="flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Personalized questions based on your level
                  </li>
                  <li className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Track your progress and statistics
                  </li>
                  <li className="flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Daily streaks and rewards
                  </li>
                  <li className="flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    Earn badges and levels
                  </li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => {
              setShowRegistrationPrompt(false);
              onComplete();
            }}>
              Continue without account
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link 
                to="/auth" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Create free account
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Learning Module Dialog */}
      <Dialog open={showLearningModule} onOpenChange={setShowLearningModule}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-finance-navy dark:text-gray-200">
              {currentQuestion.learningModule?.title}
            </DialogTitle>
            <DialogDescription>
              Micro-Learning Module
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="pt-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {currentQuestion.learningModule?.content}
              </p>
              
              {currentQuestion.learningModule?.videoUrl && (
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400 mt-4">
                  <span>Video content would load here</span>
                </div>
              )}
              
              {currentQuestion.relatedSymbols && currentQuestion.relatedSymbols.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2 dark:text-gray-300">Related Symbols:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentQuestion.relatedSymbols.map(symbol => (
                      <Badge key={symbol} variant="outline" className="dark:border-gray-600">
                        {symbol}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="resources" className="pt-4">
              {currentQuestion.learningModule?.resources && currentQuestion.learningModule.resources.length > 0 ? (
                <div className="space-y-3">
                  {currentQuestion.learningModule.resources.map((resource, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 border rounded-md flex items-center justify-between dark:border-gray-700"
                    >
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                        </Badge>
                        <p className="text-sm font-medium dark:text-gray-200">{resource.title}</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No additional resources available for this topic.</p>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <Award className="h-3 w-3 mr-1" />
                <span>+1 towards Knowledge Seeker badge</span>
              </div>
              <Button 
                onClick={() => setShowLearningModule(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemoryCheck;
