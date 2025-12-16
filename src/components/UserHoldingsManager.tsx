import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, Filter, Download, Trash2, Edit, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useUserHoldings, type UserHolding } from '@/hooks/useUserHoldings';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AddHoldingDialog from './AddHoldingDialog';
import EditHoldingDialog from './EditHoldingDialog';
import HoldingsTable from './HoldingsTable';
import { useCashHoldings } from '@/hooks/useCashHoldings';

// Hjälpfunktion för att avgöra om marknaden är öppen
// Denna används för sorteringen av "Utveckling idag"
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

type SortBy = 'name' | 'marketValue' | 'performance' | 'dailyChange' | 'share';
type SortOrder = 'asc' | 'desc';

const UserHoldingsManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { actualHoldings, loading, refetch: refetchHoldings } = useUserHoldings();
  const { performance, holdingsPerformance, updatePrices, updating, refetch: refetchPerformance } = usePortfolioPerformance();
  const { totalCash, addCash, withdrawCash, updateCash, loading: cashLoading } = useCashHoldings();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('marketValue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Dialog states
  const [isAddHoldingDialogOpen, setIsAddHoldingDialogOpen] = useState(false);
  const [showEditHoldingDialog, setShowEditHoldingDialog] = useState(false);
  const [editingHolding, setEditingHolding] = useState<UserHolding | null>(null);
  const [addHoldingInitialData, setAddHoldingInitialData] = useState<{ symbol: string; name: string } | null>(null);
  
  // Cash dialog states
  const [isCashDialogOpen, setIsCashDialogOpen] = useState(false);
  const [cashAction, setCashAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [cashAmount, setCashAmount] = useState('');
  const [editingCash, setEditingCash] = useState<{ id: string, amount: number } | null>(null);

  const [refreshingTicker, setRefreshingTicker] = useState<string | null>(null);

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
      setSortOrder('desc');
    }
  };

  const handleRefreshPrice = async (ticker: string) => {
    setRefreshingTicker(ticker);
    try {
      await updatePrices(ticker);
      await refetchHoldings();
      await refetchPerformance();
      toast({
        title: "Pris uppdaterat",
        description: `Priset för ${ticker} har uppdaterats.`,
      });
    } catch (error) {
      console.error("Failed to refresh price:", error);
      toast({
        title: "Kunde inte uppdatera pris",
        description: "Ett fel uppstod vid hämtning av marknadsdata.",
        variant: "destructive",
      });
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
          // SPECIALHANTERING FÖR DAGSUTVECKLING
          // Vi använder isMarketOpen för att avgöra om värdet är relevant just nu
          const currencyA = a.price_currency || a.currency || 'SEK';
          const currencyB = b.price_currency || b.currency || 'SEK';
          const isOpenA = isMarketOpen(currencyA, a.holding_type);
          const isOpenB = isMarketOpen(currencyB, b.holding_type);

          // Om ena är stängd och andra öppen, prioritera den öppna (visa den först om man sorterar)
          // Om man sorterar fallande (bäst först), vill vi ha öppna marknader högst upp
          // Om man sorterar stigande (sämst först), vill vi också ha öppna marknader högst upp (de relevanta)
          // Eller så lägger vi alltid stängda marknader sist för renare lista.
          
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

  // Handlers för dialoger och actions
  const handleAddHolding = async (holdingData: any) => {
    try {
      // Implementera logik för att lägga till innehav via useUserHoldings eller direkt anrop
      // Detta beror på hur AddHoldingDialog kommunicerar
      await refetchHoldings();
      setIsAddHoldingDialogOpen(false);
      setAddHoldingInitialData(null);
      toast({
        title: "Innehav tillagt",
        description: "Ditt nya innehav har lagts till i portföljen.",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte lägga till innehav.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateHolding = async (holdingData: any) => {
    if (!editingHolding) return;
    // Implementera uppdateringslogik här
    setShowEditHoldingDialog(false);
    setEditingHolding(null);
    await refetchHoldings();
  };

  const handleCloseAddHoldingDialog = () => {
    setIsAddHoldingDialogOpen(false);
    setAddHoldingInitialData(null);
  };

  const handleCashSubmit = async () => {
    const amount = parseFloat(cashAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Ogiltigt belopp",
        description: "Vänligen ange ett giltigt belopp.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (cashAction === 'deposit') {
        await addCash(amount);
        toast({ title: "Insättning klar", description: `${amount} kr har satts in.` });
      } else {
        await withdrawCash(amount);
        toast({ title: "Uttag klart", description: `${amount} kr har tagits ut.` });
      }
      setIsCashDialogOpen(false);
      setCashAmount('');
    } catch (error) {
      toast({
        title: "Fel vid transaktion",
        description: "Kunde inte genomföra transaktionen.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCash = async () => {
    if (!editingCash) return;
    try {
        await updateCash(editingCash.id, editingCash.amount);
        setEditingCash(null);
        toast({
            title: "Kassa uppdaterad",
            description: "Ditt kassainnehav har uppdaterats.",
        });
    } catch (error) {
        toast({
            title: "Fel",
            description: "Kunde inte uppdatera kassan.",
            variant: "destructive",
        });
    }
  };

  return (
    <Card className="w-full border-border/60 shadow-sm overflow-hidden bg-card">
      <CardHeader className="pb-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">Dina Innehav</CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>Totalt värde: {performance.totalPortfolioValue?.toLocaleString('sv-SE')} kr</span>
              <span>•</span>
              <span>Kassa: {totalCash?.toLocaleString('sv-SE')} kr</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsCashDialogOpen(true)}
            >
              Hantera kassa
            </Button>
            <Button 
              onClick={() => setIsAddHoldingDialogOpen(true)} 
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
                  onClick={() => setIsAddHoldingDialogOpen(true)}
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
          {/* Här kan man lägga till paginering om det behövs i framtiden */}
        </div>
      )}

      {/* Cash Management Dialog */}
      <Dialog open={isCashDialogOpen} onOpenChange={setIsCashDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hantera kassa</DialogTitle>
            <DialogDescription>
              Sätt in eller ta ut likvida medel från din portfölj.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex gap-2">
              <Button 
                variant={cashAction === 'deposit' ? 'default' : 'outline'} 
                className="flex-1"
                onClick={() => setCashAction('deposit')}
              >
                Insättning
              </Button>
              <Button 
                variant={cashAction === 'withdraw' ? 'default' : 'outline'} 
                className="flex-1"
                onClick={() => setCashAction('withdraw')}
              >
                Uttag
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Belopp (SEK)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCashDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCashSubmit} disabled={cashLoading}>
              {cashAction === 'deposit' ? 'Sätt in' : 'Ta ut'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Cash Dialog (Direct Edit) */}
      <Dialog open={editingCash !== null} onOpenChange={(open) => !open && setEditingCash(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera kassainnehav</DialogTitle>
            <DialogDescription>
              Uppdatera beloppet för kassainnehavet manuellt.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-amount">Belopp (SEK)</Label>
            <Input
              id="edit-amount"
              type="number"
              value={editingCash?.amount || 0}
              onChange={(e) => setEditingCash(prev => 
                prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null
              )}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCash(null)}>
              Avbryt
            </Button>
            <Button onClick={handleUpdateCash}>
              Uppdatera
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Holding Dialog */}
      <AddHoldingDialog
        isOpen={isAddHoldingDialogOpen}
        onClose={handleCloseAddHoldingDialog}
        onAdd={handleAddHolding}
        initialData={addHoldingInitialData}
      />

      {/* Edit Holding Dialog */}
      <EditHoldingDialog
        isOpen={showEditHoldingDialog}
        onClose={() => {
          setShowEditHoldingDialog(false);
          setEditingHolding(null);
        }}
        onSave={handleUpdateHolding}
        holding={editingHolding}
      />
    </Card>
  );
};

export default UserHoldingsManager;
