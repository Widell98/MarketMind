import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Loader2, Sparkles } from "lucide-react";
import type { PolymarketMarketDetail } from "@/types/polymarket";

interface ImpactItem {
  name: string;
  ticker?: string;
  reason: string;
}

interface ImpactAnalysisData {
  summary: string;
  positive: ImpactItem[];
  negative: ImpactItem[];
}

export const MarketImpactAnalysis = ({ market }: { market: PolymarketMarketDetail | null }) => {
  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['market-impact', market?.id], // Använder redan ID här, bra!
    queryFn: async () => {
      if (!market) return null;
      
      const { data, error } = await supabase.functions.invoke('analyze-prediction-impact', {
        body: {
          question: market.question,
          description: market.description,
          marketId: market.id // <-- NYTT: Vi skickar med ID för cachning
        }
      });

      if (error) throw error;
      return data as ImpactAnalysisData;
    },
    enabled: !!market && !!market.question,
    staleTime: 1000 * 60 * 60 * 24, // Spara cachen i 24h för att spara pengar/tokens
  });

  if (!market) return null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
          Marknadseffekt av scenario
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">AI analyserar marknadseffekter...</p>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 p-4 bg-red-500/10 rounded-md">
            Kunde inte generera analys just nu.
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary/20 pl-3">
              "{analysis.summary}"
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vinnare */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-500 font-medium text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>Positiv påverkan</span>
                </div>
                {analysis.positive.map((item, idx) => (
                  <div key={idx} className="bg-green-500/5 border border-green-500/10 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm">{item.name}</span>
                      {item.ticker && (
                        <Badge variant="outline" className="text-[10px] h-5 bg-background/50">
                          {item.ticker}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {item.reason}
                    </p>
                  </div>
                ))}
              </div>

              {/* Förlorare */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-500 font-medium text-sm">
                  <TrendingDown className="h-4 w-4" />
                  <span>Negativ påverkan</span>
                </div>
                {analysis.negative.map((item, idx) => (
                  <div key={idx} className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm">{item.name}</span>
                      {item.ticker && (
                        <Badge variant="outline" className="text-[10px] h-5 bg-background/50">
                          {item.ticker}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-[10px] text-muted-foreground text-center pt-2 opacity-50">
              Genererat av MarketMind AI (GPT-4o-mini). Ej finansiell rådgivning.
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
