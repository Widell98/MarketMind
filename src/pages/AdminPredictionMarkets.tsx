import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePolymarketMarkets } from "@/hooks/usePolymarket";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AdminPredictionMarkets = () => {
  // --- SÄKERHETSKONTROLL (Matchar AdminStockCases exakt) ---
  const { user, loading: authLoading } = useAuth(); // Vänta även på auth-loading
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Vänta tills både Auth och Roll-checken är helt klara
    if (!authLoading && !roleLoading) {
      // Om användaren är inloggad men INTE admin -> Kasta ut
      if (user && !isAdmin) {
        toast({
          title: "Åtkomst nekad",
          description: "Du har inte behörighet att komma åt den här sidan",
          variant: "destructive",
        });
        navigate('/');
      }
    }
  }, [authLoading, roleLoading, user, isAdmin, navigate, toast]);
  // -----------------------------------------------------

  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Debounce-logik
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Hämta marknader (API)
  const { data: apiMarkets, isLoading: apiLoading } = usePolymarketMarkets({
    limit: 50,
    order: debouncedSearch ? undefined : "volume24hr",
    ascending: false,
    search: debouncedSearch || undefined,
    active: true,
    closed: false
  });

  // Hämta valda (DB) - Körs bara om vi vet att vi är admin
  const { data: curatedMarkets, isLoading: dbLoading } = useQuery({
    queryKey: ["curated-markets-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("curated_markets")
        .select("market_id, is_active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!isAdmin // Viktigt: Hämta inte data förrän vi vet att vi är admin
  });

  const toggleMarketMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
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
      queryClient.invalidateQueries({ queryKey: ["curated-markets-public"] });
    },
  });

  const isCurated = (marketId: string) => {
    return curatedMarkets?.some(m => m.market_id === marketId && m.is_active);
  };

  const displayedMarkets = activeTab === "curated" 
    ? apiMarkets?.filter(m => isCurated(m.id)) 
    : apiMarkets;

  // --- RENDERING AV LADDNING / SÄKERHET ---

  // 1. Visar laddning medan vi kollar vem du är
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Kontrollerar behörigheter...</p>
        </div>
      </div>
    );
  }

  // 2. Om du inte är inloggad -> Visa "Åtkomst nekad" (samma design som AdminStockCases)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Åtkomst nekad</h2>
            <p className="text-gray-600 mb-4">
              Du måste vara inloggad för att komma åt denna sida.
            </p>
            <Button onClick={() => navigate('/')}>
              Tillbaka till startsidan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Om du är inloggad men inte admin -> Visa "Åtkomst nekad"
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Åtkomst nekad</h2>
            <p className="text-gray-600 mb-4">
              Du har inte administratörsbehörighet för att komma åt denna sida.
            </p>
            <Button onClick={() => navigate('/')}>
              Tillbaka till startsidan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 4. Admin-vyn (Visas bara om allt ovan passerats)
  if (apiLoading && !debouncedSearch) {
    return <Layout><div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-6xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">Admin</Badge>
                <h1 className="text-2xl font-bold">Marknadshantering</h1>
            </div>
            <p className="text-muted-foreground text-sm">Sök och välj vilka marknader som ska synas utåt.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Sök globalt (t.ex. 'Trump', 'Rate')..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">Sökresultat</TabsTrigger>
            <TabsTrigger value="curated" className="gap-2">
              Valda Marknader
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
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  <p>Inga marknader hittades för "{debouncedSearch}"</p>
                  <p className="text-xs mt-2 opacity-70">Prova att söka på engelska termer som "Bitcoin", "Fed", "Election".</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="curated" className="mt-6">
             <div className="text-sm text-muted-foreground mb-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded border border-blue-100 dark:border-blue-900">
               Obs: Denna lista visar de marknader du valt <strong>som också matchar din nuvarande sökning</strong> ovan. Rensa sökfältet för att se alla valda.
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
                  <div className="text-center py-12 text-muted-foreground">
                    Inga valda marknader matchar sökningen.
                  </div>
                )}
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

const MarketAdminCard = ({ market, isActive, onToggle }: { market: any, isActive: boolean, onToggle: (c: boolean) => void }) => (
  <Card className={`flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4 transition-all duration-200 ${isActive ? 'border-green-500/50 bg-green-500/5 shadow-sm' : 'hover:bg-accent/50'}`}>
    <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden bg-muted relative group">
      {market.imageUrl ? (
        <img src={market.imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-xs bg-secondary">PM</div>
      )}
    </div>
    
    <div className="flex-grow min-w-0">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-base truncate pr-4 text-foreground/90">{market.question}</h3>
        {isActive && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />}
      </div>
      
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          <span>${Number(market.volume || market.volumeNum || 0).toLocaleString()}</span>
        </div>
        {market.endDate && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(market.endDate).toLocaleDateString('sv-SE')}</span>
          </div>
        )}
        <span className="font-mono text-[10px] opacity-40 pt-0.5 select-all">#{market.id.substring(0, 8)}...</span>
      </div>
    </div>

    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
      <span className={`text-sm font-medium ${isActive ? "text-green-600" : "text-muted-foreground"}`}>
        {isActive ? "Publicerad" : "Dold"}
      </span>
      <Switch
        checked={isActive}
        onCheckedChange={onToggle}
      />
    </div>
  </Card>
);

export default AdminPredictionMarkets;
