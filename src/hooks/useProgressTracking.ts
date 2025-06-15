
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
    try {
      setLoading(true);
      // Mock data for now - in a real app this would come from the database
      const mockProgress: ProgressData = {
        totalQuizzes: 25,
        completedQuizzes: 18,
        averageScore: 85,
        streak: 7,
        lastActivity: new Date().toISOString(),
      };
      setProgress(mockProgress);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (quizScore: number) => {
    if (!user) return;

    try {
      // Mock update - in a real app this would update the database
      setProgress(prev => ({
        ...prev,
        completedQuizzes: prev.completedQuizzes + 1,
        averageScore: Math.round((prev.averageScore * prev.completedQuizzes + quizScore) / (prev.completedQuizzes + 1)),
        streak: prev.streak + 1,
        lastActivity: new Date().toISOString(),
      }));
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
