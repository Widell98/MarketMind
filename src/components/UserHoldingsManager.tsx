import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Package,
  Plus,
  Banknote,
  Search,
  Filter
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import HoldingsGroupSection from '@/components/HoldingsGroupSection';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trash2,
  MessageSquare,
  Edit2,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';

interface StockPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  priceInSEK: number;
  changeInSEK: number;
  hasValidPrice: boolean;
  errorMessage?: string;
}

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
}

const UserHoldingsManager: React.FC = () => {
  const { actualHoldings, loading, deleteHolding } = useUserHoldings();
  const { performance } = usePortfolioPerformance();
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
  
  const [showAddCashDialog, setShowAddCashDialog] = useState(false);
  const [editingCash, setEditingCash] = useState<{id: string, amount: number} | null>(null);
  const [newCashData, setNewCashData] = useState({
    name: 'Kassa',
    amount: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Price data state
  const [prices, setPrices] = useState<StockPrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(10.5);

  const handleDeleteHolding = async (holdingId: string, holdingName: string) => {
    console.log(`Deleting holding: ${holdingName} (${holdingId})`);
    const success = await deleteHolding(holdingId);
    if (success) {
      console.log('Holding deleted successfully');
    }
  };

  const handleDiscussHolding = (holdingName: string, symbol?: string) => {
    const sessionName = `Diskussion: ${holdingName}`;
    const message = `Berätta mer om ${holdingName}${symbol ? ` (${symbol})` : ''}. Vad gör företaget, vilka är deras huvudsakliga affärsområden, och varför skulle det vara en bra investering för min portfölj? Analysera också eventuella risker och möjligheter.`;
    
    navigate('/ai-chat', {
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
    await deleteCashHolding(id);
  };

  const formatCurrency = (amount: number, currency = 'SEK', showCurrency = true) => {
    const currencyCode = currency === 'SEK' ? 'SEK' : 'USD';
    const formatter = new Intl.NumberFormat('sv-SE', {
      style: showCurrency ? 'currency' : 'decimal',
      currency: currencyCode,
      minimumFractionDigits: currency === 'SEK' ? 0 : 2,
      maximumFractionDigits: currency === 'SEK' ? 2 : 2,
    });
    return formatter.format(amount);
  };

  const formatPercentage = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      if (data.rates && data.rates.SEK) {
        const newRate = data.rates.SEK;
        if (Math.abs(newRate - exchangeRate) / exchangeRate > 0.01) {
          setExchangeRate(newRate);
          console.log(`Updated exchange rate: ${newRate.toFixed(2)} SEK/USD`);
        }
      }
    } catch (error) {
      console.warn('Failed to fetch exchange rate:', error);
    }
  };

  const fetchPrices = async () => {
    if (!user || actualHoldings.length === 0) return;

    setPricesLoading(true);
    try {
      await fetchExchangeRate();

      const symbolsToFetch = actualHoldings.map((holding) => {
        return {
          searchTerm: holding.symbol || holding.name,
          holding,
        };
      });

      const pricePromises = symbolsToFetch.map(async ({ searchTerm, holding }) => {
        try {
          if (!searchTerm) {
            return {
              symbol: 'N/A',
              name: holding.name || 'Okänt innehav',
              price: 0,
              change: 0,
              changePercent: 0,
              currency: 'SEK',
              priceInSEK: 0,
              changeInSEK: 0,
              hasValidPrice: false,
              errorMessage: 'Ingen giltig ticker-symbol angiven',
            };
          }

          const { data, error } = await supabase.functions.invoke('fetch-stock-quote', {
            body: { symbol: searchTerm },
          });

          if (error || !data || typeof data.price !== 'number') {
            return {
              symbol: searchTerm,
              name: holding.name || searchTerm,
              price: 0,
              change: 0,
              changePercent: 0,
              currency: holding.currency || 'SEK',
              priceInSEK: 0,
              changeInSEK: 0,
              hasValidPrice: false,
              errorMessage: 'Pris kunde inte hämtas',
            };
          }

          const holdingCurrency = holding.currency || 'SEK';
          const quoteCurrency = data.currency || 'USD';

          const convertedToSEK = quoteCurrency === 'USD' && holdingCurrency === 'SEK';

          return {
            symbol: data.symbol || searchTerm,
            name: holding.name || data.name || searchTerm,
            price: data.price,
            change: data.change || 0,
            changePercent: data.changePercent || 0,
            currency: quoteCurrency,
            priceInSEK: convertedToSEK ? data.price * exchangeRate : data.price,
            changeInSEK: convertedToSEK ? (data.change || 0) * exchangeRate : (data.change || 0),
            hasValidPrice: true,
          };
        } catch (err) {
          return {
            symbol: searchTerm,
            name: holding.name || searchTerm,
            price: 0,
            change: 0,
            changePercent: 0,
            currency: holding.currency || 'SEK',
            priceInSEK: 0,
            changeInSEK: 0,
            hasValidPrice: false,
            errorMessage: 'Tekniskt fel vid prisinhämtning',
          };
        }
      });

      const results = await Promise.all(pricePromises);
      setPrices(results);
      setLastUpdated(
        new Date().toLocaleTimeString('sv-SE', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch (err) {
      console.error('Fel vid hämtning av priser:', err);
    } finally {
      setPricesLoading(false);
    }
  };

  const getPriceForHolding = (holding: any) => {
    if (holding.holding_type === 'cash') return null;
    return prices.find(p => 
      p.symbol === holding.symbol || 
      p.name === holding.name
    );
  };

  useEffect(() => {
    if (user && actualHoldings.length > 0) {
      fetchPrices();
      
      const interval = setInterval(() => {
        fetchPrices();
      }, 1800000);

      return () => clearInterval(interval);
    }
  }, [user, actualHoldings]);

  // Prepare holdings data for grouping - fix type issues
  const uniqueCashHoldings = cashHoldings.filter(cash => 
    !actualHoldings.some(holding => holding.id === cash.id)
  );

  // Transform all holdings to match the TransformedHolding interface
  const transformedActualHoldings: TransformedHolding[] = actualHoldings.map(holding => ({
    id: holding.id,
    name: holding.name,
    holding_type: holding.holding_type || 'stock',
    current_value: holding.current_value || 0,
    currency: holding.currency || 'SEK',
    symbol: holding.symbol,
    quantity: holding.quantity,
    purchase_price: holding.purchase_price,
    sector: holding.sector
  }));

  const transformedCashHoldings: TransformedHolding[] = uniqueCashHoldings.map(cash => ({
    id: cash.id,
    name: cash.name,
    holding_type: 'cash' as const,
    current_value: cash.current_value,
    currency: 'SEK',
    symbol: undefined,
    quantity: undefined,
    purchase_price: undefined,
    sector: undefined
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
          return sum + (holding.current_value || 0);
        }, 0);
        
        const totalPortfolioValue = (performance?.totalPortfolioValue || 0) + (totalCash || 0);
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

  const fetchPrices = async () => {
    if (!user || actualHoldings.length === 0) return;

    setPricesLoading(true);
    try {
      await fetchExchangeRate();

      const symbolsToFetch = actualHoldings.map((holding) => {
        return {
          searchTerm: holding.symbol || holding.name,
          holding,
        };
      });

      const pricePromises = symbolsToFetch.map(async ({ searchTerm, holding }) => {
        try {
          if (!searchTerm) {
            return {
              symbol: 'N/A',
              name: holding.name || 'Okänt innehav',
              price: 0,
              change: 0,
              changePercent: 0,
              currency: 'SEK',
              priceInSEK: 0,
              changeInSEK: 0,
              hasValidPrice: false,
              errorMessage: 'Ingen giltig ticker-symbol angiven',
            };
          }

          const { data, error } = await supabase.functions.invoke('fetch-stock-quote', {
            body: { symbol: searchTerm },
          });

          if (error || !data || typeof data.price !== 'number') {
            return {
              symbol: searchTerm,
              name: holding.name || searchTerm,
              price: 0,
              change: 0,
              changePercent: 0,
              currency: holding.currency || 'SEK',
              priceInSEK: 0,
              changeInSEK: 0,
              hasValidPrice: false,
              errorMessage: 'Pris kunde inte hämtas',
            };
          }

          const holdingCurrency = holding.currency || 'SEK';
          const quoteCurrency = data.currency || 'USD';

          const convertedToSEK = quoteCurrency === 'USD' && holdingCurrency === 'SEK';

          return {
            symbol: data.symbol || searchTerm,
            name: holding.name || data.name || searchTerm,
            price: data.price,
            change: data.change || 0,
            changePercent: data.changePercent || 0,
            currency: quoteCurrency,
            priceInSEK: convertedToSEK ? data.price * exchangeRate : data.price,
            changeInSEK: convertedToSEK ? (data.change || 0) * exchangeRate : (data.change || 0),
            hasValidPrice: true,
          };
        } catch (err) {
          return {
            symbol: searchTerm,
            name: holding.name || searchTerm,
            price: 0,
            change: 0,
            changePercent: 0,
            currency: holding.currency || 'SEK',
            priceInSEK: 0,
            changeInSEK: 0,
            hasValidPrice: false,
            errorMessage: 'Tekniskt fel vid prisinhämtning',
          };
        }
      });

      const results = await Promise.all(pricePromises);
      setPrices(results);
      setLastUpdated(
        new Date().toLocaleTimeString('sv-SE', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch (err) {
      console.error('Fel vid hämtning av priser:', err);
    } finally {
      setPricesLoading(false);
    }
  };

  return (
    <>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Dina Innehav
          </CardTitle>
          <CardDescription>
            {loading || cashLoading
              ? "Laddar dina innehav..."
              : allHoldings.length > 0 
                ? `Analysera dina investeringar och kassapositioner (${allHoldings.length} st)`
                : "Lägg till dina befintliga aktier, fonder och kassapositioner för bättre portföljanalys"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading || cashLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Package className="w-4 h-4 animate-pulse" />
                <span>Laddar innehav...</span>
              </div>
            </div>
          ) : allHoldings.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2 text-foreground">Inga innehav registrerade</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Lägg till dina nuvarande aktier, fonder och kassapositioner för att få en komplett bild av din portfölj och bättre AI-rekommendationer.
              </p>
              <div className="flex gap-2 justify-center">
                <Button className="flex items-center gap-2" onClick={() => navigate('/ai-chat')}>
                  <Plus className="w-4 h-4" />
                  Lägg till innehav
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={() => setShowAddCashDialog(true)}>
                  <Banknote className="w-4 h-4" />
                  Lägg till kassa
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-border">
                <div className="flex gap-2">
                  <Button size="sm" className="flex items-center gap-2" onClick={() => navigate('/ai-chat')}>
                    <Plus className="w-4 h-4" />
                    Lägg till innehav
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={() => setShowAddCashDialog(true)}>
                    <Banknote className="w-4 h-4" />
                    Lägg till kassa
                  </Button>
                </div>
                
                <div className="flex gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Sök innehav..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Holdings Groups */}
              <div className="space-y-4">
                {filteredGroups.map((group) => (
                  <HoldingsGroupSection
                    key={group.key}
                    title={group.title}
                    holdings={group.holdings}
                    totalValue={group.totalValue}
                    groupPercentage={group.percentage}
                    getPriceForHolding={getPriceForHolding}
                    onDiscuss={handleDiscussHolding}
                    onEdit={group.key === 'cash' ? (id: string) => {
                      const cash = group.holdings.find(h => h.id === id);
                      if (cash) {
                        setEditingCash({ id: cash.id, amount: cash.current_value });
                      }
                    } : undefined}
                    onDelete={group.key === 'cash' ? handleDeleteCash : handleDeleteHolding}
                  />
                ))}
              </div>

              {lastUpdated && (
                <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
                  Priser uppdaterade: {lastUpdated} | Uppdateras automatiskt var 30:e minut
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
    </>
  );
};

export default UserHoldingsManager;
