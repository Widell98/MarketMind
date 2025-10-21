
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion, getTimelessFallbackQuestions } from '@/mockData/quizData';

export interface APIQuizQuestion extends Omit<QuizQuestion, 'day'> {
  isGenerated?: boolean;
}

interface UseQuizAPIReturn {
  generateQuestions: (userLevel: string, userProgress: any, category?: string) => Promise<APIQuizQuestion[]>;
  loading: boolean;
  error: string | null;
}

export const useQuizAPI = (): UseQuizAPIReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuestions = useCallback(async (
    userLevel: string, 
    userProgress: any, 
    category?: string
  ): Promise<APIQuizQuestion[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-quiz-questions', {
        body: {
          userLevel,
          userProgress,
          requestedCategory: category
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data?.questions) {
        throw new Error('No questions received from API');
      }

      return data.questions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate questions';
      setError(errorMessage);
      console.error('Error generating questions:', err);
      
      // Return timeless fallback questions on error
      return getTimelessFallbackQuestions(userLevel, category);
    } finally {
      setLoading(false);
    }
  }, []);

  return { generateQuestions, loading, error };
};
