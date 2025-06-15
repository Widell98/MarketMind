
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, TrendingUp, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CommunityStats = () => {
  const { data: memberCount, isLoading } = useQuery({
    queryKey: ['community-members'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: activeCases } = useQuery({
    queryKey: ['active-cases-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('stock_cases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {isLoading ? '...' : activeCases || 156}
              </div>
              <p className="text-green-700 dark:text-green-300">Active Cases</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950 dark:to-cyan-900 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {isLoading ? '...' : memberCount || '2.5K'}
              </div>
              <p className="text-blue-700 dark:text-blue-300">Community Members</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-900 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">78%</div>
              <p className="text-purple-700 dark:text-purple-300">Success Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityStats;
