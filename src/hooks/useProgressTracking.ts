
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProgressData {
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  streak: number;
  lastActivity: string | null;
}

export const useProgressTracking = () => {
  const [progress, setProgress] = useState<ProgressData>({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    streak: 0,
    lastActivity: null,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProgress();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProgress = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch user's quiz progress
      const { data: progressData } = await supabase
        .from('user_quiz_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // If no progress exists, create initial record
      if (!progressData) {
        const { data: newProgress } = await supabase
          .from('user_quiz_progress')
          .insert({
            user_id: user.id,
            total_quizzes_taken: 0,
            correct_answers: 0,
            current_streak: 0,
            longest_streak: 0,
            points: 0,
            level: 'novice'
          })
          .select()
          .single();

        if (newProgress) {
          setProgress({
            totalQuizzes: newProgress.total_quizzes_taken,
            completedQuizzes: newProgress.total_quizzes_taken,
            averageScore: newProgress.total_quizzes_taken > 0 ? (newProgress.correct_answers / newProgress.total_quizzes_taken) * 100 : 0,
            streak: newProgress.current_streak,
            lastActivity: newProgress.last_quiz_date,
          });
        }
      } else {
        setProgress({
          totalQuizzes: progressData.total_quizzes_taken,
          completedQuizzes: progressData.total_quizzes_taken,
          averageScore: progressData.total_quizzes_taken > 0 ? (progressData.correct_answers / progressData.total_quizzes_taken) * 100 : 0,
          streak: progressData.current_streak,
          lastActivity: progressData.last_quiz_date,
        });
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (quizScore: number, isCorrect: boolean) => {
    if (!user) return;

    try {
      // Get current progress
      const { data: currentProgress } = await supabase
        .from('user_quiz_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!currentProgress) return;

      const today = new Date().toISOString().split('T')[0];
      const lastQuizDate = currentProgress.last_quiz_date;
      
      let newStreak = currentProgress.current_streak;
      
      // Calculate streak
      if (lastQuizDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastQuizDate === yesterdayStr) {
          newStreak += 1;
        } else if (lastQuizDate !== today) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const newTotalQuizzes = currentProgress.total_quizzes_taken + 1;
      const newCorrectAnswers = currentProgress.correct_answers + (isCorrect ? 1 : 0);
      const newLongestStreak = Math.max(currentProgress.longest_streak, newStreak);

      // Update progress in database
      const { data: updatedProgress } = await supabase
        .from('user_quiz_progress')
        .update({
          total_quizzes_taken: newTotalQuizzes,
          correct_answers: newCorrectAnswers,
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          last_quiz_date: today,
          points: currentProgress.points + (isCorrect ? 10 : 0),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updatedProgress) {
        setProgress({
          totalQuizzes: updatedProgress.total_quizzes_taken,
          completedQuizzes: updatedProgress.total_quizzes_taken,
          averageScore: (updatedProgress.correct_answers / updatedProgress.total_quizzes_taken) * 100,
          streak: updatedProgress.current_streak,
          lastActivity: updatedProgress.last_quiz_date,
        });
      }

    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  return {
    progress,
    loading,
    updateProgress,
    refetch: fetchProgress,
  };
};
