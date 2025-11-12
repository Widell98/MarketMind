import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeStockCaseTitle } from '@/utils/stockCaseText';
import { getSupabaseOfflineMessage, isSupabaseFetchError } from '@/utils/supabaseError';

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

      if (followsError) {
        if (isSupabaseFetchError(followsError)) {
          console.warn('Network error fetching followed users for stock cases:', followsError);
          setFollowingStockCases([]);
          return;
        }

        throw followsError;
      }

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

      if (stockCasesError) {
        if (isSupabaseFetchError(stockCasesError)) {
          console.warn('Network error fetching stock cases from followed users:', stockCasesError);
          setFollowingStockCases([]);
          return;
        }

        throw stockCasesError;
      }

      // Get profile information for the users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', followingUserIds);

      if (profilesError) {
        if (isSupabaseFetchError(profilesError)) {
          console.warn('Network error fetching profiles for followed stock cases:', profilesError);
        } else {
          throw profilesError;
        }
      }

      // Merge stock cases with profile information
      const stockCasesWithProfiles = (stockCases || []).map(stockCase => ({
        ...stockCase,
        title: normalizeStockCaseTitle(stockCase.title, stockCase.company_name),
        profiles: profiles?.find(profile => profile.id === stockCase.user_id) || null
      }));

      setFollowingStockCases(stockCasesWithProfiles);
    } catch (error: any) {
      console.error('Error fetching following stock cases:', error);
      toast({
        title: "Fel",
        description: isSupabaseFetchError(error)
          ? getSupabaseOfflineMessage()
          : "Kunde inte ladda aktiefall från följda användare",
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