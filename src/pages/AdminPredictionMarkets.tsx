import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePolymarketMarkets } from "@/hooks/usePolymarket";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminPredictionMarkets = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // 1. Debounce-logik: Vänta 500ms efter att du slutat skriva innan sökningen körs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 2. Hämta marknader från Polymarket API (Söker globalt)
  const { data: apiMarkets, isLoading: apiLoading } = usePolymarketMarkets({
    limit: 50, // Visa 50 träffar åt gången
    order: debouncedSearch ? undefined : "volume24hr", // Sortera på volym om vi inte söker
    ascending: false,
    search: debouncedSearch || undefined, // Skickar sökningen till API:et
    active: true,   // Sök BARA bland aktiva marknader
    closed: false   // Exkludera stängda marknader
  });

  // 3. Hämta dina sparade (utvalda) marknader från Supabase
  const { data: curatedMarkets, isLoading: dbLoading } = useQuery({
    queryKey: ["curated-markets-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curated_markets")
        .select("market_id, is_active");
      if (error) throw error;
      return data || [];
    },
  });

  // Mutation för att spara/ta bort val
  const toggleMarketMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      if (isActive) {
        // Lägg till i curation
        const { error } = await supabase
          .from("curated_markets")
          .upsert({ market_id: id, is_active: true }, { onConflict: "market_id" });
        if (error) throw error;
      } else {
        // Ta bort från curation
        const { error } = await supabase
          .from("curated_markets")
          .delete()
          .eq("market_id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curated-markets-admin"] });
      queryClient.invalidateQueries({ queryKey: ["curated-markets-public"] });
    },
  });

  // Hjälpfunktion för att se om en marknad är vald
  const isCurated = (marketId: string) => {
    return curatedMarkets?.some(m => m.market_id === marketId && m.is_active);
  };

  // Filtrera listan om vi står i "Valda"-fliken
  const displayedMarkets = activeTab === "curated" 
    ? apiMarkets?.filter(m => isCurated(m.id)) 
    : apiMarkets;

  if (apiLoading && !debouncedSearch) {
    return <Layout><div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-6xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Admin: Marknader</h1>
            <p className="text-muted-foreground text-sm">Välj vilka marknader som ska synas för användarna.</p>
          </div>
          
          {/* Sökfält */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Sök på alla aktiva marknader (t.ex. 'Trump', 'Rate cut')..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">Alla / Sökresultat</TabsTrigger>
            <TabsTrigger value="curated" className="gap-2">
              Valda
              <Badge variant="secondary" className="h-5 px-1.5 min-w-5">
                {curatedMarkets?.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4">
              {apiLoading ? (
                 <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : displayedMarkets && displayedMarkets.length > 0 ? (
                displayedMarkets.map((market) => {
                  const isActive = isCurated(market.id);
                  return (
                    <MarketAdminCard 
                      key={market.id} 
                      market={market} 
                      isActive={isActive || false}
                      onToggle={(checked) => toggleMarketMutation.mutate({ id: market.id, isActive: checked })}
                    />
                  );
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Inga marknader hittades för "{debouncedSearch}"
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="curated" className="mt-6">
             <div className="text-sm text-muted-foreground mb-4">
               Här visas de marknader du valt som också finns med i den aktuella sökningen/listan.
             </div>
             <div className="grid gap-4">
               {displayedMarkets?.filter(m => isCurated(m.id)).map((market) => (
                 <MarketAdminCard 
                   key={market.id} 
                   market={market} 
                   isActive={true}
                   onToggle={(checked) => toggleMarketMutation.mutate({ id: market.id, isActive: checked })}
                 />
               ))}
                {displayedMarkets?.filter(m => isCurated(m.id)).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Sök efter dina valda marknader för att se dem här, eller rensa sökningen.
                  </div>
                )}
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// En mindre komponent för kortet för att hålla koden ren
const MarketAdminCard = ({ market, isActive, onToggle }: { market: any, isActive: boolean, onToggle: (c: boolean) => void }) => (
  <Card className={`flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4 transition-colors ${isActive ? 'border-green-500/50 bg-green-500/5' : 'hover:bg-accent/50'}`}>
    <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden bg-muted">
      {market.imageUrl ? (
        <img src={market.imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">?</div>
      )}
    </div>
    
    <div className="flex-grow min-w-0">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-base truncate pr-4">{market.question}</h3>
        {isActive && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
      </div>
      
      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          <span>${Number(market.volume || 0).toLocaleString()} Vol</span>
        </div>
        {market.endDate && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Slutar {new Date(market.endDate).toLocaleDateString('sv-SE')}</span>
          </div>
        )}
        <span className="font-mono text-[10px] opacity-50 pt-0.5">ID: {market.id}</span>
      </div>
    </div>

    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
      <span className={`text-sm font-medium ${isActive ? "text-green-600" : "text-muted-foreground"}`}>
        {isActive ? "Visas" : "Dold"}
      </span>
      <Switch
        checked={isActive}
        onCheckedChange={onToggle}
      />
    </div>
  </Card>
);

export default AdminPredictionMarkets;
