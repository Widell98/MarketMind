import React, { useMemo } from 'react';
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
import Sparkline from '@/components/ui/Sparkline';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
      case 'winner':
      case 'completed':
        return 'bg-emerald-500';
      case 'loser':
        return 'bg-rose-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'active':
        return 'bg-blue-500';
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
      case 'winner':
        return 'Vinnare';
      case 'loser':
        return 'Förlorare';
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
  const sparklineData = useMemo(() => {
    if (Array.isArray(stockCase.performance_trend) && stockCase.performance_trend.length >= 2) {
      return stockCase.performance_trend;
    }

    const hasEntry = typeof stockCase.entry_price === 'number' && Number.isFinite(stockCase.entry_price);
    const hasCurrent = typeof stockCase.current_price === 'number' && Number.isFinite(stockCase.current_price);

    let startValue: number | null = hasEntry ? Number(stockCase.entry_price) : null;
    let latestValue: number | null = hasCurrent ? Number(stockCase.current_price) : null;

    if (startValue === null && latestValue !== null && Number.isFinite(performance)) {
      startValue = latestValue / (1 + performance / 100);
    }

    if (latestValue === null && startValue !== null && Number.isFinite(performance)) {
      latestValue = startValue * (1 + performance / 100);
    }

    if (startValue === null || latestValue === null || !Number.isFinite(startValue) || !Number.isFinite(latestValue)) {
      return null;
    }

    const points = 6;
    const step = (latestValue - startValue) / Math.max(points - 1, 1);

    return Array.from({ length: points }, (_, index) =>
      Number((startValue + step * index).toFixed(2))
    );
  }, [performance, stockCase.current_price, stockCase.entry_price, stockCase.performance_trend]);
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
  const showSparkline = Array.isArray(sparklineData) && sparklineData.length >= 2;
  const keyThesis = useMemo(() => {
    const trimmedThesis = stockCase.key_thesis?.trim();
    if (trimmedThesis) {
      return trimmedThesis;
    }

    if (!previewText) {
      return '';
    }

    const sentences = previewText.match(/[^.!?]+[.!?]?/g);
    if (!sentences || sentences.length === 0) {
      return previewText.trim();
    }

    return sentences[0].trim();
  }, [previewText, stockCase.key_thesis]);
  const supportingSummary = useMemo(() => {
    if (!previewText) {
      return '';
    }

    if (stockCase.key_thesis && stockCase.key_thesis.trim().length > 0) {
      return previewText.trim();
    }

    const sentences = previewText.match(/[^.!?]+[.!?]?/g);
    if (!sentences || sentences.length <= 1) {
      return '';
    }

    return sentences.slice(1).join(' ').trim();
  }, [previewText, stockCase.key_thesis]);
  const originBadge = stockCase.ai_generated ? <Badge variant="outline" className="shrink-0 items-center gap-1 whitespace-nowrap border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300 sm:text-xs">
      <Bot className="h-3 w-3" />
      AI
    </Badge> : stockCase.user_id ? <Badge variant="outline" className="shrink-0 items-center gap-1 whitespace-nowrap border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 sm:text-xs">
      <UserCircle className="h-3 w-3" />
      Community
    </Badge> : null;
  const performanceBadge = <Badge variant="secondary" className={`shrink-0 items-center gap-2 whitespace-nowrap px-2.5 py-0.5 font-semibold ${getPerformanceBadgeClasses(performance)}`}>
      <span>{formattedPerformance}</span>
      {showSparkline && sparklineData && (
        <span className="ml-1 flex h-3 w-12 items-center">
          <Sparkline data={sparklineData} width={48} height={14} />
        </span>
      )}
    </Badge>;
  const statusBadge = <Badge variant="secondary" className={`${getStatusColor(stockCase.status || 'active')} shrink-0 items-center gap-1 whitespace-nowrap border border-transparent px-2.5 py-0.5 text-[11px] font-medium text-white sm:text-xs`}>
      {formatStatusLabel(stockCase.status)}
    </Badge>;
  const targetBadge = stockCase.target_reached ? <Badge className="shrink-0 items-center gap-1 whitespace-nowrap border border-transparent bg-green-500 px-2.5 py-0.5 text-[11px] font-medium text-white sm:text-xs">
      🎯 Målkurs nådd
    </Badge> : null;
  const stopLossBadge = stockCase.stop_loss_hit ? <Badge className="shrink-0 items-center gap-1 whitespace-nowrap border border-transparent bg-red-500 px-2.5 py-0.5 text-[11px] font-medium text-white sm:text-xs">
      ⚠️ Stoploss taget
    </Badge> : null;
  const categoryBadge = <Badge variant="outline" className="shrink-0 whitespace-nowrap px-2.5 py-0.5 text-[11px] font-medium sm:text-xs">
      {formatCategoryLabel(stockCase.case_categories?.name || stockCase.sector)}
    </Badge>;
  const ownerBadge = isOwner ? <Badge variant="outline" className="shrink-0 items-center gap-1 whitespace-nowrap border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 sm:text-xs">
      Ditt Case
    </Badge> : null;
  const fullMetaBadges = [performanceBadge, statusBadge, targetBadge, stopLossBadge, categoryBadge, ownerBadge, originBadge].filter(Boolean) as React.ReactNode[];
  const compactMetaBadges = [performanceBadge, statusBadge, originBadge].filter(Boolean) as React.ReactNode[];
  const metaBadges = (showMetaBadges ? fullMetaBadges : compactMetaBadges);
  const badgeContainerClassName = showMetaBadges
    ? 'flex flex-nowrap items-center gap-1.5 overflow-x-auto py-0.5 text-[11px] text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:text-xs sm:py-0'
    : 'flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs';

  return <Card className={getCardClassNames()} onClick={() => onViewDetails(stockCase.id)}>
      <CardHeader className="px-4 pb-3 sm:px-6 sm:pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              {metaBadges.length > 0 && <div className={badgeContainerClassName}>
                  {metaBadges.map((badge, index) => (
                    <React.Fragment key={`meta-badge-${index}`}>
                      {badge}
                    </React.Fragment>
                  ))}
                </div>}

              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold leading-tight tracking-tight transition-colors group-hover:text-primary sm:text-xl">
                  {stockCase.title}
                </CardTitle>

                {stockCase.company_name && (
                  <p className="text-sm font-medium text-muted-foreground">
                    {stockCase.company_name}
                  </p>
                )}
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
        {stockCase.image_url && <div className="relative w-full h-40 sm:h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group/image">
            <img
              src={stockCase.image_url}
              alt={stockCase.company_name ? `${stockCase.company_name} illustration` : 'Investeringscase'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-all duration-300" />
          </div>}

        {keyThesis && <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              Nyckelinsikt
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {keyThesis}
            </p>
          </div>}

        {supportingSummary && <p className="flex-1 text-sm text-muted-foreground line-clamp-3 sm:line-clamp-4">
            {supportingSummary}
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={e => {
                    e.stopPropagation();
                    onViewDetails(stockCase.id);
                  }}
                  className="w-full justify-center gap-2 sm:w-auto"
                >
                  Visa detaljer
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDiscussWithAI}
                  className="w-full justify-center gap-2 sm:w-auto"
                >
                  <Bot className="h-4 w-4" />
                  Diskutera med AI
                </Button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
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
        </div>
      </CardContent>
    </Card>;
};
export default StockCaseCard;