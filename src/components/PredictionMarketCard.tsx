import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { PolymarketMarket } from "@/types/polymarket";

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

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 border-border/60 hover:border-primary/50 group overflow-hidden bg-card"
      onClick={() => navigate(`/predictions/${market.slug}`)}
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
            <h3 className="font-medium text-base leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
              {market.question}
            </h3>
            
            {/* NY ODDS-LISTA MED FÄRGADE BARS */}
            <div className="space-y-2 mb-3">
              {displayOutcomes.map((outcome, idx) => {
                // Beräkna procent (0.55 -> 55) och säkra att det är mellan 0-100
                const percent = Math.min(100, Math.max(0, Math.round((outcome.price || 0) * 100)));
                
                const titleLower = outcome.title.toLowerCase();
                
                // Bestäm färger baserat på om det är Yes/No eller annat
                let barColorClass = "bg-secondary"; // Default grå/blå
                let textColorClass = "text-foreground";

                if (titleLower === 'yes') {
                    barColorClass = "bg-emerald-500 dark:bg-emerald-400";
                    textColorClass = "text-emerald-950 dark:text-emerald-50";
                } else if (titleLower === 'no') {
                    barColorClass = "bg-rose-500 dark:bg-rose-400";
                    textColorClass = "text-rose-950 dark:text-rose-50";
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
