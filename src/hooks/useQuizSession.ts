
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { useCompletedQuestions } from '@/hooks/useCompletedQuestions';
import { supabase } from '@/integrations/supabase/client';
import { badges, UserProgress, defaultUserProgress, userLevels } from '@/mockData/quizData';
import { DAILY_QUIZ_QUESTIONS } from '@/utils/quizUtils';

export const useQuizSession = () => {
  const { user } = useAuth();
  const { updateProgress, progress, refetch: refetchProgress } = useProgressTracking();
  const { completedQuestions, markQuestionCompleted } = useCompletedQuestions();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress>(defaultUserProgress);
  const [streakGained, setStreakGained] = useState(false);
  const [earnedBadge, setEarnedBadge] = useState<typeof badges[0] | null>(null);
  const [dailyQuizCompleted, setDailyQuizCompleted] = useState(false);

  const checkDailyQuizCompletion = async () => {
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

      setDailyQuizCompleted((data?.length || 0) >= DAILY_QUIZ_QUESTIONS);
    } catch (error) {
      console.error('Error checking daily quiz completion:', error);
    }
  };

  const checkLocalDailyCompletion = () => {
    const today = new Date().toISOString().split('T')[0];
    const savedCompletion = localStorage.getItem(`marketMentor_dailyQuiz_${today}`);
    setDailyQuizCompleted(savedCompletion === 'completed');
  };

  const updateUserProgressLocal = (isCorrect: boolean, currentQuestion: any) => {
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

  const handleOptionSelect = async (optionIndex: number, currentQuestion: any, questions: any[]) => {
    if (isAnswered) return;
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    
    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    if (isCorrect) {
      setCorrectAnswers(correctAnswers + 1);
    }
    
    if (user) {
      const quizScore = isCorrect ? 100 : 0;
      await updateProgress(quizScore, isCorrect);
      await markQuestionCompleted(currentQuestion.id);
      
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

      await refetchProgress();

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
      updateUserProgressLocal(isCorrect, currentQuestion);
    }
  };

  const handleNextQuestion = (questions: any[], onComplete: () => void, showRegistrationPrompt: () => void) => {
    const isLastQuestion = currentQuestionIndex >= questions.length - 1;
    
    if (isLastQuestion) {
      if (user) {
        setDailyQuizCompleted(true);
      } else {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`marketMentor_dailyQuiz_${today}`, 'completed');
        showRegistrationPrompt();
        return;
      }
      
      setIsCompleted(true);
      
      if (correctAnswers === DAILY_QUIZ_QUESTIONS && user) {
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
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setEarnedBadge(null);
      setStreakGained(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkDailyQuizCompletion();
    } else {
      checkLocalDailyCompletion();
    }
  }, [user]);

  return {
    currentQuestionIndex,
    selectedOption,
    isAnswered,
    correctAnswers,
    isCompleted,
    userProgress,
    streakGained,
    earnedBadge,
    dailyQuizCompleted,
    completedQuestions,
    handleOptionSelect,
    handleNextQuestion,
    setEarnedBadge,
    setStreakGained
  };
};
