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

  // Visa max 2 outcomes för att hålla kortet snyggt i listan
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
            
            {/* ODDS LISTA */}
            <div className="space-y-1.5 mb-3">
              {displayOutcomes.map((outcome, idx) => {
                // Beräkna procent (0.55 -> 55)
                const percent = Math.round((outcome.price || 0) * 100);
                
                // Bestäm färg baserat på titel (Yes=Grön, No=Röd)
                let percentColor = "text-foreground";
                const titleLower = outcome.title.toLowerCase();
                if (titleLower === 'yes' || titleLower === 'trump') percentColor = "text-green-600 dark:text-green-400";
                if (titleLower === 'no' || titleLower === 'harris') percentColor = "text-red-600 dark:text-red-400";

                return (
                  <div key={idx} className="flex items-center justify-between text-sm p-1.5 rounded bg-secondary/30 border border-transparent hover:border-border/50 transition-colors">
                    <span className="text-muted-foreground truncate mr-2 font-medium text-xs uppercase tracking-wide">
                      {outcome.title}
                    </span>
                    <span className={`font-bold ${percentColor}`}>
                      {percent}%
                    </span>
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
