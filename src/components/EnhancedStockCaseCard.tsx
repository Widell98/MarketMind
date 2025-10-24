import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Heart, MessageCircle, TrendingUp, TrendingDown, Calendar, MoreHorizontal, Trash2, Bot, UserPlus, UserCheck, User, Edit } from 'lucide-react';
import { StockCase } from '@/types/stockCase';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import { useUserFollows } from '@/hooks/useUserFollows';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CASE_IMAGE_PLACEHOLDER, getOptimizedCaseImage, handleCaseImageError } from '@/utils/imageUtils';

interface EnhancedStockCaseCardProps {
  stockCase: StockCase;
  onViewDetails: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (stockCase: StockCase) => void;
  showProfileActions?: boolean;
}

const EnhancedStockCaseCard: React.FC<EnhancedStockCaseCardProps> = ({
  stockCase,
  onViewDetails,
  onDelete,
  onEdit,
  showProfileActions = true
}) => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { likeCount, isLiked, toggleLike } = useStockCaseLikes(stockCase.id);
  const { isFollowing, followUser, unfollowUser } = useUserFollows();
  const navigate = useNavigate();

  const isOwner = user && stockCase.user_id === user.id;
  const isUserCase = !stockCase.ai_generated && stockCase.user_id;
  const optimizedImageSources = getOptimizedCaseImage(stockCase.image_url);
  const displayImageSrc = optimizedImageSources?.src ?? stockCase.image_url ?? CASE_IMAGE_PLACEHOLDER;
  const displayImageSrcSet = optimizedImageSources?.srcSet;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'winner': return 'bg-blue-500';
      case 'loser': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance > 0) return 'text-green-600 dark:text-green-400';
    if (performance < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculatePerformance = () => {
    if (stockCase.entry_price && stockCase.current_price) {
      return ((stockCase.current_price - stockCase.entry_price) / stockCase.entry_price) * 100;
    }
    return stockCase.performance_percentage || 0;
  };

  const handleDiscussWithAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to stock case detail page and scroll to comments
    navigate(`/stock-cases/${stockCase.id}`, { 
      state: { scrollToComments: true } 
    });
  };

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!stockCase.user_id) return;
    
    if (isFollowing(stockCase.user_id)) {
      await unfollowUser(stockCase.user_id);
    } else {
      await followUser(stockCase.user_id);
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stockCase.user_id) {
      navigate(`/profile/${stockCase.user_id}`);
    }
  };

  const performance = calculatePerformance();
  const PerformanceIcon = performance > 0 ? TrendingUp : performance < 0 ? TrendingDown : null;
  const showTargetPriceMetric = Boolean(stockCase.target_price) && !stockCase.ai_generated;
  const showPerformanceMetric = performance !== 0;

  // Determine card styling based on case status
  const getCardClassNames = () => {
    let baseClasses = "h-full flex flex-col hover:shadow-lg transition-all duration-200 group cursor-pointer border-border bg-card";
    
    if (stockCase.target_reached) {
      baseClasses += " border-green-500/50 bg-gradient-to-br from-green-50/80 to-card dark:from-green-950/30 dark:to-card shadow-green-500/20";
    } else if (stockCase.stop_loss_hit) {
      baseClasses += " border-red-500/50 bg-gradient-to-br from-red-50/80 to-card dark:from-red-950/30 dark:to-card shadow-red-500/20";
    }
    
    return baseClasses;
  };

  return (
    <Card className={getCardClassNames()} onClick={() => onViewDetails(stockCase.id)}>
      <CardHeader className="pb-3">
        {/* Header with profile info */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Profile Section */}
            {isUserCase ? (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleProfileClick}>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        {stockCase.profiles?.display_name?.[0] || stockCase.profiles?.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {stockCase.profiles?.display_name || stockCase.profiles?.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(stockCase.created_at)}
                      </p>
                    </div>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="flex justify-between space-x-4">
                    <Avatar>
                      <AvatarFallback>{stockCase.profiles?.display_name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-sm font-semibold">{stockCase.profiles?.display_name || stockCase.profiles?.username}</h4>
                      <p className="text-sm text-muted-foreground">
                        Aktiv investerare i communityn
                      </p>
                      <div className="flex items-center pt-2">
                        <Calendar className="mr-2 h-4 w-4 opacity-70" />
                        <span className="text-xs text-muted-foreground">
                          Medlem sedan {formatDate(stockCase.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ) : (
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">AI Assistant</p>
                  <p className="text-xs text-muted-foreground">{formatDate(stockCase.created_at)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Follow Button & Actions */}
          <div className="flex items-center gap-2">
            {showProfileActions && isUserCase && !isOwner && user && (
              <Button
                size="sm"
                variant={isFollowing(stockCase.user_id!) ? "secondary" : "outline"}
                onClick={handleFollowToggle}
                className="text-xs px-2 py-1"
              >
                {isFollowing(stockCase.user_id!) ? (
                  <>
                    <UserCheck className="w-3 h-3 mr-1" />
                    Följer
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3 mr-1" />
                    Följ
                  </>
                )}
              </Button>
            )}

            {(isAdmin || (user && (onDelete || onEdit))) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={e => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && isOwner && (
                    <DropdownMenuItem 
                      onClick={e => {
                        e.stopPropagation();
                        onEdit(stockCase);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Redigera
                    </DropdownMenuItem>
                  )}
                  {onDelete && (isOwner || isAdmin) && (
                    <DropdownMenuItem 
                      onClick={e => {
                        e.stopPropagation();
                        onDelete(stockCase.id);
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

        {/* Title and badges */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(stockCase.status || 'active')} text-white text-xs`}
            >
              {stockCase.status || 'active'}
            </Badge>
            
            {stockCase.target_reached && (
              <Badge className="bg-green-500 text-white text-xs">
                🎯 Målkurs nådd
              </Badge>
            )}
            
            {stockCase.stop_loss_hit && (
              <Badge className="bg-red-500 text-white text-xs">
                ⚠️ Stoploss taget
              </Badge>
            )}
            
            {stockCase.sector && (
              <Badge variant="outline" className="text-xs">
                {stockCase.sector}
              </Badge>
            )}
            
            {stockCase.ai_generated && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                <Bot className="w-3 h-3 mr-1" />
                AI
              </Badge>
            )}
          </div>

          <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {stockCase.title}
          </h3>
          
          <p className="text-sm text-muted-foreground">
            {stockCase.company_name}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Stock Image */}
        {displayImageSrc && (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
            <img
              src={displayImageSrc}
              srcSet={displayImageSrcSet}
              alt={stockCase.company_name ? `${stockCase.company_name} illustration` : 'Investeringscase'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
              onError={handleCaseImageError}
            />
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
          {stockCase.description}
        </p>
        
        {/* Performance metrics */}
        {(showTargetPriceMetric || showPerformanceMetric) && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            {showTargetPriceMetric && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Målkurs</p>
                <p className="text-sm font-semibold">{stockCase.target_price} kr</p>
              </div>
            )}

            {showPerformanceMetric && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Resultat</p>
                <div className={`flex items-center gap-1 text-sm font-semibold ${getPerformanceColor(performance)}`}>
                  {PerformanceIcon && <PerformanceIcon className="w-3 h-3" />}
                  {performance > 0 ? '+' : ''}{performance.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="pt-4 border-t space-y-3">
          {/* Social actions */}
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant={isLiked ? "default" : "outline"} 
              onClick={e => {
                e.stopPropagation();
                toggleLike();
              }} 
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </Button>

            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleDiscussWithAI}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Diskutera</span>
              <span className="sm:hidden">AI</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedStockCaseCard;