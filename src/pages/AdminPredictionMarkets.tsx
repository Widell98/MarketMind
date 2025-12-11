import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePolymarketMarkets } from "@/hooks/usePolymarket";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const AdminPredictionMarkets = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Hämta "kandidater" - marknader från Polymarket API
  const { data: apiMarkets, isLoading: apiLoading } = usePolymarketMarkets({
    limit: 50,
    order: "volume24hr", // Visa de med mest volym först så du hittar relevanta
    search: searchTerm
  });

  // 2. Hämta dina sparade val från Supabase
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

  // Mutation för att spara/uppdatera val
  const toggleMarketMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      // Om den ska vara aktiv, upsert. Om inaktiv, delete (eller sätt is_active=false)
      if (isActive) {
        const { error } = await supabase
          .from("curated_markets")
          .upsert({ market_id: id, is_active: true }, { onConflict: "market_id" });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("curated_markets")
          .delete()
          .eq("market_id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curated-markets-admin"] });
      // Invalidera även frontend-vyn så användarna ser ändringen direkt
      queryClient.invalidateQueries({ queryKey: ["curated-markets-public"] });
    },
  });

  // Hjälpfunktion för att kolla status
  const isCurated = (marketId: string) => {
    return curatedMarkets?.some(m => m.market_id === marketId && m.is_active);
  };

  if (apiLoading || dbLoading) {
    return <Layout><div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Hantera Prediction Markets</h1>
          <div className="flex gap-2">
            <Input 
              placeholder="Sök marknad..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Button variant="outline"><Search className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="grid gap-4">
          {apiMarkets?.map((market) => {
            const isActive = isCurated(market.id);
            return (
              <Card key={market.id} className={`flex flex-row items-center p-4 gap-4 ${isActive ? 'border-green-500 bg-green-50/10' : ''}`}>
                <div className="w-16 h-16 shrink-0">
                  {market.imageUrl && <img src={market.imageUrl} className="w-full h-full object-cover rounded" />}
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg">{market.question}</h3>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">Volym: ${market.volume.toLocaleString()}</Badge>
                    <span>ID: {market.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={isActive ? "text-green-600 font-bold" : "text-muted-foreground"}>
                    {isActive ? "Visas på sidan" : "Dold"}
                  </span>
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) => 
                      toggleMarketMutation.mutate({ id: market.id, isActive: checked })
                    }
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default AdminPredictionMarkets;
