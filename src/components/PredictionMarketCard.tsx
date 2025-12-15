import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Calendar, ExternalLink } from "lucide-react";
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

  // Visa max 2 outcomes
  const displayOutcomes = market.outcomes.slice(0, 2);

  // Kolla om det är en binär marknad (Ja/Nej) för att styra färgsättningen
  const isBinary = market.outcomes.length === 2 && 
                 market.outcomes.some(o => o.title.toLowerCase() === 'yes');

  const handleCardClick = (e: React.MouseEvent) => {
    // Navigera inte om man klickar på knappar eller länkar
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    navigate(`/predictions/${market.slug}`);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/60 hover:border-primary/50 group overflow-hidden bg-card relative"
      onClick={handleCardClick}
    >
      <CardContent className="p-4 flex gap-4 items-start">
        {/* Bild */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-md bg-muted border border-border/50 relative overflow-hidden mt-1">
          {market.imageUrl ? (
            <img 
              src={market.imageUrl} 
              alt={market.question} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground font-bold">PM</div>
          )}
        </div>

        {/* Innehåll */}
        <div className="flex-grow min-w-0">
          
          {/* Visa Event-titel (Parent) om den finns och skiljer sig från frågan */}
          {market.groupItemTitle && market.groupItemTitle !== market.question && (
             <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1 line-clamp-1">
               {market.groupItemTitle}
             </div>
          )}

          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-medium text-base leading-tight group-hover:text-primary transition-colors line-clamp-2 flex-1">
              {market.question}
            </h3>
            
            <div className="flex gap-1 items-center">
                 {/* Extern länk till Polymarket */}
                 {market.eventSlug && (
                    <a 
                       href={`https://polymarket.com/event/${market.eventSlug}`} 
                       target="_blank" 
                       rel="noreferrer"
                       className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-md hover:bg-muted"
                       onClick={(e) => e.stopPropagation()}
                       title="Öppna på Polymarket"
                    >
                       <ExternalLink className="w-4 h-4" />
                    </a>
                 )}
                 
                 <div onClick={(e) => e.stopPropagation()}>
                  <SaveMarketButton
                    marketId={market.id}
                    marketTitle={market.question}
                    compact={true}
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                  />
                </div>
            </div>
          </div>
            
            {/* ODDS-LISTA */}
            <div className="space-y-2 mb-3">
              {displayOutcomes.map((outcome, idx) => {
                // Beräkna procent (0.55 -> 55) och säkra att det är mellan 0-100
                const percent = Math.min(100, Math.max(0, Math.round((outcome.price || 0) * 100)));
                
                const titleLower = outcome.title.toLowerCase();
                
                // Bestäm färger
                let barColorClass = "bg-primary/20"; // Default för "Multiple Choice" (blåaktig)
                let textColorClass = "text-foreground";

                if (isBinary) {
                    // Strikt färgschema för Ja/Nej
                    if (titleLower === 'yes') {
                        barColorClass = "bg-green-600 dark:bg-green-500";
                        textColorClass = "text-green-950 dark:text-green-50";
                    } else if (titleLower === 'no') {
                        barColorClass = "bg-red-600 dark:bg-red-500";
                        textColorClass = "text-red-950 dark:text-red-50";
                    }
                } else {
                    // För Multiple Choice: Markera ledaren lite extra
                    if (idx === 0) barColorClass = "bg-primary/30";
                }

                return (
                  <div key={idx} className="relative h-9 rounded-md overflow-hidden bg-secondary/20 border border-black/5 dark:border-white/5">
                    {/* 1. Bakgrunds-bar (Fyllnaden) */}
                    <div 
                      className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out opacity-25 dark:opacity-30 ${barColorClass}`}
                      style={{ width: `${percent}%` }}
                    />
                    
                    {/* 2. Text-lager (Ligger ovanpå baren med z-10) */}
                    <div className={`relative z-10 flex items-center justify-between h-full px-3 text-sm font-medium ${textColorClass}`}>
                      <span className="truncate mr-2 font-semibold tracking-wide opacity-90">
                        {outcome.title}
                      </span>
                      <span className="font-bold">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground opacity-80">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{formatVolume(market.volume || market.volumeNum || 0)} Vol</span>
                </div>
                {market.endDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(market.endDate).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
            </div>
          </div>
        </CardContent>
    </Card>
  );
};
