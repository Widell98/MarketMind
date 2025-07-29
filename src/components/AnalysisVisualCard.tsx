
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Eye, Heart, BookOpen, Sparkles, Plus } from 'lucide-react';
import { Analysis } from '@/types/analysis';
import { useNavigate } from 'react-router-dom';
import AddAnalysisToHoldingDialog from './AddAnalysisToHoldingDialog';

interface AnalysisVisualCardProps {
  analysis: Analysis;
  onDiscussWithAI?: (analysis: Analysis) => void;
  size?: 'large' | 'medium';
}

const AnalysisVisualCard: React.FC<AnalysisVisualCardProps> = ({
  analysis,
  onDiscussWithAI,
  size = 'large'
}) => {
  const navigate = useNavigate();

  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'market_insight':
        return <Eye className="w-4 h-4" />;
      case 'technical_analysis':
        return <BookOpen className="w-4 h-4" />;
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
        return 'photo-1461749280684-dccba630e2f6'; // Java programming monitor
      case 'technical_analysis':
        return 'photo-1487058792275-0ad4aaf24ca7'; // Colorful code on monitor
      case 'fundamental_analysis':
        return 'photo-1485827404703-89b55fcc595e'; // White robot
      case 'sector_analysis':
        return 'photo-1497604401993-f2e922e5cb0a'; // Glass building
      default:
        return 'photo-1526374965328-7f61d4dc18c5'; // Matrix style
    }
  };

  const handleViewAnalysis = () => {
    navigate(`/analysis/${analysis.id}`);
  };

  const handleDiscussClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDiscussWithAI) {
      onDiscussWithAI(analysis);
    }
  };

  const cardHeight = size === 'large' ? 'h-80' : 'h-64';
  const imageHeight = size === 'large' ? 'h-48' : 'h-40';

  return (
    <Card 
      className={`${cardHeight} overflow-hidden group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
      onClick={handleViewAnalysis}
    >
      <div className="relative h-full">
        {/* Background Image */}
        <div className={`${imageHeight} relative overflow-hidden`}>
          <img
            src={`https://images.unsplash.com/${getPlaceholderImage(analysis.analysis_type)}?auto=format&fit=crop&w=800&q=80`}
            alt={analysis.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          {/* AI Badge */}
          {analysis.ai_generated && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-purple-600 text-white flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI
              </Badge>
            </div>
          )}

          {/* Analysis Type Badge */}
          <div className="absolute top-3 right-3">
            <Badge className={`${getAnalysisTypeColor(analysis.analysis_type)} text-white flex items-center gap-1`}>
              {getAnalysisTypeIcon(analysis.analysis_type)}
              {analysis.analysis_type.replace('_', ' ')}
            </Badge>
          </div>

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
              {analysis.title}
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                {analysis.profiles && (
                  <span className="opacity-90">
                    av {analysis.profiles.display_name || analysis.profiles.username}
                  </span>
                )}
                <div className="flex items-center gap-3 opacity-75">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{analysis.likes_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{analysis.views_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <CardContent className="p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {new Date(analysis.created_at).toLocaleDateString('sv-SE', {
                month: 'short',
                day: 'numeric'
              })}
            </div>
            
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <AddAnalysisToHoldingDialog analysis={analysis}>
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                </Button>
              </AddAnalysisToHoldingDialog>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleDiscussClick}
                className="flex items-center gap-1"
              >
                <MessageCircle className="w-4 h-4" />
                Diskutera
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default AnalysisVisualCard;
