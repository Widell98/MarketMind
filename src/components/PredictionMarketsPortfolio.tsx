import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ArrowRight, LayoutGrid, List as ListIcon, Loader2, Bookmark, MessageCircle } from 'lucide-react';
import { useSavedPredictionMarkets } from '@/hooks/useSavedPredictionMarkets';
import { usePredictionMarketBets, PredictionMarketBet } from '@/hooks/usePredictionMarketBets';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PredictionMarketCard } from '@/components/PredictionMarketCard';
import PredictionBetCard from '@/components/PredictionBetCard';
import AddBetDialog from '@/components/AddBetDialog';
import { useQuery } from '@tanstack/react-query';
import { fetchPolymarketMarketDetail } from '@/hooks/usePolymarket';
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

const PredictionMarketsPortfolio: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { savedMarkets, loading: savedMarketsLoading } = useSavedPredictionMarkets();
  const { bets, loading: betsLoading, removeBet, refetch: refetchBets } = usePredictionMarketBets();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedMarketForBet, setSelectedMarketForBet] = useState<string | null>(null);
  const [betToDelete, setBetToDelete] = useState<PredictionMarketBet | null>(null);
  const [isDeletingBet, setIsDeletingBet] = useState(false);

  // Fetch market details for selected market
  const { data: selectedMarket } = useQuery({
    queryKey: ['polymarket-market', selectedMarketForBet],
    queryFn: () => selectedMarketForBet ? fetchPolymarketMarketDetail(selectedMarketForBet) : null,
    enabled: !!selectedMarketForBet,
  });

  // Fetch market details for bets
  const betMarkets = useQuery({
    queryKey: ['bet-markets', bets.map(b => b.prediction_market_id)],
    queryFn: async () => {
      const marketPromises = bets.map(bet => fetchPolymarketMarketDetail(bet.prediction_market_id));
      const results = await Promise.all(marketPromises);
      return results.filter((m): m is NonNullable<typeof m> => m !== null);
    },
    enabled: bets.length > 0,
  });

  const loading = savedMarketsLoading || betsLoading;

  const viewToggleButtonClass =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 w-10 text-primary';

  const handleViewMarket = (marketId: string) => {
    navigate(`/predictions/${marketId}`);
  };

  const handleAddBet = (marketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMarketForBet(marketId);
  };

  const handleDiscussWithAI = (marketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const market = savedMarkets.find(m => m.id === marketId);
    if (market) {
      navigate('/ai-chatt', {
        state: {
          contextData: {
            type: 'prediction_market',
            id: market.id,
            title: market.question,
            data: market
          }
        }
      });
    }
  };

  const handleDeleteBetRequest = (bet: PredictionMarketBet, e: React.MouseEvent) => {
    e.stopPropagation();
    setBetToDelete(bet);
  };

  const handleConfirmDeleteBet = async () => {
    if (!betToDelete) return;

    setIsDeletingBet(true);
    try {
      await removeBet(betToDelete.id);
      setBetToDelete(null);
    } catch (error) {
      console.error('Error deleting bet:', error);
    } finally {
      setIsDeletingBet(false);
    }
  };

  const handleBetSuccess = () => {
    refetchBets();
  };

  const getMarketForBet = (bet: PredictionMarketBet) => {
    return betMarkets.data?.find(m => m.id === bet.prediction_market_id);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Prediction Markets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Laddar prediction markets...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasContent = savedMarkets.length > 0 || bets.length > 0;

  if (!hasContent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Prediction Markets
          </CardTitle>
          <CardDescription>
            Dina sparade marknader och aktiva bets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2 text-foreground">Inga sparade marknader eller bets</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Utforska prediction markets och spara intressanta marknader eller lägg till bets till din portfölj.
            </p>
            <Button 
              onClick={() => navigate('/predictions')} 
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Utforska Prediction Markets
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/30 backdrop-blur-xl border-border/20 shadow-lg rounded-3xl overflow-hidden">
      <CardHeader className="pb-6 bg-gradient-to-r from-primary/5 to-purple/5 border-b border-border/20">
        <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
          <CardTitle className="text-xl font-semibold flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span>Prediction Markets</span>
            {(savedMarkets.length > 0 || bets.length > 0) && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full">
                {savedMarkets.length} sparade, {bets.length} bets
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-muted-foreground leading-relaxed text-center sm:text-left">
            Dina sparade marknader och aktiva bets
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="text-sm text-muted-foreground font-medium text-center sm:text-left">
            {savedMarkets.length} sparade marknader, {bets.length} aktiva bets
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center justify-center sm:justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={`${viewToggleButtonClass} ${viewMode === 'list' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
              >
                <ListIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={`${viewToggleButtonClass} ${viewMode === 'grid' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/predictions')}
              className="w-full sm:w-auto text-primary hover:text-primary/80 hover:bg-primary/5 rounded-xl font-medium"
            >
              Hitta fler <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>

        {/* Active Bets Section */}
        {bets.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Aktiva Bets</h3>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {bets.map((bet) => (
                  <PredictionBetCard
                    key={bet.id}
                    bet={bet}
                    market={getMarketForBet(bet)}
                    onRemove={(betId) => handleDeleteBetRequest(bets.find(b => b.id === betId)!, {} as React.MouseEvent)}
                    onClick={() => handleViewMarket(bet.prediction_market_id)}
                    compact={false}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {bets.map((bet) => (
                  <PredictionBetCard
                    key={bet.id}
                    bet={bet}
                    market={getMarketForBet(bet)}
                    onRemove={(betId) => handleDeleteBetRequest(bets.find(b => b.id === betId)!, {} as React.MouseEvent)}
                    onClick={() => handleViewMarket(bet.prediction_market_id)}
                    compact={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Markets Section */}
        {savedMarkets.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Sparade Marknader</h3>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {savedMarkets.slice(0, 6).map((market) => {
                  const hasBet = bets.some(b => b.prediction_market_id === market.id);
                  return (
                    <div key={market.id} className="relative group">
                      <PredictionMarketCard market={market} />
                      <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!hasBet && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => handleAddBet(market.id, e)}
                            className="h-8 text-xs shadow-lg"
                          >
                            Lägg till bet
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleDiscussWithAI(market.id, e)}
                          className="h-8 w-8 p-0 shadow-lg bg-background/90"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {savedMarkets.slice(0, 6).map((market) => {
                  const hasBet = bets.some(b => b.prediction_market_id === market.id);
                  return (
                    <div key={market.id} className="relative group">
                      <PredictionMarketCard market={market} />
                      <div className="absolute top-2 right-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!hasBet && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => handleAddBet(market.id, e)}
                            className="h-8 text-xs shadow-lg"
                          >
                            Lägg till bet
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleDiscussWithAI(market.id, e)}
                          className="h-8 w-8 p-0 shadow-lg bg-background/90"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {savedMarkets.length > 6 && (
              <Button
                variant="outline"
                className="w-full mt-6 rounded-xl py-3 bg-card/50 hover:bg-primary/5 text-primary hover:text-primary/80 border-primary/20 hover:border-primary/30"
                onClick={() => navigate('/predictions?tab=saved')}
              >
                Visa alla sparade marknader ({savedMarkets.length})
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Delete Bet Dialog */}
      <AlertDialog
        open={!!betToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setBetToDelete(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Ta bort bet
            </AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort detta bet från din portfölj?
              Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl"
              onClick={() => setBetToDelete(null)}
              disabled={isDeletingBet}
            >
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 rounded-xl"
              onClick={handleConfirmDeleteBet}
              disabled={isDeletingBet}
            >
              {isDeletingBet ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Bet Dialog */}
      <AddBetDialog
        isOpen={!!selectedMarketForBet}
        onClose={() => setSelectedMarketForBet(null)}
        market={selectedMarket || null}
        onSuccess={handleBetSuccess}
      />
    </Card>
  );
};

export default PredictionMarketsPortfolio;

