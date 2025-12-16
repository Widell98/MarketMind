import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Filter, Download, RefreshCw } from 'lucide-react';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import HoldingsTable from './HoldingsTable';
import AddHoldingDialog from './AddHoldingDialog';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

// Hjälpfunktion för att avgöra om marknaden är öppen
// Detta säkerställer att vi använder samma logik över hela appen
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

  // Standard fallback
  return currentMinutes >= swedenOpen && currentMinutes <= endOfDay;
};

type SortBy = 'name' | 'marketValue' | 'performance' | 'dailyChange' | 'share';
type SortOrder = 'asc' | 'desc';

const UserHoldingsManager = () => {
  const { actualHoldings, loading, refetch } = useUserHoldings();
  const { performance, holdingsPerformance, updatePrices, updating } = usePortfolioPerformance();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('marketValue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [refreshingTicker, setRefreshingTicker] = useState<string | null>(null);
  const { toast } = useToast();

  // Mappa holdingPerformance till en map för snabb uppslagning
  const holdingPerformanceMap = useMemo(() => {
    const map: Record<string, any> = {};
    holdingsPerformance.forEach(h => {
      map[h.id] = h;
    });
    return map;
  }, [holdingsPerformance]);

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc'); // Default till desc för nya kolumner
    }
  };

  const handleRefreshPrice = async (ticker: string) => {
    setRefreshingTicker(ticker);
    try {
      await updatePrices(ticker);
      await refetch();
    } catch (error) {
      console.error("Failed to refresh price:", error);
    } finally {
      setRefreshingTicker(null);
    }
  };

  const filteredHoldings = useMemo(() => {
    if (!actualHoldings) return [];
    
    return actualHoldings.filter(holding => {
      const searchLower = searchQuery.toLowerCase();
      return (
        holding.name.toLowerCase().includes(searchLower) ||
        (holding.symbol && holding.symbol.toLowerCase().includes(searchLower))
      );
    });
  }, [actualHoldings, searchQuery]);

  const sortedHoldings = useMemo(() => {
    return [...filteredHoldings].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortBy) {
        case 'name':
          valA = a.name;
          valB = b.name;
          return sortOrder === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
            
        case 'marketValue':
          const perfA_MV = holdingPerformanceMap[a.id];
          const perfB_MV = holdingPerformanceMap[b.id];
          valA = perfA_MV ? perfA_MV.currentValue : (a.current_value || 0);
          valB = perfB_MV ? perfB_MV.currentValue : (b.current_value || 0);
          break;
          
        case 'performance':
          const perfA = holdingPerformanceMap[a.id];
          const perfB = holdingPerformanceMap[b.id];
          valA = perfA ? perfA.profitPercentage : 0;
          valB = perfB ? perfB.profitPercentage : 0;
          break;
          
        case 'dailyChange':
          // SPECIALHANTERING: Sortera stängda marknader sist
          const currencyA = a.price_currency || a.currency || 'SEK';
          const currencyB = b.price_currency || b.currency || 'SEK';
          const isOpenA = isMarketOpen(currencyA, a.holding_type);
          const isOpenB = isMarketOpen(currencyB, b.holding_type);

          // Om ena är stängd och andra öppen, prioritera den öppna
          if (!isOpenA && isOpenB) return 1; // A stängd -> A sist
          if (isOpenA && !isOpenB) return -1; // B stängd -> B sist
          
          // Om båda är stängda, sortera på namn för stabilitet
          if (!isOpenA && !isOpenB) return a.name.localeCompare(b.name);

          // Om båda är öppna, sortera på värdet
          valA = a.dailyChangePercent ?? 0;
          valB = b.dailyChangePercent ?? 0;
          break;

        case 'share':
          const totalVal = performance.totalPortfolioValue || 1;
          const perfA_S = holdingPerformanceMap[a.id];
          const perfB_S = holdingPerformanceMap[b.id];
          const valA_SEK = perfA_S ? perfA_S.currentValue : (a.current_value || 0);
          const valB_SEK = perfB_S ? perfB_S.currentValue : (b.current_value || 0);
          valA = (valA_SEK / totalVal) * 100;
          valB = (valB_SEK / totalVal) * 100;
          break;
          
        default:
          return 0;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      
      return 0;
    });
  }, [filteredHoldings, sortBy, sortOrder, holdingPerformanceMap, performance.totalPortfolioValue]);

  const totalFilteredValue = useMemo(() => {
    return sortedHoldings.reduce((sum, holding) => {
      const perf = holdingPerformanceMap[holding.id];
      return sum + (perf ? perf.currentValue : (holding.current_value || 0));
    }, 0);
  }, [sortedHoldings, holdingPerformanceMap]);

  return (
    <Card className="w-full border-border/60 shadow-sm overflow-hidden bg-card">
      <CardHeader className="pb-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">Dina Innehav</CardTitle>
            <CardDescription className="mt-1">
              Hantera och följ dina aktier och fonder
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsAddDialogOpen(true)} 
              className="bg-primary hover:bg-primary/90 text-white shadow-sm"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Lägg till innehav
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök på namn eller symbol..."
              className="pl-9 bg-background/50 border-input/60"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 px-3 border-input/60 bg-background/50">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  Filtrera
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Sortera efter</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSort('marketValue')}>
                  Marknadsvärde
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('performance')}>
                  Total avkastning
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('dailyChange')}>
                  Utveckling idag
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('name')}>
                  Namn (A-Ö)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" title="Exportera till CSV">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Laddar innehav...
            </div>
          ) : sortedHoldings.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="bg-muted/30 p-4 rounded-full mb-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground">Inga innehav hittades</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                {searchQuery 
                  ? `Inga resultat matchade "${searchQuery}"` 
                  : "Din portfölj är tom. Lägg till ditt första innehav för att komma igång."}
              </p>
              {!searchQuery && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  Lägg till nu
                </Button>
              )}
            </div>
          ) : (
            <HoldingsTable 
              holdings={sortedHoldings}
              holdingPerformanceMap={holdingPerformanceMap}
              totalPortfolioValue={performance.totalPortfolioValue}
              onRefreshPrice={handleRefreshPrice}
              isUpdatingPrice={updating}
              refreshingTicker={refreshingTicker}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}
        </div>
      </CardContent>

      {/* Footer summary */}
      {sortedHoldings.length > 0 && (
        <div className="bg-muted/20 border-t border-border/40 p-3 px-4 sm:px-6 flex justify-between items-center text-xs sm:text-sm text-muted-foreground">
          <span>{sortedHoldings.length} innehav</span>
          <span>Totalt: {Math.round(totalFilteredValue).toLocaleString('sv-SE')} kr</span>
        </div>
      )}

      {/* Dialoger */}
      <AddHoldingDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
      />
    </Card>
  );
};

export default UserHoldingsManager;
