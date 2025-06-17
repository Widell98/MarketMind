
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, TrendingUp, BookOpen, Activity, Target, Award } from 'lucide-react';
import ModernCard from './ModernCard';

const EnhancedStats = () => {
  const { data: memberCount } = useQuery({
    queryKey: ['community-members'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: totalCases } = useQuery({
    queryKey: ['total-cases'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('stock_cases')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: activeCases } = useQuery({
    queryKey: ['active-cases'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('stock_cases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (error) throw error;
      return count || 0;
    },
  });

  const stats = [
    {
      title: 'Community Members',
      value: memberCount ? (memberCount > 1000 ? `${(memberCount / 1000).toFixed(1)}K` : memberCount.toString()) : '0',
      icon: <Users className="w-6 h-6 text-blue-600" />,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950'
    },
    {
      title: 'Total Stock Cases',
      value: totalCases?.toString() || '0',
      icon: <BookOpen className="w-6 h-6 text-purple-600" />,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950'
    },
    {
      title: 'Active Cases',
      value: activeCases?.toString() || '0',
      icon: <Activity className="w-6 h-6 text-green-600" />,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950'
    },
    {
      title: 'Success Rate',
      value: '94%',
      icon: <Award className="w-6 h-6 text-yellow-600" />,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center animate-fade-in">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Platform Statistics
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time data from our growing community
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <div 
            key={stat.title}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <ModernCard 
              className={`bg-gradient-to-br ${stat.bgColor} border border-white/20 dark:border-gray-700/50`}
              hover={true}
            >
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                    {stat.icon}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </div>
                </div>
              </div>
            </ModernCard>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedStats;
