import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2,
  Package,
  MessageSquare,
  Plus,
  Banknote,
  Edit2,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle
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
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
    
    // Navigate to AI chat with state to create new session
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

  // Auto-update prices every 30 minutes
  useEffect(() => {
    if (user && actualHoldings.length > 0) {
      fetchPrices();
      
      // Set up interval for 30 minutes (1800000 ms)
      const interval = setInterval(() => {
        fetchPrices();
      }, 1800000);

      return () => clearInterval(interval);
    }
  }, [user, actualHoldings]);

  // Filter out duplicate cash holdings by checking both cashHoldings and actualHoldings
  const uniqueCashHoldings = cashHoldings.filter(cash => 
    !actualHoldings.some(holding => holding.id === cash.id)
  );

  // Combine actual holdings and unique cash holdings for display
  const allHoldings = [
    ...actualHoldings,
    ...uniqueCashHoldings.map(cash => ({
      ...cash,
      holding_type: 'cash' as const,
      symbol: undefined,
      quantity: undefined,
      purchase_price: cash.current_value
    }))
  ];

  return (
    <>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Dina Nuvarande Innehav
          </CardTitle>
          <CardDescription>
            {loading || cashLoading
              ? "Laddar dina innehav..."
              : allHoldings.length > 0 
                ? `Hantera dina aktieinnehav och kassapositioner (${allHoldings.length} st)`
                : "Lägg till dina befintliga aktier, fonder och kassapositioner för bättre portföljanalys"
            }
          </CardDescription>
          {performance.totalPortfolioValue > 0 && (
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Investerat värde:</span>
                  <div className="font-semibold text-foreground">
                    {formatCurrency(performance.totalValue)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Kassa:</span>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(totalCash)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total portfölj:</span>
                  <div className="font-semibold text-foreground">
                    {formatCurrency(performance.totalPortfolioValue + totalCash)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Kassaandel:</span>
                  <div className="font-semibold text-muted-foreground">
                    {((totalCash / (performance.totalPortfolioValue + totalCash)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
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
              <div className="flex gap-2 mb-4 flex-wrap">
                <Button size="sm" className="flex items-center gap-2" onClick={() => navigate('/ai-chat')}>
                  <Plus className="w-4 h-4" />
                  Lägg till innehav
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={() => setShowAddCashDialog(true)}>
                  <Banknote className="w-4 h-4" />
                  Lägg till kassa
                </Button>
              </div>
              
              {lastUpdated && (
                <div className="text-xs text-muted-foreground mb-3 px-2">
                  Priser uppdaterade: {lastUpdated} | Uppdateras automatiskt var 30:e minut
                </div>
              )}
              
              {allHoldings.map(holding => {
                const currentPrice = getPriceForHolding(holding);
                
                return (
                  <div key={holding.id} className="relative bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
                      {/* Innehav info */}
                      <div className="min-w-0 flex-1 lg:col-span-1">
                        <div className="flex items-center gap-2 mb-1">
                          {holding.holding_type === 'cash' ? (
                            <Wallet className="w-4 h-4 text-green-600" />
                          ) : null}
                          <h3 className="font-semibold text-gray-900 truncate">{holding.name}</h3>
                          {holding.symbol && (
                            <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0">
                              {holding.symbol}
                            </span>
                          )}
                          {holding.holding_type === 'cash' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex-shrink-0">
                              Kassa
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 flex flex-wrap items-center gap-3">
                          {holding.holding_type === 'cash' ? (
                            <span className="font-medium text-green-600">
                              {formatCurrency(holding.current_value)}
                            </span>
                          ) : (
                            <>
                              {holding.quantity && (
                                <span className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                  {holding.quantity} aktier
                                </span>
                              )}
                              {holding.purchase_price && (
                                <span className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                  Köpt för {formatCurrency(holding.purchase_price)}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                {holding.holding_type}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Aktuellt pris kolumn */}
                      <div className="min-w-0 flex-1 lg:col-span-1">
                        {holding.holding_type === 'cash' ? (
                          <div className="text-center py-2">
                            <span className="text-sm text-muted-foreground">-</span>
                          </div>
                        ) : currentPrice ? (
                          <div className="text-center">
                            <div className="font-medium text-sm">
                              {formatCurrency(
                                currentPrice.currency === 'USD' ? currentPrice.price : currentPrice.priceInSEK,
                                currentPrice.currency === 'USD' ? 'USD' : 'SEK'
                              )}
                            </div>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              {currentPrice.changePercent >= 0 ? (
                                <TrendingUp className="w-3 h-3 text-green-600" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-red-600" />
                              )}
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  currentPrice.changePercent >= 0
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {formatPercentage(currentPrice.changePercent)}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <div className="flex items-center justify-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              <span className="text-xs text-amber-600">
                                {pricesLoading ? 'Hämtar...' : 'Pris saknas'}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Kontrollera symbol
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Åtgärder */}
                      <div className="flex lg:justify-end gap-2 lg:col-span-1">
                      {holding.holding_type === 'cash' ? (
                        <>
                          <Dialog open={editingCash?.id === holding.id} onOpenChange={(open) => !open && setEditingCash(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => setEditingCash({ id: holding.id, amount: holding.current_value })}
                              >
                                <Edit2 className="w-4 h-4 mr-1" />
                                Redigera
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Redigera kassainnehav</DialogTitle>
                                <DialogDescription>
                                  Uppdatera beloppet för {holding.name}
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
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ext-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Radera
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Radera kassainnehav</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Är du säker på att du vill radera <strong>{holding.name}</strong>? 
                                  Denna åtgärd kan inte ångras.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCash(holding.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Radera
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300"
                            onClick={() => handleDiscussHolding(holding.name, holding.symbol)}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Diskutera
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Radera
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Radera innehav</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Är du säker på att du vill radera <strong>{holding.name}</strong> från dina innehav? 
                                  Denna åtgärd kan inte ångras.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteHolding(holding.id, holding.name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Radera
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
    </>
  );
};

export default UserHoldingsManager;
