
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, TrendingUp, FileText, Calendar, Eye, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStockCases } from '@/hooks/useStockCases';
import { useAnalyses } from '@/hooks/useAnalyses';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface UserProfileSidebarProps {
  userId?: string;
  userProfile?: {
    username: string;
    display_name: string | null;
  } | null;
}

const UserProfileSidebar = ({ userId, userProfile }: UserProfileSidebarProps) => {
  const navigate = useNavigate();
  const { stockCases } = useStockCases(false);
  const { data: analyses } = useAnalyses(20);

  // Filter user's stock cases and analyses
  const userStockCases = stockCases.filter(sc => sc.user_id === userId).slice(0, 3);
  const userAnalyses = analyses?.filter(analysis => analysis.user_id === userId).slice(0, 3) || [];

  if (!userId || !userProfile) {
    return null;
  }

  const userInitials = userProfile.display_name?.slice(0, 2).toUpperCase() || 
                      userProfile.username?.slice(0, 2).toUpperCase() || 'U';

  const getStatusBadge = (status: string, performance: number | null) => {
    if (status === 'winner') {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
          Winner {performance ? `+${performance}%` : ''}
        </Badge>
      );
    }
    if (status === 'loser') {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs">
          Loser {performance ? `${performance}%` : ''}
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
        Active
      </Badge>
    );
  };

  const getAnalysisTypeBadge = (type: string) => {
    const colors = {
      'market_insight': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'technical_analysis': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'fundamental_analysis': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'sector_analysis': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    };
    
    const colorClass = colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    
    return (
      <Badge className={`${colorClass} text-xs`}>
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" alt="Profile" />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {userProfile.display_name || userProfile.username}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                @{userProfile.username}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  <User className="w-3 h-3 mr-1" />
                  Analyst
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {userStockCases.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Cases</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {userAnalyses.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Analyser</div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => navigate(`/profile/${userId}`)}
          >
            View Full Profile
          </Button>
        </CardContent>
      </Card>

      {/* Recent Stock Cases */}
      {userStockCases.length > 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
              Tidigare Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userStockCases.map((stockCase) => (
                <div 
                  key={stockCase.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => navigate(`/stock-cases/${stockCase.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                      {stockCase.title}
                    </h4>
                    {getStatusBadge(stockCase.status, stockCase.performance_percentage)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {stockCase.company_name}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {formatDistanceToNow(new Date(stockCase.created_at), { addSuffix: true, locale: sv })}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>0</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>0</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {userStockCases.length >= 3 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-3 text-blue-600 hover:text-blue-700"
                onClick={() => navigate('/stock-cases')}
              >
                Se fler cases
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Analyses */}
      {userAnalyses.length > 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <FileText className="w-4 h-4 mr-2 text-purple-600" />
              Senaste Analyser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userAnalyses.map((analysis) => (
                <div 
                  key={analysis.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                      {analysis.title}
                    </h4>
                    {getAnalysisTypeBadge(analysis.analysis_type)}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {analysis.content.substring(0, 80)}...
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: sv })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{analysis.views_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>{analysis.likes_count}</span>
                      </div>
                    </div>
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

export default UserProfileSidebar;
