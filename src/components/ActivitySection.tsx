
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { normalizeStockCaseTitle } from '@/utils/stockCaseText';
import { 
  Activity, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  TrendingUp,
  Users,
  Clock,
  Calendar
} from 'lucide-react';

const ActivitySection = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  // Fetch user activity data
  const { data: activityData, isLoading } = useQuery({
    queryKey: ['user-activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const [analysesResult, stockCasesResult, commentsResult, usageResult] = await Promise.all([
        supabase
          .from('analyses')
          .select('id, title, created_at, views_count, likes_count')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        
        supabase
          .from('stock_cases')
          .select('id, title, company_name, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        
        supabase
          .from('analysis_comments')
          .select('id, created_at, analysis_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        
        supabase
          .from('user_ai_usage')
          .select('*')
          .eq('user_id', user.id)
          .order('usage_date', { ascending: false })
          .limit(7)
      ]);

      const recentStockCases = (stockCasesResult.data || []).map((stockCase) => ({
        ...stockCase,
        title: normalizeStockCaseTitle(stockCase.title, stockCase.company_name),
      }));

      return {
        recentAnalyses: analysesResult.data || [],
        recentStockCases,
        recentComments: commentsResult.data || [],
        aiUsage: usageResult.data || []
      };
    },
    enabled: !!user?.id,
  });

  // Calculate AI usage statistics
  const totalAiMessages = activityData?.aiUsage.reduce((sum, day) => sum + (day.ai_messages_count || 0), 0) || 0;
  const totalAnalyses = activityData?.aiUsage.reduce((sum, day) => sum + (day.analysis_count || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Activity Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="rounded-lg sm:rounded-xl">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Analyser</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{activityData?.recentAnalyses.length || 0}</p>
              </div>
              <FileText className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg sm:rounded-xl">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Aktiecases</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{activityData?.recentStockCases.length || 0}</p>
              </div>
              <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg sm:rounded-xl">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">AI-meddelanden</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{totalAiMessages}</p>
              </div>
              <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-purple-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg sm:rounded-xl">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Kommentarer</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{activityData?.recentComments.length || 0}</p>
              </div>
              <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-orange-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Recent Analyses */}
        <Card className="rounded-lg sm:rounded-xl">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="break-words">Senaste analyser</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            {activityData?.recentAnalyses.length ? (
              <div className="space-y-2 sm:space-y-3">
                {activityData.recentAnalyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-start justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{analysis.title}</p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] xs:text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                          {new Date(analysis.created_at).toLocaleDateString('sv-SE')}
                        </span>
                        <span>{analysis.views_count} visningar</span>
                        <span>{analysis.likes_count} gillningar</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-3 sm:py-4">
                Inga analyser skapade än
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Stock Cases */}
        <Card className="rounded-lg sm:rounded-xl">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="break-words">Senaste aktiecases</span>
              {isAdmin && (
                <Badge variant="outline" className="text-[10px] xs:text-xs">
                  Admin
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            {activityData?.recentStockCases.length ? (
              <div className="space-y-2 sm:space-y-3">
                {activityData.recentStockCases.map((stockCase) => (
                  <div key={stockCase.id} className="flex items-start justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{stockCase.title}</p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] xs:text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                          {new Date(stockCase.created_at).toLocaleDateString('sv-SE')}
                        </span>
                        <Badge variant="outline" className="text-[10px] xs:text-xs">
                          {stockCase.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground text-center py-3 sm:py-4">
                {isAdmin ? 'Inga aktiecases skapade än' : 'Du kan inte skapa aktiecases'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Usage Chart */}
      {activityData?.aiUsage.length > 0 && (
        <Card className="rounded-lg sm:rounded-xl">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="break-words">AI-användning senaste veckan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="space-y-3 sm:space-y-4">
              {activityData.aiUsage.map((day) => (
                <div key={day.usage_date} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">
                      {new Date(day.usage_date).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <span>{day.ai_messages_count || 0} meddelanden</span>
                    <span>{day.analysis_count || 0} analyser</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActivitySection;
