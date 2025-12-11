import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { PolymarketMarket } from "@/types/polymarket";

interface PredictionMarketCardProps {
  market: PolymarketMarket;
}

export const PredictionMarketCard = ({ market }: PredictionMarketCardProps) => {
  const navigate = useNavigate();

  // Helper to format volume
  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
    if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
    if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
    return `$${vol.toFixed(0)}`;
  };

  // Hitta "Yes" och "No" outcomes för att visa odds
  // Vi antar att outcome[0] är Yes och outcome[1] är No, eller söker på titel
  const yesOutcome = market.outcomes.find(o => o.title.toLowerCase() === 'yes') || market.outcomes[0];
  const noOutcome = market.outcomes.find(o => o.title.toLowerCase() === 'no') || market.outcomes[1];

  // Beräkna procent (pris * 100)
  const yesPercent = yesOutcome ? Math.round(yesOutcome.price * 100) : 0;
  const noPercent = noOutcome ? Math.round(noOutcome.price * 100) : 0;

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/60 hover:border-primary/50 group overflow-hidden"
      onClick={() => navigate(`/predictions/${market.slug}`)}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Market Image */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-muted border border-border/50 relative">
            {market.imageUrl ? (
              <img 
                src={market.imageUrl} 
                alt={market.question} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                  const fallback = document.createElement('span');
                  fallback.className = 'text-xs text-muted-foreground font-medium';
                  fallback.innerText = 'No Img';
                  e.currentTarget.parentElement?.appendChild(fallback);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                <span className="text-xs text-muted-foreground font-medium">PM</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-grow min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors mb-2">
                {market.question}
              </h3>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="font-medium text-foreground/80">{formatVolume(market.volume || market.volumeNum || 0)} Vol</span>
                </div>
                
                {market.endDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(market.endDate).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Odds / Outcomes */}
            <div className="flex items-center gap-2 mt-3 sm:mt-0">
               {/* YES BUTTON */}
               <div className={`
                 flex-1 flex items-center justify-between px-3 py-1.5 rounded-md text-sm font-medium transition-colors border
                 ${yesOutcome 
                    ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' 
                    : 'bg-muted text-muted-foreground border-transparent'}
               `}>
                 <span className="opacity-80 text-xs uppercase tracking-wide mr-2">Yes</span>
                 <span>{yesPercent}%</span>
               </div>

               {/* NO BUTTON */}
               <div className={`
                 flex-1 flex items-center justify-between px-3 py-1.5 rounded-md text-sm font-medium transition-colors border
                 ${noOutcome 
                    ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50' 
                    : 'bg-muted text-muted-foreground border-transparent'}
               `}>
                 <span className="opacity-80 text-xs uppercase tracking-wide mr-2">No</span>
                 <span>{noPercent}%</span>
               </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
