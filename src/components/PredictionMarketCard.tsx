import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PolymarketMarket } from "@/types/polymarket";

export interface PredictionMarketCardProps {
  market: PolymarketMarket;
}

// Format volume number to display string
const formatVolume = (volumeNum: number): string => {
  if (volumeNum >= 1_000_000_000) {
    return `$${(volumeNum / 1_000_000_000).toFixed(2)}B`;
  } else if (volumeNum >= 1_000_000) {
    return `$${(volumeNum / 1_000_000).toFixed(1)}m`;
  } else if (volumeNum >= 1_000) {
    return `$${(volumeNum / 1_000).toFixed(1)}k`;
  }
  return `$${volumeNum.toFixed(0)}`;
};

// Get category from tags or default
const getCategory = (tags?: string[]): string => {
  if (tags && tags.length > 0) {
    // Capitalize first letter
    return tags[0].charAt(0).toUpperCase() + tags[0].slice(1);
  }
  return "Market";
};

export const PredictionMarketCard: React.FC<PredictionMarketCardProps> = ({
  market,
}) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const category = getCategory(market.tags);
  const volumeDisplay = formatVolume(market.volumeNum || market.volume || 0);

  const handleClick = () => {
    // Use slug for navigation (required by Polymarket API)
    // If slug is missing, fall back to id but we'll need to search for it
    const identifier = market.slug || market.id || market.conditionId || '';
    if (identifier) {
      navigate(`/predictions/${encodeURIComponent(identifier)}`);
    }
  };

  return (
    <Card 
      className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/50 border-border/60 bg-card/50 backdrop-blur-sm cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-4 flex flex-col sm:flex-row gap-4">
        
        {/* Vänster del: Bild och Ikon */}
        <div className="flex-shrink-0">
          <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-border/50 bg-muted/50">
            {market.imageUrl && !imageError ? (
              <img
                src={market.imageUrl}
                alt={market.question}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <BarChart3 className="h-8 w-8" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white text-center py-0.5 truncate px-1">
              {category}
            </div>
          </div>
        </div>

        {/* Mitten: Titel och Info */}
        <div className="flex-grow flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-semibold text-lg leading-tight mb-1 text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {market.question}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>Vol. {volumeDisplay}</span>
              </div>
              {market.active && !market.closed && (
                <div className="flex items-center gap-1 text-green-500">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span>Live</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Höger del: Odds / Outcomes */}
        <div className="flex-shrink-0 flex flex-col gap-2 w-full sm:w-48 justify-center">
          {market.outcomes.slice(0, 2).map((outcome) => {
            const percentage = Math.round(outcome.price * 100);
            
            // Färglogik: Grön för Yes/positiv, Röd för No/negativ, annars standard
            let barColor = "bg-primary/20"; 
            let textColor = "text-primary";
            
            const nameLower = outcome.title.toLowerCase();
            if (nameLower === "yes" || nameLower.includes("trump") || nameLower.includes("republican") || nameLower.includes("decrease") || nameLower.includes("cut")) {
                barColor = "bg-green-500/20";
                textColor = "text-green-600 dark:text-green-400";
            } else if (nameLower === "no" || nameLower.includes("harris") || nameLower.includes("democrat") || nameLower.includes("increase") || nameLower.includes("hike")) {
                barColor = "bg-red-500/20";
                textColor = "text-red-600 dark:text-red-400";
            }

            return (
              <button
                key={outcome.id}
                className="relative w-full h-9 rounded bg-secondary/50 hover:bg-secondary transition-colors overflow-hidden group/btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
              >
                {/* Progress Bar Bakgrund */}
                <div
                  className={cn("absolute top-0 left-0 h-full transition-all duration-500 ease-out", barColor)}
                  style={{ width: `${percentage}%` }}
                />
                
                {/* Text Innehåll */}
                <div className="relative z-10 flex items-center justify-between px-3 h-full text-sm font-medium">
                  <span className="text-muted-foreground group-hover/btn:text-foreground transition-colors truncate">
                    {outcome.title}
                  </span>
                  <span className={cn("ml-2 flex-shrink-0", textColor)}>
                    {percentage}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default PredictionMarketCard;
