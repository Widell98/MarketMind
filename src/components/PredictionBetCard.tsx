import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, Trash2, Edit } from 'lucide-react';
import { PredictionMarketBet } from '@/hooks/usePredictionMarketBets';
import type { PolymarketMarketDetail } from '@/types/polymarket';

interface PredictionBetCardProps {
  bet: PredictionMarketBet;
  market?: PolymarketMarketDetail | null;
  onRemove?: (betId: string) => void;
  onEdit?: (bet: PredictionMarketBet) => void;
  onClick?: () => void;
  compact?: boolean;
}

const PredictionBetCard: React.FC<PredictionBetCardProps> = ({
  bet,
  market,
  onRemove,
  onEdit,
  onClick,
  compact = false
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatOdds = (odds: number) => {
    return `${Math.round(odds * 100)}%`;
  };

  const getStatusBadge = () => {
    switch (bet.status) {
      case 'won':
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Vunnen
          </Badge>
        );
      case 'lost':
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Förlorad
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Väntande
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Aktiv
          </Badge>
        );
    }
  };

  const getOutcomeColor = (outcome: string) => {
    const outcomeLower = outcome.toLowerCase();
    if (outcomeLower === 'yes') {
      return 'text-green-600 dark:text-green-400';
    } else if (outcomeLower === 'no') {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-foreground';
  };

  const potentialProfit = bet.potential_payout - bet.bet_amount;
  const profitPercentage = ((potentialProfit / bet.bet_amount) * 100).toFixed(1);

  if (compact) {
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/60 hover:border-primary/50"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-sm truncate">{bet.market_question}</h4>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className={getOutcomeColor(bet.bet_outcome)}>
                  {bet.bet_outcome} @ {formatOdds(bet.bet_odds)}
                </span>
                <span>•</span>
                <span>{formatCurrency(bet.bet_amount)}</span>
                <span>•</span>
                <span className="text-green-600 dark:text-green-400">
                  Potentiell vinst: {formatCurrency(potentialProfit)} (+{profitPercentage}%)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(bet);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(bet.id);
                  }}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/60 hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base mb-2 line-clamp-2">{bet.market_question}</h3>
              {getStatusBadge()}
            </div>
            {market?.imageUrl && (
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                <img 
                  src={market.imageUrl} 
                  alt={bet.market_question}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Bet Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Outcome</p>
              <p className={`font-medium ${getOutcomeColor(bet.bet_outcome)}`}>
                {bet.bet_outcome}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Odds</p>
              <p className="font-medium">{formatOdds(bet.bet_odds)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Insats</p>
              <p className="font-medium">{formatCurrency(bet.bet_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Potentiell utbetalning</p>
              <p className="font-medium text-green-600 dark:text-green-400">
                {formatCurrency(bet.potential_payout)}
              </p>
            </div>
          </div>

          {/* Profit/Loss */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Potentiell vinst</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(potentialProfit)} (+{profitPercentage}%)
                </span>
              </div>
            </div>
          </div>

          {/* Market End Date */}
          {bet.market_end_date && (
            <div className="text-xs text-muted-foreground">
              Marknad stänger: {new Date(bet.market_end_date).toLocaleDateString('sv-SE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          )}

          {/* Notes */}
          {bet.notes && (
            <div className="text-xs text-muted-foreground italic">
              "{bet.notes}"
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(bet);
                }}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Redigera
              </Button>
            )}
            {onRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(bet.id);
                }}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Ta bort
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictionBetCard;


