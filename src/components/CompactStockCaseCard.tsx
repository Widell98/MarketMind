import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import LoginPromptModal from '@/components/LoginPromptModal';
import SaveOpportunityButton from '@/components/SaveOpportunityButton';

interface CompactStockCaseCardProps {
  stockCase: any;
}

const CompactStockCaseCard = ({ stockCase }: CompactStockCaseCardProps) => {
  const { likeCount, isLiked, toggleLike } = useStockCaseLikes(stockCase.id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const isOwner = user && stockCase.user_id === user.id;

  const handleClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    navigate(`/stock-cases/${stockCase.id}`);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    toggleLike();
  };

  const handleDiscussWithAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    const contextData = {
      type: 'stock_case',
      id: stockCase.id,
      title: stockCase.title,
      company: stockCase.company_name,
      data: stockCase
    };
    navigate('/ai-chatt', { state: { contextData } });
  };

  const handleEditCase = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/profile');
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Tech': 'bg-purple-500',
      'Biotech': 'bg-green-500',
      'Theme': 'bg-orange-500',
      'Gaming': 'bg-red-500',
      'Industrial': 'bg-blue-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusBadge = (status: string, performance: number | null) => {
    // Priority: target_reached/stop_loss_hit over general status
    if (stockCase.target_reached) {
      return (
        <Badge className="bg-green-500 text-white text-xs">
          🎯 Målkurs nådd
        </Badge>
      );
    }
    if (stockCase.stop_loss_hit) {
      return (
        <Badge className="bg-red-500 text-white text-xs">
          ⚠️ Stoploss taget
        </Badge>
      );
    }

    if (status === 'winner') {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800 text-xs">
          Winner {performance ? `+${performance}%` : ''}
        </Badge>
      );
    }
    if (status === 'loser') {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs">
          Loser {performance ? `${performance}%` : ''}
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs">
        Active
      </Badge>
    );
  };

  // Determine card styling based on case status
  const getCardClassNames = () => {
    let baseClasses = "group cursor-pointer";

    if (stockCase.target_reached) {
      baseClasses += " rounded-lg border border-green-500/50 bg-gradient-to-br from-green-50/80 to-card dark:from-green-950/30 dark:to-card p-2";
    } else if (stockCase.stop_loss_hit) {
      baseClasses += " rounded-lg border border-red-500/50 bg-gradient-to-br from-red-50/80 to-card dark:from-red-950/30 dark:to-card p-2";
    }

    return baseClasses;
  };

  return (
    <>
      <div
        className={getCardClassNames()}
        onClick={handleClick}
      >
        {/* Image/Visual */}
        <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-3">
          {stockCase.image_url ? (
            <img
              src={stockCase.image_url}
              alt={stockCase.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-8 h-8 rounded-full ${getCategoryColor(stockCase.case_categories?.name || 'Tech')}`}></div>
            </div>
          )}

          {/* Status badge overlay */}
          <div className="absolute top-2 right-2">
            {getStatusBadge(stockCase.status, stockCase.performance_percentage)}
          </div>

          {/* Owner badge */}
          {isOwner && (
            <div className="absolute top-2 left-2">
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                Ditt Case
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {stockCase.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-1">
            {stockCase.company_name}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>av {stockCase.profiles?.display_name || stockCase.profiles?.username || 'Anonym'}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                  isLiked
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
              >
                <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </button>

              <SaveOpportunityButton
                itemType="stock_case"
                itemId={stockCase.id}
                itemTitle={stockCase.title}
                variant="ghost"
                size="sm"
                showText={false}
                compact={true}
              />
            </div>
          </div>

          {/* AI Discussion and Owner Actions */}
          {user && (
            <div className="flex items-center gap-1 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscussWithAI}
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex-1 text-xs"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Diskutera AI
              </Button>

              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditCase}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex-1 text-xs"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Redigera
                </Button>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(stockCase.created_at), { addSuffix: true, locale: sv })}
          </div>
        </div>
      </div>

      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />
    </>
  );
};

export default CompactStockCaseCard;
