import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Calendar, User, MoreHorizontal, Trash2, Bot, UserCircle, Edit } from 'lucide-react';
import { StockCase } from '@/types/stockCase';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useStockCaseLikes } from '@/hooks/useStockCaseLikes';
import { useNavigate } from 'react-router-dom';
import ShareStockCase from './ShareStockCase';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CASE_IMAGE_PLACEHOLDER, getOptimizedCaseImage } from '@/utils/imageUtils';
interface StockCaseCardProps {
  stockCase: StockCase;
  onViewDetails: (id: string) => void;
  onDelete?: (id: string) => void;
  showMetaBadges?: boolean;
}
const StockCaseCard: React.FC<StockCaseCardProps> = ({
  stockCase,
  onViewDetails,
  onDelete,
  showMetaBadges = true
}) => {
  const {
    user
  } = useAuth();
  const {
    isAdmin
  } = useUserRole();
  const {
    likeCount,
    isLiked,
    toggleLike
  } = useStockCaseLikes(stockCase.id);
  const navigate = useNavigate();
  const isOwner = user && stockCase.user_id === user.id;
  
  // Determine card styling based on case status
  const getCardClassNames = () => {
    let baseClasses = "group flex h-full flex-col rounded-2xl border border-border/60 bg-card/80 transition-all duration-200 hover:shadow-md";
    
    if (stockCase.target_reached) {
      baseClasses += " border-green-500/50 bg-gradient-to-br from-green-50/80 to-card dark:from-green-950/30 dark:to-card shadow-green-500/20";
    } else if (stockCase.stop_loss_hit) {
      baseClasses += " border-red-500/50 bg-gradient-to-br from-red-50/80 to-card dark:from-red-950/30 dark:to-card shadow-red-500/20";
    }
    
    return baseClasses;
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };
  const getPerformanceBadgeClasses = (value: number) => {
    if (!Number.isFinite(value)) {
      return 'bg-muted text-muted-foreground';
    }

    if (value > 0) {
      return 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300';
    }

    if (value < 0) {
      return 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300';
    }

    return 'bg-muted text-muted-foreground';
  };

  const formatStatusLabel = (status?: string | null) => {
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'completed':
        return 'Avslutad';
      case 'paused':
        return 'Pausad';
      default:
        return status || 'Aktiv';
    }
  };

  const formatCategoryLabel = (label?: string | null) => {
    if (!label) {
      return 'Allmänt';
    }

    return label.toLowerCase() === 'general' ? 'Allmänt' : label;
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
      return (stockCase.current_price - stockCase.entry_price) / stockCase.entry_price * 100;
    }
    return stockCase.performance_percentage || 0;
  };
  const handleDiscussWithAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    const contextData = {
      type: 'stock_case',
      id: stockCase.id,
      title: stockCase.title,
      company: stockCase.company_name,
      data: stockCase
    };
    navigate('/ai-chatt', {
      state: {
        contextData
      }
    });
  };
  const handleEditCase = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/profile');
  };
  const performance = calculatePerformance();
  const formattedPerformance = Number.isFinite(performance)
    ? `${performance > 0 ? '+' : ''}${performance.toFixed(1).replace('.', ',')}%`
    : '—';
  const stripFiftyTwoWeekSummary = (value?: string | null): string => {
    if (typeof value !== 'string') {
      return '';
    }

    const match = value.match(/52-veckors\s+högsta:\s*[0-9.,-]+\s*\|\s*52-veckors\s+lägsta:\s*[0-9.,-]+/i);
    if (!match) {
      return value;
    }

    return value.replace(match[0], '').replace(/\s{3,}/g, ' ').trim();
  };
  const shortDescription = stockCase.description?.trim();
  const cleanedLongDescription = stripFiftyTwoWeekSummary(stockCase.long_description);
  const optimizedImageSources = getOptimizedCaseImage(stockCase.image_url);
  const displayImageSrc = optimizedImageSources?.src ?? stockCase.image_url ?? CASE_IMAGE_PLACEHOLDER;
  const displayImageSrcSet = optimizedImageSources?.srcSet;
  const previewText = shortDescription && shortDescription.length > 0
    ? shortDescription
    : cleanedLongDescription
      ? (() => {
          const normalized = cleanedLongDescription.replace(/\s+/g, ' ').trim();
          if (normalized.length <= 260) {
            return normalized;
          }
          return `${normalized.slice(0, 257).trimEnd()}...`;
        })()
      : '';

  return <Card className={getCardClassNames()} onClick={() => onViewDetails(stockCase.id)}>
      <CardHeader className="px-4 pb-3 sm:px-6 sm:pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              {showMetaBadges && <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto py-0.5 text-[11px] text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:text-xs sm:py-0">
                <Badge variant="secondary" className={`shrink-0 whitespace-nowrap px-2.5 py-0.5 font-semibold ${getPerformanceBadgeClasses(performance)}`}>
                  {formattedPerformance}
                </Badge>

                <Badge variant="secondary" className={`${getStatusColor(stockCase.status || 'active')} shrink-0 whitespace-nowrap border border-transparent px-2.5 py-0.5 text-[11px] font-medium text-white sm:text-xs`}>
                  {formatStatusLabel(stockCase.status)}
                </Badge>

                {stockCase.target_reached && <Badge className="shrink-0 whitespace-nowrap border border-transparent bg-green-500 text-[11px] font-medium text-white px-2.5 py-0.5 sm:text-xs">
                    🎯 Målkurs nådd
                  </Badge>}

                {stockCase.stop_loss_hit && <Badge className="shrink-0 whitespace-nowrap border border-transparent bg-red-500 text-[11px] font-medium text-white px-2.5 py-0.5 sm:text-xs">
                    ⚠️ Stoploss taget
                  </Badge>}

                <Badge variant="outline" className="shrink-0 whitespace-nowrap px-2.5 py-0.5 text-[11px] font-medium sm:text-xs">
                  {formatCategoryLabel(stockCase.case_categories?.name || stockCase.sector)}
                </Badge>

                {isOwner && <Badge variant="outline" className="shrink-0 whitespace-nowrap border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 sm:text-xs">
                    Ditt Case
                  </Badge>}

                {stockCase.ai_generated && <Badge variant="outline" className="shrink-0 whitespace-nowrap border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300 sm:text-xs">
                    <Bot className="mr-1 h-3 w-3" />
                    AI
                  </Badge>}

                {!stockCase.ai_generated && stockCase.user_id && <Badge variant="outline" className="shrink-0 whitespace-nowrap border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 sm:text-xs">
                    <UserCircle className="mr-1 h-3 w-3" />
                    Community
                  </Badge>}
              </div>}

              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold leading-tight tracking-tight transition-colors group-hover:text-primary sm:text-xl">
                  {stockCase.title}
                </CardTitle>

                {stockCase.company_name && <p className="text-sm font-medium text-muted-foreground">
                    {stockCase.company_name}
                  </p>}
              </div>
            </div>

            {(isAdmin || user && onDelete) && <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-1 h-8 w-8 flex-shrink-0 p-0" onClick={e => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onDelete && <DropdownMenuItem onClick={e => {
              e.stopPropagation();
              onDelete(stockCase.id);
            }} className="text-red-600 hover:text-red-700">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
        {/* Stock Image - Responsive */}
        {displayImageSrc && <div className="relative w-full h-40 sm:h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group/image">
            <img
              src={displayImageSrc}
              srcSet={displayImageSrcSet}
              alt={stockCase.company_name ? `${stockCase.company_name} illustration` : 'Investeringscase'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-all duration-300" />
          </div>}

        {previewText && <p className="flex-1 text-sm text-muted-foreground line-clamp-3 sm:line-clamp-4">
            {previewText}
          </p>}

        <div className="mt-auto space-y-4">
          <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-1.5">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{formatDate(stockCase.created_at)}</span>
            </div>
            <div className="flex min-w-0 items-center gap-1.5 sm:justify-end">
              {stockCase.ai_generated ? <>
                  <Bot className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">AI Assistant</span>
                </> : <>
                  <User className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{stockCase.profiles?.display_name || stockCase.profiles?.username || 'Expert'}</span>
                </>}
            </div>
          </div>

          {user && isOwner && <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button size="sm" variant="outline" onClick={handleEditCase} className="w-full justify-center gap-2 sm:w-auto">
                <Edit className="h-4 w-4" />
                <span className="truncate">Redigera case</span>
              </Button>
            </div>}

          <div className="border-t pt-3 sm:pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button size="sm" variant={isLiked ? "default" : "outline"} onClick={e => {
                e.stopPropagation();
                toggleLike();
              }} className="w-full justify-center gap-2 sm:w-auto">
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </Button>

              <ShareStockCase stockCaseId={stockCase.id} title={stockCase.title} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default StockCaseCard;