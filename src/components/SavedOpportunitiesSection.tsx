
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, DollarSign, Activity, BookmarkX } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

interface SavedOpportunity {
  id: string;
  type: 'stock_case' | 'analysis' | 'insight';
  title: string;
  description?: string;
  company_name?: string;
  target_price?: number;
  current_price?: number;
  sector?: string;
  created_at: string;
  performance_percentage?: number;
  ai_generated?: boolean;
}

interface SavedOpportunitiesSectionProps {
  opportunities: SavedOpportunity[];
  onRemove: (id: string) => void;
  onView: (opportunity: SavedOpportunity) => void;
  loading?: boolean;
}

const SavedOpportunitiesSection: React.FC<SavedOpportunitiesSectionProps> = ({
  opportunities = [],
  onRemove,
  onView,
  loading = false
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Sparade Möjligheter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (opportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Sparade Möjligheter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Inga sparade möjligheter än</p>
            <p className="text-sm text-gray-500">
              Spara intressanta stock cases och analyser för att följa deras utveckling
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stock_case':
        return <TrendingUp className="w-4 h-4" />;
      case 'analysis':
        return <Activity className="w-4 h-4" />;
      case 'insight':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'stock_case':
        return 'Stock Case';
      case 'analysis':
        return 'Analys';
      case 'insight':
        return 'Insikt';
      default:
        return 'Okänd';
    }
  };

  const getPerformanceColor = (percentage?: number) => {
    if (percentage === undefined) return 'text-gray-600';
    return percentage >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Sparade Möjligheter
          <Badge variant="secondary" className="ml-auto">
            {opportunities.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTypeIcon(item.type)}
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(item.type)}
                  </Badge>
                  {item.ai_generated && (
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                      AI
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(item.id)}
                  className="text-gray-500 hover:text-red-600"
                >
                  <BookmarkX className="w-4 h-4" />
                </Button>
              </div>

              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                {item.title}
              </h4>

              {item.company_name && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {item.company_name}
                </p>
              )}

              {item.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {item.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  {item.sector && (
                    <span>{item.sector}</span>
                  )}
                  {item.performance_percentage !== undefined && (
                    <span className={getPerformanceColor(item.performance_percentage)}>
                      {item.performance_percentage > 0 ? '+' : ''}{item.performance_percentage.toFixed(1)}%
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(item.created_at), { 
                        addSuffix: true, 
                        locale: sv 
                      })}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(item)}
                  className="text-xs"
                >
                  Visa
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SavedOpportunitiesSection;
