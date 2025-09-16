
import React, { useState } from 'react';
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
  LayoutGrid,
  Table as TableIcon,
  PieChart as PieChartIcon,
  RefreshCw,
  Loader2
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
import { useCashHoldings } from '@/hooks/useCashHoldings';
import { useAuth } from '@/contexts/AuthContext';

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
}

interface UserHoldingsManagerProps {
  sectorData?: { name: string; value: number; percentage: number }[];
}

const UserHoldingsManager: React.FC<UserHoldingsManagerProps> = ({ sectorData = [] }) => {
  const { actualHoldings, loading, deleteHolding, recommendations, addHolding, updateHolding } = useUserHoldings();
  const { performance, updatePrices, updating } = usePortfolioPerformance();
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
  const [showAddHoldingDialog, setShowAddHoldingDialog] = useState(false);
  const [showEditHoldingDialog, setShowEditHoldingDialog] = useState(false);
  const [editingHolding, setEditingHolding] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isChartOpen, setIsChartOpen] = useState(false);
  
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


  const handleEditHolding = (id: string) => {
    const holding = actualHoldings.find(h => h.id === id);
    if (holding) {
      setEditingHolding(holding);
      setShowEditHoldingDialog(true);
    }
  };

  const handleUpdateHolding = async (holdingData: any) => {
    if (!editingHolding) return false;
    
    const success = await updateHolding(editingHolding.id, holdingData);
    if (success) {
      setShowEditHoldingDialog(false);
      setEditingHolding(null);
    }
    return success;
  };

  const handleAddHolding = async (holdingData: any) => {
    const success = await addHolding(holdingData);
    if (success) {
      setShowAddHoldingDialog(false);
    }
    return success;
  };

  // Prepare holdings data for grouping - fix type issues
  const uniqueCashHoldings = cashHoldings.filter(cash => 
    !actualHoldings.some(holding => holding.id === cash.id)
  );

  // Transform all holdings to match the TransformedHolding interface
  const transformedActualHoldings: TransformedHolding[] = actualHoldings.map(holding => {
    const pricePerUnit = typeof holding.current_price_per_unit === 'number'
      ? holding.current_price_per_unit
      : undefined;

    const quantity = typeof holding.quantity === 'number' ? holding.quantity : undefined;
    const currentValue = quantity !== undefined && pricePerUnit !== undefined
      ? pricePerUnit * quantity
      : holding.current_value || 0;

    return {
      id: holding.id,
      name: holding.name,
      holding_type: holding.holding_type || 'stock',
      current_value: currentValue,
      currency: holding.currency || 'SEK',
      symbol: holding.symbol,
      quantity: holding.quantity,
      purchase_price: holding.purchase_price,
      sector: holding.sector,
      current_price_per_unit: pricePerUnit,
      price_currency: holding.price_currency || holding.currency || 'SEK'
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
    price_currency: 'SEK'
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
          return sum + (Number(holding.current_value) || 0);
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

  const filteredHoldings = filteredGroups.flatMap(group => group.holdings);

  return (
    <>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Dina Innehav</span>
            </span>
            <PieChartIcon
              className="w-5 h-5 text-blue-600 cursor-pointer"
              onClick={() => setIsChartOpen(true)}
            />
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
                <Button className="flex items-center gap-2" onClick={() => setShowAddHoldingDialog(true)}>
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
            <div className="space-y-4">
              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row gap-4 pb-4 border-b border-border">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="flex items-center gap-2" onClick={() => setShowAddHoldingDialog(true)}>
                    <Plus className="w-4 h-4" />
                    Lägg till innehav
                  </Button>
                  <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={() => setShowAddCashDialog(true)}>
                    <Banknote className="w-4 h-4" />
                    Lägg till kassa
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => updatePrices()}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {updating ? 'Uppdaterar...' : 'Uppdatera priser'}
                  </Button>
                </div>

                <div className="flex gap-2 flex-1 max-w-md items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Sök innehav..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant={viewMode === 'cards' ? 'default' : 'outline'}
                      onClick={() => setViewMode('cards')}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      onClick={() => setViewMode('table')}
                    >
                      <TableIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {viewMode === 'cards' ? (
                <div className="space-y-4">
                  {filteredGroups.map((group) => (
                    <HoldingsGroupSection
                      key={group.key}
                      title={group.title}
                      holdings={group.holdings}
                      totalValue={group.totalValue}
                      groupPercentage={group.percentage}
                      onDiscuss={handleDiscussHolding}
                      onEdit={group.key === 'cash' ? (id: string) => {
                        const cash = group.holdings.find(h => h.id === id);
                        if (cash) {
                          setEditingCash({ id: cash.id, amount: cash.current_value });
                        }
                      } : handleEditHolding}
                      onDelete={group.key === 'cash' ? handleDeleteCash : handleDeleteHolding}
                    />
                  ))}
                </div>
              ) : (
                <HoldingsTable holdings={filteredHoldings} />
              )}

              {allHoldings.length > 0 && (
                <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
                  Priserna hämtas från Google Sheets-integrationen och uppdateras där.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
        isOpen={showAddHoldingDialog}
        onClose={() => setShowAddHoldingDialog(false)}
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
