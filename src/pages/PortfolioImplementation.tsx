import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import PortfolioOverview from '@/components/PortfolioOverview';
import BestWorstHoldings from '@/components/BestWorstHoldings';
import UserHoldingsManager from '@/components/UserHoldingsManager';
import CashHoldingsManager from '@/components/CashHoldingsManager';
import PortfolioValueCards from '@/components/PortfolioValueCards';
import PortfolioHealthScore from '@/components/PortfolioHealthScore';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useDailyChangeData } from '@/hooks/useDailyChangeData'; // Lägg till denna import
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, BarChart3, PieChart, LineChart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InteractivePortfolio from '@/components/InteractivePortfolio';
import { resolveHoldingValue } from '@/utils/currencyUtils';

// Hjälpfunktion för att avgöra om marknaden är öppen (Samma som i Index.tsx/HoldingsTable)
const isMarketOpen = (currency?: string, holdingType?: string): boolean => {
  const type = holdingType?.toLowerCase();
  if (type === 'crypto' || type === 'cryptocurrency' || type === 'certificate') return true;

  const normalizedCurrency = currency?.toUpperCase() || 'SEK';
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const currentMinutes = hour * 60 + minute;

  const swedenOpen = 9 * 60;        // 09:00
  const usOpen = 15 * 60 + 30;      // 15:30
  const endOfDay = 23 * 60 + 59;    // 23:59

  if (normalizedCurrency === 'USD') return currentMinutes >= usOpen && currentMinutes <= endOfDay;
  if (['SEK', 'EUR', 'DKK', 'NOK'].includes(normalizedCurrency)) return currentMinutes >= swedenOpen && currentMinutes <= endOfDay;

  return currentMinutes >= swedenOpen && currentMinutes <= endOfDay;
};

const PortfolioImplementation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activePortfolio, loading: portfolioLoading } = usePortfolio();
  const { 
    performance, 
    holdingsPerformance, 
    loading: performanceLoading, 
    updateAllPrices, 
    updating 
  } = usePortfolioPerformance();
  const { totalCash, loading: cashLoading } = useCashHoldings();
  const { actualHoldings } = useUserHoldings();
  const { getChangeForTicker } = useDailyChangeData(); // Använd daily data hook

  // Beräkna en "justerad" dagsutveckling där stängda marknader räknas som 0%
  const adjustedDayChange = React.useMemo(() => {
    if (!actualHoldings || actualHoldings.length === 0 || !performance.totalPortfolioValue) {
      return { percentage: 0, value: 0 };
    }

    let totalWeightedChange = 0;
    let totalSecuritiesValue = 0;

    actualHoldings.forEach(holding => {
      if (holding.holding_type === 'recommendation') return;

      const { valueInSEK: holdingValue } = resolveHoldingValue(holding);
      if (holdingValue <= 0) return;

      // Kontrollera om marknaden är öppen
      const currency = holding.currency || holding.price_currency;
      const isOpen = isMarketOpen(currency, holding.holding_type);

      let changePercent = 0;
      if (isOpen) {
        // Försök hämta dagsförändring från hook eller fallback till performance-objektet om det finns
        const fetchedChange = getChangeForTicker(holding.symbol);
        if (fetchedChange !== null && !isNaN(fetchedChange)) {
          changePercent = fetchedChange;
        } else {
          // Fallback till existerande performance-data om available och marknaden är öppen
          const perf = holdingsPerformance.find(h => h.id === holding.id);
          if (perf) changePercent = perf.dayChangePercentage;
        }
      }
      // Om stängd, räkna changePercent som 0

      const weight = holdingValue / performance.totalPortfolioValue;
      totalWeightedChange += weight * changePercent;
      totalSecuritiesValue += holdingValue;
    });

    // Om inga innehav har öppen marknad, blir totalen 0 (vilket är korrekt)
    // Beräkna värdeförändring i kronor baserat på totalt värde
    const changeValue = (totalSecuritiesValue * totalWeightedChange) / 100;

    return {
      percentage: totalWeightedChange,
      value: changeValue
    };
  }, [actualHoldings, performance.totalPortfolioValue, holdingsPerformance, getChangeForTicker]);

  // Skapa ett override-objekt för performance med våra justerade siffror
  const displayPerformance = {
    ...performance,
    dayChangePercentage: adjustedDayChange.percentage,
    dayChange: adjustedDayChange.value
  };

  const handleUpdatePrices = async () => {
    try {
      const result = await updateAllPrices();
      if (result) {
        toast({
          title: "Priser uppdaterade",
          description: `${result.updated} innehav uppdaterades.`,
        });
      }
    } catch (error) {
      toast({
        title: "Kunde inte uppdatera priser",
        description: "Ett fel uppstod vid uppdatering av priser.",
        variant: "destructive",
      });
    }
  };

  if (portfolioLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-0 hover:bg-transparent" 
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Tillbaka
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Min Portfölj</h1>
            <p className="text-muted-foreground">
              Detaljerad översikt och analys av dina innehav
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleUpdatePrices}
              disabled={updating}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
              {updating ? 'Uppdaterar...' : 'Uppdatera priser'}
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        {/* Använd displayPerformance här för att visa 0% om marknaden är stängd */}
        <PortfolioOverview performance={displayPerformance} />

        {/* Charts & Interactive View */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4 space-y-6">
            <InteractivePortfolio />
          </div>
          <div className="lg:col-span-3 space-y-6">
            <PortfolioHealthScore />
            <PortfolioValueCards performance={displayPerformance} />
          </div>
        </div>

        {/* Holdings Management */}
        <Tabs defaultValue="holdings" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="holdings" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Innehav
              </TabsTrigger>
              <TabsTrigger value="cash" className="gap-2">
                <PieChart className="h-4 w-4" />
                Likvida medel
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-2">
                <LineChart className="h-4 w-4" />
                Analys
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="holdings" className="space-y-6">
            {/* Best/Worst Holdings - Visar alltid total avkastning (ingen tidsspärr) */}
            <BestWorstHoldings />
            
            {/* User Holdings Manager - Innehåller tabellen som nu döljer dagsutveckling vid stängd marknad */}
            <UserHoldingsManager />
          </TabsContent>

          <TabsContent value="cash">
            <CashHoldingsManager />
          </TabsContent>

          <TabsContent value="analysis">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Analysis components placeholder */}
              <div className="p-8 border border-dashed rounded-xl text-center text-muted-foreground">
                Analysverktyg kommer snart
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default PortfolioImplementation;
