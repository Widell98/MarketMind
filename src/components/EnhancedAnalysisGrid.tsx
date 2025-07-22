
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Eye, Heart, BookOpen, Sparkles, TrendingUp } from 'lucide-react';
import { Analysis } from '@/types/analysis';
import { useNavigate } from 'react-router-dom';

interface EnhancedAnalysisGridProps {
  analyses: Analysis[];
  title: string;
  subtitle?: string;
  showAIBadge?: boolean;
  className?: string;
}

const EnhancedAnalysisGrid: React.FC<EnhancedAnalysisGridProps> = ({
  analyses,
  title,
  subtitle,
  showAIBadge = false,
  className = ''
}) => {
  const navigate = useNavigate();

  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'market_insight':
        return <Eye className="w-4 h-4" />;
      case 'technical_analysis':
        return <TrendingUp className="w-4 h-4" />;
      case 'fundamental_analysis':
        return <BookOpen className="w-4 h-4" />;
      case 'sector_analysis':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getAnalysisTypeColor = (type: string) => {
    switch (type) {
      case 'market_insight':
        return 'bg-blue-500';
      case 'technical_analysis':
        return 'bg-green-500';
      case 'fundamental_analysis':
        return 'bg-purple-500';
      case 'sector_analysis':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPlaceholderImage = (type: string) => {
    switch (type) {
      case 'market_insight':
        return 'photo-1461749280684-dccba630e2f6';
      case 'technical_analysis':
        return 'photo-1487058792275-0ad4aaf24ca7';
      case 'fundamental_analysis':
        return 'photo-1485827404703-89b55fcc595e';
      case 'sector_analysis':
        return 'photo-1497604401993-f2e922e5cb0a';
      default:
        return 'photo-1526374965328-7f61d4dc18c5';
    }
  };

  const handleViewAnalysis = (analysis: Analysis) => {
    navigate(`/analysis/${analysis.id}`);
  };

  const handleDiscussWithAI = (analysis: Analysis, e: React.MouseEvent) => {
    e.stopPropagation();
    const contextData = {
      type: 'analysis' as const,
      id: analysis.id,
      title: analysis.title,
      data: analysis
    };
    navigate('/ai-chat', { state: { contextData } });
  };

  if (!analyses || analyses.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyses.map((analysis) => (
          <Card 
            key={analysis.id}
            className="overflow-hidden group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
            onClick={() => handleViewAnalysis(analysis)}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={`https://images.unsplash.com/${getPlaceholderImage(analysis.analysis_type)}?auto=format&fit=crop&w=600&q=80`}
                alt={analysis.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                {showAIBadge && analysis.ai_generated && (
                  <Badge className="bg-purple-600 text-white flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI
                  </Badge>
                )}
                <Badge className={`${getAnalysisTypeColor(analysis.analysis_type)} text-white flex items-center gap-1`}>
                  {getAnalysisTypeIcon(analysis.analysis_type)}
                  {analysis.analysis_type.replace('_', ' ')}
                </Badge>
              </div>

              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold text-lg line-clamp-2 group-hover:text-blue-300 transition-colors">
                  {analysis.title}
                </h3>
              </div>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Author and Date */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                {analysis.profiles && (
                  <span>av {analysis.profiles.display_name || analysis.profiles.username}</span>
                )}
                <span>
                  {new Date(analysis.created_at).toLocaleDateString('sv-SE', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {/* Content Preview */}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {analysis.content.substring(0, 100)}...
              </p>

              {/* Stats and Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{analysis.likes_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{analysis.views_count || 0}</span>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => handleDiscussWithAI(analysis, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1"
                >
                  <MessageCircle className="w-4 h-4" />
                  Diskutera
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EnhancedAnalysisGrid;
