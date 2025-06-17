
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useCompletedQuestions = () => {
  const [completedQuestions, setCompletedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCompletedQuestions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCompletedQuestions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_completed_quizzes')
        .select('quiz_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const questionIds = data?.map(item => item.quiz_id) || [];
      setCompletedQuestions(questionIds);
    } catch (error) {
      console.error('Error fetching completed questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const markQuestionCompleted = async (questionId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('user_completed_quizzes')
        .upsert({
          user_id: user.id,
          quiz_id: questionId
        });

      setCompletedQuestions(prev => [...prev, questionId]);
    } catch (error) {
      console.error('Error marking question as completed:', error);
    }
  };

  return {
    completedQuestions,
    loading,
    markQuestionCompleted,
    refetch: fetchCompletedQuestions
  };
};
