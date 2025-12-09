
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Package,
  Plus,
  Banknote,
  Search,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  Globe,
  MapPin,
  TrendingUp,
  TrendingDown
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';

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
  dailyChangePercent?: number | null;
  dailyChangeValueSEK?: number | null;
}

interface UserHoldingsManagerProps {
  importControls?: React.ReactNode;
}

type FilterMode = 'all' | 'se' | 'us' | 'winners' | 'losers';

const UserHoldingsManager: React.FC<UserHoldingsManagerProps> = ({ importControls }) => {
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
  const [refreshingTicker, setRefreshingTicker] = useState<string | null>(null);
  const [holdingToDelete, setHoldingToDelete] = useState<{ id: string; name: string; type: 'cash' | 'holding' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [addHoldingInitialData, setAddHoldingInitialData] = useState<any | null>(null);

  const filterOptions: Array<{ key: FilterMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'all', label: 'Alla', icon: Globe },
    { key: 'se', label: 'Sverige', icon: MapPin },
    { key: 'us', label: 'USA', icon: MapPin },
    { key: 'winners', label: 'Vinnare', icon: TrendingUp },
    { key: 'losers', label: 'Förlorare', icon: TrendingDown },
  ];

  const renderHoldingsActionButtons = () => {
    // Count holdings per filter for badges
    const getFilterCount = (filterKey: FilterMode) => {
      if (filterKey === 'all') return allHoldings.length;
      return allHoldings.filter(holding => {
        if (filterKey === 'se') {
          const currency = (holding.base_currency || holding.price_currency || holding.currency || '').toUpperCase();
          const symbol = holding.symbol?.toUpperCase();
          return currency === 'SEK' || symbol?.endsWith('.ST');
        }
        if (filterKey === 'us') {
          const currency = (holding.base_currency || holding.price_currency || holding.currency || '').toUpperCase();
          return currency === 'USD';
        }
        const performance = holdingPerformanceMap[holding.id];
        if (!performance || holding.holding_type === 'cash') return false;
        if (filterKey === 'winners') return performance.profit > 0;
        if (filterKey === 'losers') return performance.profit < 0;
        return false;
      }).length;
    };

    return (
      <div className="space-y-4">
        {/* Filter Tabs and Search - Unified Row */}
        <div className="flex flex-col gap-3">
          {/* Filter Tabs */}
          <Tabs value={filterMode} onValueChange={(value) => setFilterMode(value as FilterMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-5 gap-1 rounded-xl bg-muted p-1">
              {filterOptions.map((option) => {
                const Icon = option.icon;
                const count = getFilterCount(option.key);
                return (
                  <TabsTrigger
                    key={option.key}
                    value={option.key}
                    className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 rounded-lg text-xs sm:text-sm py-2 sm:py-1.5"
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline truncate">{option.label}</span>
                    {count > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-background/80 text-foreground min-w-[1.25rem] text-center">
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {/* Search and Actions - Unified */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Sök innehav..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-9 h-9 sm:h-10 text-sm border-border focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Rensa sökning"
                >
                  ×
                </button>
              )}
            </div>

            {/* Action Buttons - Compact */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    className="h-9 sm:h-10 bg-primary hover:bg-primary/90 text-primary-foreground" 
                    onClick={() => handleOpenAddHolding()}
                  >
                    <Plus className="w-4 h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Lägg till</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Lägg till innehav</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-9 sm:h-10" 
                    onClick={() => setShowAddCashDialog(true)}
                  >
                    <Banknote className="w-4 h-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">Kassa</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Lägg till kassa</TooltipContent>
              </Tooltip>
              {importControls && (
                <div className="flex-shrink-0">
                  {importControls}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };


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

  const handleOpenAddHolding = () => {
    setAddHoldingInitialData({ holding_type: 'stock' });
    openAddHoldingDialog();
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
    const payload = {
      holding_type: holdingData.holding_type || 'stock',
      ...holdingData,
    };

    const success = await addHolding(payload);
    if (success) {
      closeAddHoldingDialog();
      setAddHoldingInitialData(null);
      const normalizedSymbol = typeof holdingData.symbol === 'string'
        ? holdingData.symbol.trim().toUpperCase()
        : undefined;
      if (normalizedSymbol) {
        void handleUpdateHoldingPrice(normalizedSymbol);
      }
    }
    return success;
  };

  const handleCloseAddHoldingDialog = () => {
    setAddHoldingInitialData(null);
    closeAddHoldingDialog();
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
      dailyChangePercent: holding.dailyChangePercent ?? holding.daily_change_pct ?? null,
      dailyChangeValueSEK: holding.dailyChangeValueSEK ?? null,
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
    dailyChangePercent: null,
    dailyChangeValueSEK: null,
  }));

  const allHoldings = [
    ...transformedActualHoldings,
    ...transformedCashHoldings
  ];

  const tabHoldings = useMemo(() => allHoldings, [allHoldings]);

  const totalPortfolioValue = performance?.totalPortfolioValue ?? allHoldings.reduce((sum, holding) => {
    return sum + resolveHoldingValue(holding).valueInSEK;
  }, 0);

  // Group holdings by type
  const groupHoldings = (visibleHoldings: TransformedHolding[]) => {
    const groups = {
      stocks: visibleHoldings.filter(h => h.holding_type === 'stock'),
      funds: visibleHoldings.filter(h => h.holding_type === 'fund'),
      cash: visibleHoldings.filter(h => h.holding_type === 'cash'),
      other: visibleHoldings.filter(h => !['stock', 'fund', 'cash'].includes(h.holding_type))
    };

    return Object.entries(groups)
      .filter(([, holdings]) => holdings.length > 0)
      .map(([type, holdings]) => {
        // Fix: Properly sum the current_value of each holding
        const totalValue = holdings.reduce((sum, holding) => {
          return sum + resolveHoldingValue(holding).valueInSEK;
        }, 0);

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

  const matchesSearch = (holding: TransformedHolding) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;

    return (
      holding.name.toLowerCase().includes(term) ||
      (holding.symbol && holding.symbol.toLowerCase().includes(term))
    );
  };

  const getHoldingRegion = (holding: TransformedHolding): 'se' | 'us' | null => {
    const currency = (holding.base_currency || holding.price_currency || holding.currency || '').toUpperCase();
    const symbol = holding.symbol?.toUpperCase();

    if (currency === 'SEK' || symbol?.endsWith('.ST')) {
      return 'se';
    }

    if (currency === 'USD') {
      return 'us';
    }

    return null;
  };

  const matchesFilter = (holding: TransformedHolding) => {
    if (filterMode === 'all') return true;

    if (filterMode === 'se') return getHoldingRegion(holding) === 'se';
    if (filterMode === 'us') return getHoldingRegion(holding) === 'us';

    const performance = holdingPerformanceMap[holding.id];
    if (!performance || holding.holding_type === 'cash') {
      return false;
    }

    if (filterMode === 'winners') {
      return performance.profit > 0;
    }

    if (filterMode === 'losers') {
      return performance.profit < 0;
    }

    return true;
  };

  const filteredGroups = groupHoldings(tabHoldings)
    .map(group => ({
      ...group,
      holdings: group.holdings.filter(holding => matchesSearch(holding) && matchesFilter(holding))
    }))
    .filter(group => group.holdings.length > 0);

  const filteredHoldings = filteredGroups.flatMap(group => group.holdings);

  const holdingsActionButtons = renderHoldingsActionButtons();

  return (
    <TooltipProvider delayDuration={120}>
      <>
        <Card className="h-fit rounded-xl sm:rounded-2xl border-border/50 shadow-sm">
        <CardHeader className="p-4 sm:p-5 md:p-6 pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg sm:text-xl md:text-2xl font-heading font-bold">Innehav</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground font-sans">
                Sök, lägg till eller hantera dina innehav.
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={viewMode === 'cards' ? 'default' : 'outline'}
                    onClick={() => setViewMode('cards')}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="sr-only">Kortvy</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Kortvy</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    onClick={() => setViewMode('table')}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <TableIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="sr-only">Tabellvy</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tabellvy</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-5 md:p-6 pt-0">
          {loading || cashLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Package className="w-4 h-4 animate-pulse" />
                <span className="font-sans">Laddar innehav...</span>
              </div>
            </div>
          ) : tabHoldings.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-base sm:text-lg font-heading font-semibold mb-2 text-foreground">
                Inga innehav registrerade
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-sm mx-auto px-2 font-sans">
                Lägg till dina nuvarande aktier, fonder och kassapositioner för att få en komplett bild av din portfölj och bättre AI-rekommendationer.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center px-2">
                <Button className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto font-sans" onClick={() => handleOpenAddHolding()}>
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Lägg till innehav
                </Button>
                <Button variant="outline" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto font-sans" onClick={() => setShowAddCashDialog(true)}>
                  <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Lägg till kassa
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* Portfolio Summary Header */}
              {(totalPortfolioValue > 0 || totalCash > 0) && (() => {
                const stockCount = allHoldings.filter(h => h.holding_type !== 'cash').length;
                const totalValue = totalPortfolioValue + totalCash;
                const portfolioPercentage = totalValue > 0 
                  ? ((totalPortfolioValue / totalValue) * 100) 
                  : 0;
                const cashPercentage = totalValue > 0 
                  ? (totalCash / totalValue * 100) 
                  : 0;
                
                // Calculate circle SVG paths for pie chart
                const radius = 60;
                const centerX = 70;
                const centerY = 70;
                const circumference = 2 * Math.PI * radius;
                
                // Calculate angles for pie slices
                const stocksAngle = (portfolioPercentage / 100) * 360;
                const cashAngle = (cashPercentage / 100) * 360;
                
                // Helper function to create arc path
                const createArcPath = (startAngle: number, endAngle: number) => {
                  const startRad = ((startAngle - 90) * Math.PI) / 180;
                  const endRad = ((endAngle - 90) * Math.PI) / 180;
                  const x1 = centerX + radius * Math.cos(startRad);
                  const y1 = centerY + radius * Math.sin(startRad);
                  const x2 = centerX + radius * Math.cos(endRad);
                  const y2 = centerY + radius * Math.sin(endRad);
                  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                  
                  return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                };
                
                return (
                  <Card className="bg-card border border-border rounded-xl p-4 sm:p-5 md:p-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 sm:gap-8">
                      {/* Pie Chart Circle - Centered on mobile */}
                      <div className="flex justify-center md:justify-start">
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32">
                          <svg className="w-full h-full" viewBox="0 0 140 140">
                            {/* Stocks slice */}
                            {portfolioPercentage > 0 && (
                              <path
                                d={createArcPath(0, stocksAngle)}
                                fill="hsl(var(--primary))"
                                className="transition-all duration-500 ease-out"
                              />
                            )}
                            {/* Cash slice */}
                            {cashPercentage > 0 && (
                              <path
                                d={createArcPath(stocksAngle, stocksAngle + cashAngle)}
                                fill="hsl(var(--muted-foreground))"
                                className="transition-all duration-500 ease-out opacity-60"
                              />
                            )}
                            {/* Center hole for donut effect */}
                            <circle
                              cx={centerX}
                              cy={centerY}
                              r={radius - 12}
                              fill="hsl(var(--card))"
                            />
                          </svg>
                          {/* Center content */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                              {stockCount}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground font-sans">
                              {stockCount === 1 ? 'aktie' : 'aktier'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats Grid - Compact and unified */}
                      <div className="space-y-4">
                        {/* Total - Prominent */}
                        <div className="pb-3 border-b border-border">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-xs sm:text-sm text-muted-foreground font-sans uppercase tracking-wide">Totalt portföljvärde</p>
                            <p className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-foreground">
                              {formatCurrency(totalValue, 'SEK')}
                            </p>
                          </div>
                        </div>
                        
                        {/* Breakdown - Compact cards */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          {/* Stocks Card */}
                          <div className="rounded-lg border border-border/50 bg-muted/30 p-3 sm:p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                              <p className="text-xs text-muted-foreground font-sans font-medium uppercase tracking-wide">Aktier</p>
                            </div>
                            <p className="text-base sm:text-lg font-heading font-bold text-foreground mb-1">
                              {formatCurrency(totalPortfolioValue, 'SEK')}
                            </p>
                            <p className="text-xs text-muted-foreground font-sans">
                              {portfolioPercentage.toFixed(1)}% av totalt
                            </p>
                          </div>
                          
                          {/* Cash Card */}
                          {totalCash > 0 ? (
                            <div className="rounded-lg border border-border/50 bg-muted/30 p-3 sm:p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/60 flex-shrink-0" />
                                <p className="text-xs text-muted-foreground font-sans font-medium uppercase tracking-wide">Kassa</p>
                              </div>
                              <p className="text-base sm:text-lg font-heading font-bold text-foreground mb-1">
                                {formatCurrency(totalCash, 'SEK')}
                              </p>
                              <p className="text-xs text-muted-foreground font-sans">
                                {cashPercentage.toFixed(1)}% av totalt
                              </p>
                            </div>
                          ) : (
                            <div className="rounded-lg border border-border/30 bg-muted/10 p-3 sm:p-4 opacity-50">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 flex-shrink-0" />
                                <p className="text-xs text-muted-foreground font-sans font-medium uppercase tracking-wide">Kassa</p>
                              </div>
                              <p className="text-base sm:text-lg font-heading font-bold text-foreground mb-1">
                                –
                              </p>
                              <p className="text-xs text-muted-foreground font-sans">
                                Inget registrerat
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })()}
              {holdingsActionButtons}
              {viewMode === 'cards' ? (
                <div className="space-y-4">
                  {filteredGroups.map((group, index) => (
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
                <div className="space-y-4 sm:space-y-6">
                  <HoldingsTable
                    holdings={filteredHoldings}
                    onRefreshPrice={handleUpdateHoldingPrice}
                    isUpdatingPrice={updating}
                    refreshingTicker={refreshingTicker}
                    holdingPerformanceMap={holdingPerformanceMap}
                    totalPortfolioValue={totalPortfolioValue}
                  />
                </div>
              )}

              {tabHoldings.length > 0 && (
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
      </>
    </TooltipProvider>
  );
};

export default UserHoldingsManager;
