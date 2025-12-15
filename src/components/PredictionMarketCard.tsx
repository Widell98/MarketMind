import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { PolymarketMarket } from "@/types/polymarket";
import SaveMarketButton from "@/components/SaveMarketButton";

interface PredictionMarketCardProps {
  market: PolymarketMarket;
}

export const PredictionMarketCard = ({ market }: PredictionMarketCardProps) => {
  const navigate = useNavigate();

  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const formatProb = (price: number) => Math.round(price * 100);

  // Hitta Yes/No outcomes för grafiken
  const yesOutcome = market.outcomes.find(o => o.title.toLowerCase() === 'yes') || market.outcomes[0];
  const noOutcome = market.outcomes.find(o => o.title.toLowerCase() === 'no');

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/predictions/${market.slug}`);
  };

  return (
    <Card 
      className="h-full cursor-pointer hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/40 flex flex-col group overflow-hidden bg-card"
      onClick={handleCardClick}
    >
      {/* Stor Bildsektion */}
      <div className="relative h-32 w-full overflow-hidden bg-muted/20">
        {market.imageUrl ? (
          <img 
            src={market.imageUrl} 
            alt={market.question}
            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/20">
            <TrendingUp className="h-10 w-10" />
          </div>
        )}
        
        {/* Volym Badge i hörnet */}
        <div className="absolute top-2 right-2 flex gap-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-md shadow-sm text-xs font-normal border-white/10">
            Vol: {formatVolume(market.volume || market.volumeNum || 0)}
          </Badge>
          <div onClick={(e) => e.stopPropagation()}>
             <SaveMarketButton
                marketId={market.id}
                marketTitle={market.question}
                compact={true}
                variant="secondary"
                size="sm"
                className="h-5 w-5 bg-background/80 backdrop-blur-md hover:bg-background"
              />
          </div>
        </div>
      </div>

      <CardHeader className="p-4 pb-2 space-y-1">
        {/* 1. Visa Event-titel (Parent) om den skiljer sig från frågan */}
        {market.eventTitle && market.eventTitle !== market.question && (
          <div className="text-[10px] font-bold text-primary/80 uppercase tracking-widest line-clamp-1">
            {market.eventTitle}
          </div>
        )}
        
        {/* 2. Visa specifika Frågan */}
        <h3 className="font-semibold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {market.question}
        </h3>
        
        {/* Datum */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
          {market.endDate && (
            <>
              <Calendar className="h-3 w-3" />
              <span>
                Slutar {new Date(market.endDate).toLocaleDateString('sv-SE', { 
                  day: 'numeric', month: 'short' 
                })}
              </span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 mt-auto">
        {/* Odds bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="text-green-600 dark:text-green-400 font-bold">Yes {formatProb(yesOutcome?.price || 0)}%</span>
            <span className="text-red-600 dark:text-red-400 font-bold">{noOutcome ? `${formatProb(noOutcome.price)}%` : '-'} No</span>
          </div>
          
          {/* Visual Probability Bar */}
          <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-green-500/80 transition-all duration-1000 ease-out" 
              style={{ width: `${formatProb(yesOutcome?.price || 0)}%` }}
            />
            <div 
              className="h-full bg-red-500/80 transition-all duration-1000 ease-out" 
              style={{ width: `${noOutcome ? formatProb(noOutcome.price) : 0}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
