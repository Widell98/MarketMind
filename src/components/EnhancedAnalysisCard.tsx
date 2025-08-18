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
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-gray-900 dark:via-purple-950/30 dark:to-pink-950/30 hover:scale-[1.01] cursor-pointer">
      {/* Gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardContent className="relative p-6 border-l-4 border-purple-400 dark:border-purple-600">
        <div className="flex items-start space-x-4">
          {/* Enhanced Avatar with Profile Hover Card */}
          <HoverCard>
            <HoverCardTrigger asChild>
              <Avatar 
                className="w-16 h-16 cursor-pointer hover:ring-4 hover:ring-purple-200 dark:hover:ring-purple-800 transition-all duration-300 ring-2 ring-purple-100 dark:ring-purple-900 shadow-lg"
                onClick={() => handleUserClick(analysis.user_id)}
              >
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold text-lg">
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

          {/* Enhanced Content */}
          <div className="flex-1 min-w-0">
            {/* Enhanced Header with Author Info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <button
                    onClick={() => handleUserClick(analysis.user_id)}
                    className="font-bold text-lg text-purple-900 dark:text-purple-100 hover:text-purple-600 dark:hover:text-purple-300 transition-colors text-left"
                  >
                    {authorName}
                  </button>
                  <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                    <span>@{authorUsername}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: sv })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
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

                {/* Edit/Delete Menu for Own Analyses */}
                {user && isOwnAnalysis && (onEdit || onDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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

            {/* Enhanced Analysis Type Badge */}
            <div className="mb-4">
              <Badge className={`text-sm px-3 py-1 font-medium ${getAnalysisTypeColor(analysis.analysis_type)} border-0 shadow-sm`}>
                <BookOpen className="w-4 h-4 mr-2" />
                {getAnalysisTypeLabel(analysis.analysis_type)}
              </Badge>
            </div>

            {/* Enhanced Title and Content */}
            <div onClick={() => onViewDetails(analysis.id)} className="cursor-pointer space-y-3">
              <h3 className="font-bold text-2xl leading-tight text-purple-900 dark:text-purple-100 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                {analysis.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-base line-clamp-4 leading-relaxed">
                {analysis.content.substring(0, 300)}
                {analysis.content.length > 300 && '...'}
              </p>
            </div>

            {/* Enhanced Colored Tags */}
            {analysis.tags && analysis.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {analysis.tags.slice(0, 4).map((tag: string, index: number) => {
                  const colors = [
                    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
                    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
                    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
                    'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800'
                  ];
                  return (
                    <Badge key={index} className={`text-sm px-3 py-1 font-medium border ${colors[index % colors.length]}`}>
                      #{tag}
                    </Badge>
                  );
                })}
                {analysis.tags.length > 4 && (
                  <Badge variant="outline" className="text-sm px-3 py-1 text-purple-600 dark:text-purple-400">
                    +{analysis.tags.length - 4} mer
                  </Badge>
                )}
              </div>
            )}

            {/* Enhanced Social Engagement Bar */}
            <div className="pt-4 border-t border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4 -mx-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike();
                    }}
                    className={`flex items-center space-x-2 transition-all duration-200 px-3 py-2 rounded-lg hover:scale-105 ${
                      isLiked 
                        ? 'text-red-500 bg-red-50 dark:bg-red-950/30' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="font-semibold">{likeCount}</span>
                  </button>
                  
                  <button 
                    onClick={() => onViewDetails(analysis.id)}
                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:scale-105"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-semibold">{analysis.comments_count || 0}</span>
                  </button>

                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 px-3 py-2">
                    <Eye className="w-5 h-5" />
                    <span className="font-semibold">{analysis.views_count || 0}</span>
                  </div>
                </div>

                <Button
                  onClick={() => onViewDetails(analysis.id)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300"
                >
                  Läs hela analysen →
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