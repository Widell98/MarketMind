import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  BookOpen,
  Eye,
  Plus,
  User,
  UserPlus,
  UserMinus,
  Calendar
} from 'lucide-react';
import AddAnalysisToHoldingDialog from './AddAnalysisToHoldingDialog';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useUserFollows } from '@/hooks/useUserFollows';

interface EnhancedAnalysisCardProps {
  analysis: any;
  onViewDetails: (id: string) => void;
  onDelete?: (id: string) => void;
  showProfileActions?: boolean;
}

const EnhancedAnalysisCard: React.FC<EnhancedAnalysisCardProps> = ({
  analysis,
  onViewDetails,
  onDelete,
  showProfileActions = true
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { followUser, unfollowUser, isFollowing } = useUserFollows();

  const getAnalysisTypeLabel = (type: string) => {
    const labels = {
      'market_insight': 'Marknadsinsikt',
      'technical_analysis': 'Teknisk analys', 
      'fundamental_analysis': 'Fundamental analys',
      'sector_analysis': 'Sektoranalys',
      'portfolio_analysis': 'Portföljanalys',
      'position_analysis': 'Positionsanalys',
      'sector_deep_dive': 'Sektordjupdykning'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAnalysisTypeColor = (type: string) => {
    const colors = {
      'market_insight': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'technical_analysis': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'fundamental_analysis': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'sector_analysis': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      'portfolio_analysis': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      'position_analysis': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      'sector_deep_dive': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleDiscussWithAI = (analysis: any) => {
    const contextData = {
      type: 'analysis',
      id: analysis.id,
      title: analysis.title,
      data: analysis
    };
    navigate('/ai-chat', { state: { contextData } });
  };

  const handleFollow = async () => {
    if (!user || !analysis.user_id) return;
    
    if (isFollowing(analysis.user_id)) {
      await unfollowUser(analysis.user_id);
    } else {
      await followUser(analysis.user_id);
    }
  };

  const authorName = analysis.profiles?.display_name || analysis.profiles?.username || 'Okänd användare';
  const authorUsername = analysis.profiles?.username || 'unknown';
  const isOwnAnalysis = user?.id === analysis.user_id;
  const userIsFollowing = isFollowing(analysis.user_id);

  return (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Avatar with Profile Hover Card */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <Avatar 
                className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => handleUserClick(analysis.user_id)}
              >
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                  {authorName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="flex justify-between space-x-4">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    {authorName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-semibold">{authorName}</h4>
                  <p className="text-sm text-muted-foreground">@{authorUsername}</p>
                  <div className="flex items-center pt-2">
                    <Calendar className="mr-2 h-4 w-4 opacity-70" />
                    <span className="text-xs text-muted-foreground">
                      Medlem sedan {formatDistanceToNow(new Date(analysis.profiles?.created_at || analysis.created_at), { locale: sv })}
                    </span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header with Follow Button */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUserClick(analysis.user_id)}
                  className="font-semibold text-sm hover:underline"
                >
                  {authorName}
                </button>
                <span className="text-muted-foreground text-sm">@{authorUsername}</span>
                <span className="text-muted-foreground text-sm">·</span>
                <span className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: sv })}
                </span>
              </div>
              
              {/* Follow Button */}
              {showProfileActions && user && !isOwnAnalysis && (
                <Button
                  variant={userIsFollowing ? "secondary" : "outline"}
                  size="sm"
                  onClick={handleFollow}
                  className="ml-2"
                >
                  {userIsFollowing ? (
                    <>
                      <UserMinus className="w-3 h-3 mr-1" />
                      Sluta följa
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3 mr-1" />
                      Följ
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Analysis Type Badge */}
            <div className="mb-3">
              <Badge variant="outline" className={`text-xs ${getAnalysisTypeColor(analysis.analysis_type)}`}>
                <BookOpen className="w-3 h-3 mr-1" />
                {getAnalysisTypeLabel(analysis.analysis_type)}
              </Badge>
            </div>

            {/* Title and Content */}
            <div onClick={() => onViewDetails(analysis.id)} className="cursor-pointer">
              <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
                {analysis.title}
              </h3>
              <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                {analysis.content.substring(0, 200)}
                {analysis.content.length > 200 && '...'}
              </p>
            </div>

            {/* Tags */}
            {analysis.tags && analysis.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {analysis.tags.slice(0, 3).map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Engagement Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center space-x-6">
                <button className="flex items-center space-x-2 text-muted-foreground hover:text-red-500 transition-colors group">
                  <Heart className="w-4 h-4 group-hover:fill-current" />
                  <span className="text-sm">{analysis.likes_count || 0}</span>
                </button>
                
                <button 
                  onClick={() => onViewDetails(analysis.id)}
                  className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{analysis.comments_count || 0}</span>
                </button>

                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">{analysis.views_count || 0}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <AddAnalysisToHoldingDialog analysis={analysis}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Lägg till
                  </Button>
                </AddAnalysisToHoldingDialog>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDiscussWithAI(analysis)}
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Diskutera med AI
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(analysis.id)}
                >
                  Läs mer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedAnalysisCard;