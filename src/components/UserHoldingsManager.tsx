
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Trash2,
  Package,
  MessageSquare,
  Plus,
  Banknote,
  Edit2,
  Wallet
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
import { Badge } from '@/components/ui/badge';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';

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
  const navigate = useNavigate();
  
  const [showAddCashDialog, setShowAddCashDialog] = useState(false);
  const [editingCash, setEditingCash] = useState<{id: string, amount: number} | null>(null);
  const [newCashData, setNewCashData] = useState({
    name: '',
    amount: ''
  });

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
      setNewCashData({ name: '', amount: '' });
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Combine actual holdings and cash holdings for display
  const allHoldings = [
    ...actualHoldings,
    ...cashHoldings.map(cash => ({
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
              <div className="flex gap-2 mb-4">
                <Button size="sm" className="flex items-center gap-2" onClick={() => navigate('/ai-chat')}>
                  <Plus className="w-4 h-4" />
                  Lägg till innehav
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={() => setShowAddCashDialog(true)}>
                  <Banknote className="w-4 h-4" />
                  Lägg till kassa
                </Button>
              </div>
              
              {allHoldings.map(holding => (
                <div key={holding.id} className="relative bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-sm">
                  <div className="flex items-center justify-between p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {holding.holding_type === 'cash' ? (
                          <Wallet className="w-4 h-4 text-green-600" />
                        ) : null}
                        <h3 className="font-semibold text-gray-900">{holding.name}</h3>
                        {holding.symbol && (
                          <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                            {holding.symbol}
                          </span>
                        )}
                        {holding.holding_type === 'cash' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Kassa
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-3">
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
                    
                    <div className="flex-shrink-0 ml-4 flex gap-2">
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
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
              ))}
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
                placeholder="t.ex. Sparkonto, ISK kassa, etc."
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
