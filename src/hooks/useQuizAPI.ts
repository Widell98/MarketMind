
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion } from '@/mockData/quizData';

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
      console.log('Calling generate-quiz-questions function...');
      
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

      console.log('Generated questions:', data.questions);
      return data.questions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate questions';
      setError(errorMessage);
      console.error('Error generating questions:', err);
      
      // Return fallback questions on error
      return getFallbackQuestions(userLevel, category);
    } finally {
      setLoading(false);
    }
  }, []);

  return { generateQuestions, loading, error };
};

function getFallbackQuestions(userLevel: string, category?: string): APIQuizQuestion[] {
  return [
    {
      id: 'fallback_market_1',
      theme: 'Market Basics',
      question: 'What is a stock market index?',
      context: 'Understanding market indices is fundamental to investing.',
      options: [
        'A measure of a section of the stock market',
        'A single company stock price',
        'The total value of all stocks',
        'A government bond rating'
      ],
      correctAnswer: 0,
      explanation: 'A stock market index measures the performance of a section of the stock market, like the S&P 500 which tracks 500 large US companies.',
      difficulty: userLevel as 'novice' | 'analyst' | 'pro',
      category: (category as any) || 'concept',
      isGenerated: true
    },
    {
      id: 'fallback_market_2',
      theme: 'Investment Principles',
      question: 'What does diversification mean in investing?',
      context: 'Diversification is a key risk management strategy.',
      options: [
        'Buying only one type of investment',
        'Spreading investments across different assets',
        'Investing only in your home country',
        'Buying stocks at different times'
      ],
      correctAnswer: 1,
      explanation: 'Diversification means spreading investments across different assets, sectors, or geographies to reduce risk.',
      difficulty: userLevel as 'novice' | 'analyst' | 'pro',
      category: (category as any) || 'concept',
      isGenerated: true
    }
  ];
}
