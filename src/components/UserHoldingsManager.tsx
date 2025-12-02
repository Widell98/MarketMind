
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Package,
  Plus,
  Banknote,
  Search,
  LayoutGrid,
  Table as TableIcon,
  PieChart as PieChartIcon,
  Info,
  MoreHorizontal,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import HoldingsGroupSection from '@/components/HoldingsGroupSection';
import HoldingsTable from '@/components/HoldingsTable';
import AddHoldingDialog from '@/components/AddHoldingDialog';
import EditHoldingDialog from '@/components/EditHoldingDialog';
import SectorAllocationChart from '@/components/SectorAllocationChart';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import type { HoldingPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';
import { useAuth } from '@/contexts/AuthContext';
import { resolveHoldingValue } from '@/utils/currencyUtils';
import { usePersistentDialogOpenState } from '@/hooks/usePersistentDialogOpenState';
import { ADD_HOLDING_DIALOG_STORAGE_KEY } from '@/constants/storageKeys';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface TransformedHolding {
  id: string;
  name: string;
  holding_type: 'stock' | 'fund' | 'crypto' | 'real_estate' | 'bonds' | 'other' | 'recommendation' | 'cash';
  current_value: number;
  currency: string;
  symbol?: string;
  quantity?: number;
  purchase_price?: number;
  sector?: string;
  current_price_per_unit?: number;
  price_currency?: string;
  base_currency?: string;
  original_value?: number;
  original_currency?: string;
}

interface UserHoldingsManagerProps {
  sectorData?: { name: string; value: number; percentage: number }[];
  importControls?: React.ReactNode;
  onImportHoldings?: () => void;
}

const UserHoldingsManager: React.FC<UserHoldingsManagerProps> = ({ sectorData = [], importControls, onImportHoldings }) => {
  const {
    actualHoldings,
    loading,
    deleteHolding,
    recommendations,
    addHolding,
    updateHolding,
    refetch: refetchHoldings
  } = useUserHoldings();
  const { performance, updatePrices, updating, holdingsPerformance } = usePortfolioPerformance();
  const { 
    cashHoldings, 
    totalCash, 
    loading: cashLoading, 
    addCashHolding, 
    updateCashHolding, 
    deleteCashHolding 
  } = useCashHoldings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showAddCashDialog, setShowAddCashDialog] = useState(false);
  const [editingCash, setEditingCash] = useState<{id: string, amount: number} | null>(null);
  const [newCashData, setNewCashData] = useState({
    name: 'Kassa',
    amount: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const {
    isOpen: isAddHoldingDialogOpen,
    open: openAddHoldingDialog,
    close: closeAddHoldingDialog,
  } = usePersistentDialogOpenState(ADD_HOLDING_DIALOG_STORAGE_KEY, 'user-holdings');
  const [showEditHoldingDialog, setShowEditHoldingDialog] = useState(false);
  const [editingHolding, setEditingHolding] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [refreshingTicker, setRefreshingTicker] = useState<string | null>(null);
  const [holdingToDelete, setHoldingToDelete] = useState<{ id: string; name: string; type: 'cash' | 'holding' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const holdingPerformanceMap = useMemo<Record<string, HoldingPerformance>>(() => {
    const map: Record<string, HoldingPerformance> = {};
    holdingsPerformance.forEach(performanceEntry => {
      map[performanceEntry.id] = performanceEntry;
    });
    return map;
  }, [holdingsPerformance]);
  
  const handleDeleteHolding = async (holdingId: string, holdingName: string) => {
    const success = await deleteHolding(holdingId);
    if (success) {
      toast({
        title: 'Innehav raderat',
        description: `${holdingName} har tagits bort.`,
      });
      return true;
    }

    return false;
  };

  const handleDiscussHolding = (holdingName: string, symbol?: string) => {
    const sessionName = `Diskussion: ${holdingName}`;
    const message = `Berätta mer om ${holdingName}${symbol ? ` (${symbol})` : ''}. Vad gör företaget, vilka är deras huvudsakliga affärsområden, och varför skulle det vara en bra investering för min portfölj? Analysera också eventuella risker och möjligheter.`;
    
    navigate('/ai-chatt', {
      state: {
        createNewSession: true,
        sessionName: sessionName,
        initialMessage: message
      }
    });
  };

  const handleAddCash = async () => {
    if (!newCashData.name || !newCashData.amount) return;
    
    const amount = parseFloat(newCashData.amount);
    if (isNaN(amount) || amount <= 0) return;

    const success = await addCashHolding(newCashData.name, amount);
    if (success) {
      setNewCashData({ name: 'Kassa', amount: '' });
      setShowAddCashDialog(false);
    }
  };

  const handleUpdateCash = async () => {
    if (!editingCash) return;
    
    const success = await updateCashHolding(editingCash.id, editingCash.amount);
    if (success) {
      setEditingCash(null);
    }
  };

  const handleDeleteCash = async (id: string) => {
    return deleteCashHolding(id);
  };

  const handleRequestDelete = (id: string, name: string, type: 'cash' | 'holding') => {
    setHoldingToDelete({ id, name, type });
  };

  const handleConfirmDelete = async () => {
    if (!holdingToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const wasDeleted = holdingToDelete.type === 'cash'
        ? await handleDeleteCash(holdingToDelete.id)
        : await handleDeleteHolding(holdingToDelete.id, holdingToDelete.name);

      if (wasDeleted) {
        setHoldingToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (isDeleting) {
      return;
    }

    setHoldingToDelete(null);
  };


  const handleEditHolding = (id: string) => {
    const holding = actualHoldings.find(h => h.id === id);
    if (holding) {
      setEditingHolding(holding);
      setShowEditHoldingDialog(true);
    }
  };

  const handleUpdateHolding = async (holdingData: any) => {
    if (!editingHolding) return false;

    const rawSymbol = typeof holdingData.symbol === 'string'
      ? holdingData.symbol
      : editingHolding.symbol;
    const normalizedSymbol = rawSymbol?.trim().length
      ? rawSymbol.trim().toUpperCase()
      : undefined;

    const payload = {
      ...holdingData,
      ...(typeof holdingData.symbol === 'string'
        ? { symbol: normalizedSymbol }
        : {})
    };

    const success = await updateHolding(editingHolding.id, payload);
    if (success) {
      setShowEditHoldingDialog(false);
      setEditingHolding(null);
      if (normalizedSymbol) {
        void handleUpdateHoldingPrice(normalizedSymbol);
      }
    }
    return success;
  };

  const handleAddHolding = async (holdingData: any) => {
    const success = await addHolding(holdingData);
    if (success) {
      closeAddHoldingDialog();
      const normalizedSymbol = typeof holdingData.symbol === 'string'
        ? holdingData.symbol.trim().toUpperCase()
        : undefined;
      if (normalizedSymbol) {
        void handleUpdateHoldingPrice(normalizedSymbol);
      }
    }
    return success;
  };

  const handleUpdateHoldingPrice = async (symbol?: string) => {
    const normalizedSymbol = symbol?.trim().toUpperCase();
    if (!normalizedSymbol || updating) {
      return;
    }

    setRefreshingTicker(normalizedSymbol);
    try {
      await updatePrices(normalizedSymbol);
      if (typeof refetchHoldings === 'function') {
        await refetchHoldings({ silent: true });
      }
    } finally {
      setRefreshingTicker(null);
    }
  };

  // Prepare holdings data for grouping - fix type issues
  const uniqueCashHoldings = cashHoldings.filter(cash => 
    !actualHoldings.some(holding => holding.id === cash.id)
  );

  // Transform all holdings to match the TransformedHolding interface
  const transformedActualHoldings: TransformedHolding[] = actualHoldings.map(holding => {
    const {
      pricePerUnit,
      priceCurrency,
      valueInSEK,
      quantity,
      valueInOriginalCurrency,
      valueCurrency,
    } = resolveHoldingValue(holding);

    const resolvedQuantity = typeof holding.quantity === 'number' && Number.isFinite(holding.quantity)
      ? holding.quantity
      : quantity;

    return {
      id: holding.id,
      name: holding.name,
      holding_type: holding.holding_type || 'stock',
      current_value: valueInSEK,
      currency: 'SEK',
      symbol: holding.symbol,
      quantity: resolvedQuantity,
      purchase_price: holding.purchase_price,
      sector: holding.sector,
      current_price_per_unit: typeof pricePerUnit === 'number' ? pricePerUnit : undefined,
      price_currency: priceCurrency,
      base_currency: holding.currency || priceCurrency,
      original_value: valueInOriginalCurrency,
      original_currency: valueCurrency,
    };
  });

  const transformedCashHoldings: TransformedHolding[] = uniqueCashHoldings.map(cash => ({
    id: cash.id,
    name: cash.name,
    holding_type: 'cash' as const,
    current_value: cash.current_value,
    currency: 'SEK',
    symbol: undefined,
    quantity: undefined,
    purchase_price: undefined,
    sector: undefined,
    current_price_per_unit: undefined,
    price_currency: 'SEK',
    base_currency: 'SEK',
    original_value: cash.current_value,
    original_currency: 'SEK',
  }));

  const allHoldings = [
    ...transformedActualHoldings,
    ...transformedCashHoldings
  ];

  // Group holdings by type
  const groupHoldings = () => {
    const groups = {
      stocks: allHoldings.filter(h => h.holding_type === 'stock'),
      funds: allHoldings.filter(h => h.holding_type === 'fund'),
      cash: allHoldings.filter(h => h.holding_type === 'cash'),
      other: allHoldings.filter(h => !['stock', 'fund', 'cash'].includes(h.holding_type))
    };

    return Object.entries(groups)
      .filter(([, holdings]) => holdings.length > 0)
      .map(([type, holdings]) => {
        // Fix: Properly sum the current_value of each holding
        const totalValue = holdings.reduce((sum, holding) => {
          return sum + resolveHoldingValue(holding).valueInSEK;
        }, 0);

        const totalPortfolioValue = performance?.totalPortfolioValue || 0;
        const percentage = totalPortfolioValue > 0 ? (totalValue / totalPortfolioValue) * 100 : 0;

        const typeNames = {
          stocks: 'Aktier',
          funds: 'Fonder',
          cash: 'Kassa',
          other: 'Övrigt'
        };

        return {
          key: type,
          title: typeNames[type as keyof typeof typeNames] || 'Övrigt',
          holdings,
          totalValue,
          percentage
        };
      });
  };

  const filteredGroups = groupHoldings().map(group => ({
    ...group,
    holdings: group.holdings.filter(holding =>
      holding.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (holding.symbol && holding.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })).filter(group => group.holdings.length > 0);

  const filteredHoldings = filteredGroups.flatMap(group => group.holdings);

  return (
    <>
      <Card className="h-fit rounded-lg sm:rounded-xl">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <span className="flex items-center gap-2 sm:gap-3">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <span className="text-base sm:text-lg md:text-xl break-words">Dina Innehav</span>
              {allHoldings.length > 0 && (
                <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px] sm:text-xs">
                  {allHoldings.length} st
                </Badge>
              )}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Öppna portföljdiagram"
              className="h-9 w-9 sm:h-10 sm:w-10 text-blue-600"
              onClick={() => setIsChartOpen(true)}
            >
              <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm leading-relaxed">
            {loading || cashLoading
              ? "Laddar dina innehav..."
              : allHoldings.length > 0
                ? "Analysera dina investeringar och kassapositioner i ett kompakt läge."
                : "Lägg till dina befintliga aktier, fonder och kassapositioner för bättre portföljanalys"
            }
          </CardDescription>
          {importControls && (
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
              {importControls}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
          {loading || cashLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Package className="w-4 h-4 animate-pulse" />
                <span>Laddar innehav...</span>
              </div>
            </div>
          ) : allHoldings.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-base sm:text-lg font-medium mb-2 text-foreground">Inga innehav registrerade</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-sm mx-auto px-2">
                Lägg till dina nuvarande aktier, fonder och kassapositioner för att få en komplett bild av din portfölj och bättre AI-rekommendationer.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center px-2">
                <Button className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto" onClick={openAddHoldingDialog}>
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Lägg till innehav
                </Button>
                <Button variant="outline" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto" onClick={() => setShowAddCashDialog(true)}>
                  <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Lägg till kassa
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Action Bar */}
              <TooltipProvider>
                <div className="flex flex-col gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-border">
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm" onClick={openAddHoldingDialog}>
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Lägg till innehav
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            aria-label="Fler åtgärder"
                            className="h-9 w-9 sm:h-10 sm:w-10"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          <DropdownMenuItem onSelect={() => setShowAddCashDialog(true)} className="flex items-center gap-2 text-xs sm:text-sm">
                            <Banknote className="w-4 h-4" />
                            Lägg till kassa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex flex-1 min-w-[240px] flex-wrap items-center justify-end gap-2">
                    <div className="relative flex-1 min-w-[180px] max-w-xs">
                      <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                      <Input
                        placeholder="Sök innehav..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 sm:pl-10 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant={viewMode === 'cards' ? 'default' : 'outline'}
                            onClick={() => setViewMode('cards')}
                            className="h-8 w-8 sm:h-9 sm:w-9"
                            aria-label="Visa kortvy"
                          >
                            <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">Kortvy</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant={viewMode === 'table' ? 'default' : 'outline'}
                            onClick={() => setViewMode('table')}
                            className="h-8 w-8 sm:h-9 sm:w-9"
                            aria-label="Visa tabellvy"
                          >
                            <TableIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">Tabellvy</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Tips om tickeruppdateringar"
                            className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs max-w-xs">
                          Tryck på en ticker i listan för att trigga en prisuppdatering och se den senaste kursen.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </TooltipProvider>

              {viewMode === 'cards' ? (
                <div className="space-y-4">
                  {filteredGroups.map((group) => (
                    <HoldingsGroupSection
                      key={group.key}
                      title={group.title}
                      holdings={group.holdings}
                      totalValue={group.totalValue}
                      groupPercentage={group.percentage}
                      holdingPerformanceMap={holdingPerformanceMap}
                      onDiscuss={handleDiscussHolding}
                      onEdit={group.key === 'cash' ? (id: string) => {
                        const cash = group.holdings.find(h => h.id === id);
                        if (cash) {
                          setEditingCash({ id: cash.id, amount: cash.current_value });
                        }
                      } : handleEditHolding}
                      onDelete={group.key === 'cash'
                        ? (id: string, name: string) => handleRequestDelete(id, name, 'cash')
                        : (id: string, name: string) => handleRequestDelete(id, name, 'holding')}
                      onRefreshPrice={group.key === 'cash' ? undefined : handleUpdateHoldingPrice}
                      isUpdatingPrice={updating}
                      refreshingTicker={refreshingTicker}
                    />
                  ))}
                </div>
              ) : (
                <HoldingsTable
                  holdings={filteredHoldings}
                  onRefreshPrice={handleUpdateHoldingPrice}
                  isUpdatingPrice={updating}
                  refreshingTicker={refreshingTicker}
                  holdingPerformanceMap={holdingPerformanceMap}
                />
              )}

              {allHoldings.length > 0 && (
                <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!holdingToDelete}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelDelete();
          }
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {holdingToDelete?.type === 'cash' ? 'Ta bort kassainnehav' : 'Ta bort innehav'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort {holdingToDelete?.name || 'detta'} {holdingToDelete?.type === 'cash' ? 'kassainnehav' : 'innehav'}? Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete} disabled={isDeleting}>
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Tar bort...' : 'Ta bort'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sector Allocation Dialog */}
      <Dialog open={isChartOpen} onOpenChange={setIsChartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sektorexponering</DialogTitle>
            <DialogDescription>Fördelning över olika industrisektorer</DialogDescription>
          </DialogHeader>
          <SectorAllocationChart data={sectorData} />
        </DialogContent>
      </Dialog>

      {/* Add Cash Dialog */}
      <Dialog open={showAddCashDialog} onOpenChange={setShowAddCashDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lägg till kassainnehav</DialogTitle>
            <DialogDescription>
              Lägg till dina kassapositioner för bättre portföljöversikt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cash-name">Benämning</Label>
              <Input
                id="cash-name"
                placeholder="Kassa"
                value={newCashData.name}
                onChange={(e) => setNewCashData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="cash-amount">Belopp (SEK)</Label>
              <Input
                id="cash-amount"
                type="number"
                placeholder="0"
                value={newCashData.amount}
                onChange={(e) => setNewCashData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCashDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleAddCash}>
              Lägg till
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Cash Dialog */}
      <Dialog open={editingCash !== null} onOpenChange={(open) => !open && setEditingCash(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera kassainnehav</DialogTitle>
            <DialogDescription>
              Uppdatera beloppet för kassainnehavet
            </DialogDescription>
          </DialogHeader>
          <div>
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
        onClose={closeAddHoldingDialog}
        onAdd={handleAddHolding}
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
    </>
  );
};

export default UserHoldingsManager;
