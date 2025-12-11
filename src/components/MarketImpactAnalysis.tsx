import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Ny import
import { TrendingUp, TrendingDown, Loader2, Sparkles, Building2, AlertTriangle, MessageSquarePlus, ArrowRight } from "lucide-react"; // Nya ikoner
import type { PolymarketMarketDetail } from "@/types/polymarket";
import { useNavigate } from "react-router-dom"; // Ny import

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
  const navigate = useNavigate(); // Hook för navigering

  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['market-impact', market?.id],
    queryFn: async () => {
      if (!market) return null;
      
      const { data, error } = await supabase.functions.invoke('analyze-prediction-impact', {
        body: {
          question: market.question,
          description: market.description,
          marketId: market.id 
        }
      });

      if (error) throw error;
      return data as ImpactAnalysisData;
    },
    enabled: !!market && !!market.question,
    staleTime: 1000 * 60 * 60 * 24, 
  });

  if (!market) return null;

  // Hantera klick på "Diskutera"-knappen
  const handleDiscuss = () => {
    // Skapa en start-prompt för chatten
    const initialPrompt = `Jag vill diskutera prediktionsmarknaden: "${market.question}".\n\nBeskrivning: ${market.description || 'Ingen beskrivning tillgänglig.'}\n\nVad anser du om oddsen och hur ser du på det sannolika utfallet?`;

    navigate('/ai-chat', {
      state: {
        initialMessage: initialPrompt, // Meddelandet som skickas till AI:n
        sessionName: market.question   // Namnet på den nya chatten
      }
    });
  };

  const hasPositive = analysis?.positive && analysis.positive.length > 0;
  const hasNegative = analysis?.negative && analysis.negative.length > 0;
  const hasAnyStocks = hasPositive || hasNegative;

  return (
    <Card className="h-full border border-border shadow-sm overflow-hidden bg-gradient-to-b from-card to-secondary/10 flex flex-col">
      <CardHeader className="pb-3 border-b border-border/50 bg-secondary/20">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 font-medium">
          <div className="p-1.5 bg-yellow-500/10 rounded-md">
            <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          AI-Analys: Marknadseffekt
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-5 px-4 sm:px-6 flex-grow">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
            </div>
            <p className="text-sm font-medium animate-pulse">Analyserar marknadsscenarion...</p>
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 text-sm text-destructive p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Analys misslyckades</p>
              <p className="opacity-80 mt-1">Kunde inte generera en analys just nu. Försök igen senare.</p>
            </div>
          </div>
        ) : analysis ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Sammanfattning */}
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
              <p className="text-sm text-foreground/80 leading-relaxed italic">
                "{analysis.summary}"
              </p>
            </div>

            {/* Aktie-listor (Visas bara om det finns data) */}
            {hasAnyStocks && (
              <div className={`grid gap-6 ${hasPositive && hasNegative ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                
                {hasPositive && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-green-200/30 dark:border-green-900/30">
                      <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-semibold text-sm text-green-700 dark:text-green-400">Positiv påverkan</span>
                    </div>
                    <div className="space-y-2">
                      {analysis.positive.map((item, idx) => (
                        <ImpactCard key={idx} item={item} type="positive" />
                      ))}
                    </div>
                  </div>
                )}

                {hasNegative && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-red-200/30 dark:border-red-900/30">
                      <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="font-semibold text-sm text-red-700 dark:text-red-400">Negativ påverkan</span>
                    </div>
                    <div className="space-y-2">
                      {analysis.negative.map((item, idx) => (
                        <ImpactCard key={idx} item={item} type="negative" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-center pt-2">
              <Badge variant="outline" className="text-[10px] text-muted-foreground bg-background/50 opacity-60 font-normal border-dashed">
                Genererat av MarketMind AI • Ej finansiell rådgivning
              </Badge>
            </div>
          </div>
        ) : null}
      </CardContent>

      {/* --- NY KNAPP HÄR --- */}
      <div className="p-4 bg-secondary/30 border-t border-border/50">
        <Button 
          onClick={handleDiscuss} 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md group"
        >
          <MessageSquarePlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
          Diskutera caset med AI
          <ArrowRight className="w-4 h-4 ml-auto opacity-70 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  );
};

// Hjälpkomponent (oförändrad men inkluderad för helhet)
const ImpactCard = ({ item, type }: { item: ImpactItem, type: 'positive' | 'negative' }) => {
  const isPositive = type === 'positive';
  
  return (
    <div className={`
      group flex flex-col p-3 rounded-lg border transition-all duration-200 hover:shadow-sm
      ${isPositive 
        ? 'bg-green-50/50 dark:bg-green-950/10 border-green-100 dark:border-green-900/30 hover:border-green-200 dark:hover:border-green-800' 
        : 'bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30 hover:border-red-200 dark:hover:border-red-800'
      }
    `}>
      <div className="flex justify-between items-start gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {!item.ticker && <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />}
          <span className="font-semibold text-sm truncate text-foreground/90">{item.name}</span>
        </div>
        {item.ticker && (
          <Badge 
            variant="secondary" 
            className={`
              text-[10px] h-5 px-1.5 font-mono tracking-wide shrink-0
              ${isPositive 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              }
            `}
          >
            {item.ticker}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-snug group-hover:text-foreground/80 transition-colors">
        {item.reason}
      </p>
    </div>
  );
};
