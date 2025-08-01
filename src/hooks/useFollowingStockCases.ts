import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useFollowingStockCases = () => {
  const [followingStockCases, setFollowingStockCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchFollowingStockCases = async () => {
    if (!user) {
      setFollowingStockCases([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // First, get all users that the current user follows
      const { data: follows, error: followsError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followsError) throw followsError;

      if (!follows || follows.length === 0) {
        setFollowingStockCases([]);
        setLoading(false);
        return;
      }

      // Extract the user IDs being followed
      const followingUserIds = follows.map(follow => follow.following_id);

      // Get stock cases from followed users
      const { data: stockCases, error: stockCasesError } = await supabase
        .from('stock_cases')
        .select('*')
        .in('user_id', followingUserIds)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (stockCasesError) throw stockCasesError;

      // Get profile information for each user
      const userIds = [...new Set(stockCases?.map(sc => sc.user_id) || [])];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Could not fetch profiles:', profilesError);
      }

      // Combine stock cases with profile data
      const stockCasesWithProfiles = (stockCases || []).map(stockCase => ({
        ...stockCase,
        profile: profiles?.find(p => p.id === stockCase.user_id) || null
      }));

      setFollowingStockCases(stockCasesWithProfiles);
    } catch (error: any) {
      console.error('Error fetching following stock cases:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda aktiefall från följda användare",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowingStockCases();
  }, [user]);

  return {
    followingStockCases,
    loading,
    refetch: fetchFollowingStockCases,
  };
};