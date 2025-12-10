import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

// Typer för props
export interface Outcome {
  id: string;
  name: string;
  price: number; // 0.0 till 1.0 (t.ex. 0.65 för 65%)
  color?: string; 
}

export interface PredictionMarketProps {
  id: string;
  title: string;
  imageUrl?: string;
  volume: string; // T.ex. "$3.2m"
  outcomes: Outcome[];
  category?: string;
}

export const PredictionMarketCard: React.FC<PredictionMarketProps> = ({
  title,
  imageUrl,
  volume,
  outcomes,
  category = "Politics",
}) => {
  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/50 border-border/60 bg-card/50 backdrop-blur-sm">
      <div className="p-4 flex flex-col sm:flex-row gap-4">
        
        {/* Vänster del: Bild och Ikon */}
        <div className="flex-shrink-0">
          <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-border/50 bg-muted/50">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
              {title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>Vol. {volume}</span>
              </div>
              <div className="flex items-center gap-1 text-green-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span>Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Höger del: Odds / Köpknappar */}
        <div className="flex-shrink-0 flex flex-col gap-2 w-full sm:w-48 justify-center">
          {outcomes.map((outcome) => {
            const percentage = Math.round(outcome.price * 100);
            
            // Färglogik: Grön för Yes/Trump, Röd för No/Harris, annars standard
            let barColor = "bg-primary/20"; 
            let textColor = "text-primary";
            
            const nameLower = outcome.name.toLowerCase();
            if (nameLower === "yes" || nameLower.includes("trump") || nameLower.includes("republican")) {
                barColor = "bg-green-500/20";
                textColor = "text-green-600 dark:text-green-400";
            } else if (nameLower === "no" || nameLower.includes("harris") || nameLower.includes("democrat")) {
                barColor = "bg-red-500/20";
                textColor = "text-red-600 dark:text-red-400";
            }

            return (
              <button
                key={outcome.id}
                className="relative w-full h-9 rounded bg-secondary/50 hover:bg-secondary transition-colors overflow-hidden group/btn"
              >
                {/* Progress Bar Bakgrund */}
                <div
                  className={cn("absolute top-0 left-0 h-full transition-all duration-500 ease-out", barColor)}
                  style={{ width: `${percentage}%` }}
                />
                
                {/* Text Innehåll */}
                <div className="relative z-10 flex items-center justify-between px-3 h-full text-sm font-medium">
                  <span className="text-muted-foreground group-hover/btn:text-foreground transition-colors">
                    {outcome.name}
                  </span>
                  <span className={textColor}>
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
