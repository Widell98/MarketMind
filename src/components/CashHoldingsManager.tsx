
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Wallet,
  Plus,
  Trash2,
  Edit2
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
import { useCashHoldings } from '@/hooks/useCashHoldings';

const CashHoldingsManager: React.FC = () => {
  const { cashHoldings, totalCash, loading, addCashHolding, updateCashHolding, deleteCashHolding } = useCashHoldings();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<{id: string, amount: number} | null>(null);
  const [newCashData, setNewCashData] = useState({
    name: '',
    amount: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleAddCash = async () => {
    if (!newCashData.name || !newCashData.amount) return;
    
    const amount = parseFloat(newCashData.amount);
    if (isNaN(amount) || amount <= 0) return;

    const success = await addCashHolding(newCashData.name, amount);
    if (success) {
      setNewCashData({ name: '', amount: '' });
      setIsAddDialogOpen(false);
    }
  };

  const handleUpdateCash = async () => {
    if (!editingHolding) return;
    
    const success = await updateCashHolding(editingHolding.id, editingHolding.amount);
    if (success) {
      setEditingHolding(null);
    }
  };

  const handleDeleteCash = async (id: string) => {
    await deleteCashHolding(id);
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-green-600" />
          Kassainnehav
        </CardTitle>
        <CardDescription>
          {loading 
            ? "Laddar kassainnehav..."
            : `Total kassa: ${formatCurrency(totalCash)}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <Wallet className="w-4 h-4 animate-pulse" />
              <span>Laddar kassainnehav...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Kassapositioner ({cashHoldings.length})</span>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Lägg till kassa
                  </Button>
                </DialogTrigger>
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
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Avbryt
                    </Button>
                    <Button onClick={handleAddCash}>
                      Lägg till
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {cashHoldings.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2 text-foreground">Inga kassainnehav registrerade</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                  Lägg till dina kassapositioner för att få en komplett bild av din portfölj.
                </p>
              </div>
            ) : (
              cashHoldings.map(holding => (
                <div key={holding.id} className="bg-white dark:bg-slate-900/70 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-sm">
                  <div className="flex items-center justify-between p-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{holding.name}</h3>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(holding.current_value)}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-4 flex gap-2">
                      <Dialog open={editingHolding?.id === holding.id} onOpenChange={(open) => !open && setEditingHolding(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            onClick={() => setEditingHolding({ id: holding.id, amount: holding.current_value })}
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
                              value={editingHolding?.amount || 0}
                              onChange={(e) => setEditingHolding(prev => 
                                prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null
                              )}
                            />
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingHolding(null)}>
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
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CashHoldingsManager;
