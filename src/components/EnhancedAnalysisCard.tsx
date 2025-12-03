import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { 
  Heart, 
  MessageCircle, 
  BookOpen,
  Eye,
  UserPlus,
  UserMinus,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useUserFollows } from '@/hooks/useUserFollows';
import { useAnalysisLikes } from '@/hooks/useAnalysisLikes';

interface EnhancedAnalysisCardProps {
  analysis: any;
  onViewDetails: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (analysis: any) => void;
  showProfileActions?: boolean;
}

const EnhancedAnalysisCard: React.FC<EnhancedAnalysisCardProps> = ({
  analysis,
  onViewDetails,
  onDelete,
  onEdit,
  showProfileActions = true
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { followUser, unfollowUser, isFollowing } = useUserFollows();
  const { likeCount, isLiked, toggleLike } = useAnalysisLikes(analysis.id);

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
    navigate('/ai-chatt', { state: { contextData } });
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
    <Card
      className="hover:shadow-md transition-all duration-200 cursor-pointer border-0 shadow-sm"
      onClick={() => onViewDetails(analysis.id)}
      role="button"
      tabIndex={0}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Avatar with Profile Hover Card */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <Avatar
                className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUserClick(analysis.user_id);
                }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserClick(analysis.user_id);
                  }}
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
              
              <div className="flex items-center gap-2">
                {/* Follow Button */}
                {showProfileActions && user && !isOwnAnalysis && (
                  <Button
                    variant={userIsFollowing ? "secondary" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollow();
                    }}
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

                {/* Edit/Delete Menu for Own Analyses */}
                {user && isOwnAnalysis && (onEdit || onDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEdit && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(analysis);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Redigera
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(analysis.id);
                          }} 
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Ta bort
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Analysis Type Badge */}
            <div className="mb-3">
              <Badge variant="outline" className={`text-xs ${getAnalysisTypeColor(analysis.analysis_type)}`}>
                <BookOpen className="w-3 h-3 mr-1" />
                {getAnalysisTypeLabel(analysis.analysis_type)}
              </Badge>
            </div>

            {/* Title and Content */}
            <div className="cursor-pointer">
              <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors">
                {analysis.title}
              </h3>
              <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
                {analysis.content.substring(0, 200)}
                {analysis.content.length > 200 && '...'}
              </p>
            </div>

            {/* Compact Engagement Badges */}
            <div className="flex flex-wrap gap-2 mb-4 text-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike();
                }}
                className={`flex items-center gap-1 rounded-full px-3 py-1 border transition-colors ${
                  isLiked
                    ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900/40 dark:bg-red-900/30'
                    : 'border-border text-muted-foreground hover:text-red-500'
                }`}
              >
                <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </button>

              <div className="flex items-center gap-1 rounded-full px-3 py-1 border border-border text-muted-foreground">
                <MessageCircle className="w-3 h-3" />
                <span>{analysis.comments_count || 0}</span>
              </div>

              <div className="flex items-center gap-1 rounded-full px-3 py-1 border border-border text-muted-foreground">
                <Eye className="w-3 h-3" />
                <span>{analysis.views_count || 0}</span>
              </div>
            </div>

            {/* Tags */}
            {analysis.tags && analysis.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {analysis.tags.slice(0, 3).map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedAnalysisCard;