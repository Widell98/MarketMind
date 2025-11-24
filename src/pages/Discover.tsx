import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Heart, Layers, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import Layout from '@/components/Layout';
import StockCaseCard from '@/components/StockCaseCard';
import SwipeableCaseDeck from '@/components/SwipeableCaseDeck';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedStockCasesSearch from '@/components/EnhancedStockCasesSearch';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { useStockCases } from '@/hooks/useStockCases';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { useLikedStockCases } from '@/hooks/useLikedStockCases';
import { supabase } from '@/integrations/supabase/client';
import { StockCase } from '@/types/stockCase';
import StockCaseDetail from './StockCaseDetail';

type LikedStockCaseCache = StockCase & { liked_at?: string };

const Discover = () => {
  const navigate = useNavigate();
  const { stockCases: allStockCases, loading: stockCasesLoading } = useStockCases(false);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    likedStockCases,
    loading: likedCasesLoading,
    refetch: refetchLikedCases,
  } = useLikedStockCases();

  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('');
  const [caseSortBy, setCaseSortBy] = useState('created_at');
  const [caseSortOrder, setCaseSortOrder] = useState<'asc' | 'desc'>('desc');
  const [caseViewMode, setCaseViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'cases' | 'liked' | 'upptack'>('upptack');
  const [detailCaseId, setDetailCaseId] = useState<string | null>(null);

  const filteredCases = useMemo(() => {
    let filtered = [...(allStockCases || [])];
    const normalizedSearchTerm = caseSearchTerm.trim().toLowerCase();

    if (normalizedSearchTerm) {
      filtered = filtered.filter((sc) => {
        const sector = sc.sector?.toLowerCase();
        const title = sc.title.toLowerCase();
        const company = sc.company_name?.toLowerCase();
        const description = sc.description?.toLowerCase();
        const longDescription = sc.long_description?.toLowerCase();
        const displayName = sc.profiles?.display_name?.toLowerCase();
        const username = sc.profiles?.username?.toLowerCase();

        return (
          title.includes(normalizedSearchTerm) ||
          company?.includes(normalizedSearchTerm) ||
          description?.includes(normalizedSearchTerm) ||
          longDescription?.includes(normalizedSearchTerm) ||
          sector?.includes(normalizedSearchTerm) ||
          displayName?.includes(normalizedSearchTerm) ||
          username?.includes(normalizedSearchTerm)
        );
      });
    }

    if (selectedSector && selectedSector !== 'all-sectors') {
      const normalizedSector = selectedSector.trim().toLowerCase();
      filtered = filtered.filter(
        (sc) => sc.sector && sc.sector.trim().toLowerCase() === normalizedSector
      );
    }

    if (performanceFilter && performanceFilter !== 'all-results') {
      filtered = filtered.filter((sc) => {
        const perf = sc.performance_percentage ?? 0;
        switch (performanceFilter) {
          case 'positive':
            return perf > 0;
          case 'negative':
            return perf < 0;
          case 'high':
            return perf > 10;
          case 'low':
            return perf < 5;
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;
      switch (caseSortBy) {
        case 'performance':
          aVal = a.performance_percentage || 0;
          bVal = b.performance_percentage || 0;
          break;
        case 'likes':
          aVal = a.likes_count ?? 0;
          bVal = b.likes_count ?? 0;
          break;
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        default:
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
      }

      if (aVal < bVal) {
        return caseSortOrder === 'asc' ? -1 : 1;
      }

      if (aVal > bVal) {
        return caseSortOrder === 'asc' ? 1 : -1;
      }

      return 0;
    });

    return filtered;
  }, [allStockCases, caseSearchTerm, selectedSector, performanceFilter, caseSortBy, caseSortOrder]);

  const availableSectors = useMemo(() => {
    const sectors = new Set<string>();
    allStockCases?.forEach((sc) => sc.sector && sectors.add(sc.sector));
    return [...sectors].sort();
  }, [allStockCases]);

  const handleViewStockCaseDetails = (id: string) => navigate(`/stock-cases/${id}`);
  const handleDeckViewDetails = (id: string) => setDetailCaseId(id);
  const handleDeleteStockCase = (id: string) => {
    toast({
      title: 'Funktion kommer snart',
      description: 'Det går ännu inte att ta bort aktiecase från denna vy.',
    });
  };

  const handleSwipeLike = async (stockCase: StockCase) => {
    if (!user) {
      toast({
        title: 'Logga in för att gilla',
        description: 'Du behöver vara inloggad för att spara företag du gillar.',
        variant: 'destructive',
      });
      return;
    }

    const likedAt = new Date().toISOString();
    const likedQueryKey = ['liked-stock-cases', user?.id];
    const previousLiked =
      queryClient.getQueryData<LikedStockCaseCache[]>(likedQueryKey) || [];

    queryClient.setQueryData<LikedStockCaseCache[]>(likedQueryKey, (prev = []) => {
      if (prev.some((item) => item.id === stockCase.id)) {
        return prev;
      }

      return [{ ...stockCase, liked_at: likedAt }, ...prev];
    });

    const { error } = await supabase.from('stock_case_likes').insert({
      user_id: user.id,
      stock_case_id: stockCase.id,
    });

    if (error && error.code !== '23505') {
      queryClient.setQueryData(likedQueryKey, previousLiked);
      toast({
        title: 'Kunde inte gilla',
        description: 'Försök igen senare.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Case sparat',
      description: `${stockCase.company_name || 'Företaget'} ligger nu i Gillade företag.`,
    });

    refetchLikedCases();
  };

  const handleSwipeSkip = (stockCase: StockCase) => {
    toast({
      title: 'Case hoppat över',
      description: `${stockCase.company_name || 'Företaget'} har markerats som passerat.`,
    });
  };

  const handleUndoSwipe = async ({ stockCase, direction }: { stockCase: StockCase; direction: 'left' | 'right' }) => {
    if (direction === 'right' && user) {
      const likedQueryKey = ['liked-stock-cases', user?.id];
      const previousLiked =
        queryClient.getQueryData<LikedStockCaseCache[]>(likedQueryKey) || [];

      queryClient.setQueryData<LikedStockCaseCache[]>(likedQueryKey, (prev = []) =>
        prev.filter((item) => item.id !== stockCase.id)
      );

      const { error } = await supabase
        .from('stock_case_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('stock_case_id', stockCase.id);

      if (error) {
        queryClient.setQueryData(likedQueryKey, previousLiked);
        toast({
          title: 'Kunde inte ångra gilla',
          description: 'Försök igen senare.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Gilla ångrat',
        description: `${stockCase.company_name || 'Företaget'} har tagits bort från Gillade företag.`,
      });

      refetchLikedCases();
    }

    if (direction === 'left') {
      toast({
        title: 'Swajp ångrad',
        description: `${stockCase.company_name || 'Företaget'} är tillbaka i din kortlek.`,
      });
    }
  };

  const remainingCases = filteredCases;
  return (
    <Layout>
      <div className="w-full pb-12">
        <div className="mx-auto w-full max-w-6xl space-y-8 px-4 sm:px-6 lg:px-0">
          <div className="w-full space-y-6 sm:space-y-8">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'cases' | 'liked' | 'upptack')}
              className="w-full"
            >
              <TabsList className="mx-auto grid w-full max-w-md grid-cols-3 gap-1 rounded-2xl bg-muted p-1 shadow-sm sm:gap-2">
                <TabsTrigger value="upptack" className="flex items-center gap-2 rounded-xl">
                  <Sparkles className="h-4 w-4" />
                  Upptäck
                </TabsTrigger>
                <TabsTrigger value="cases" className="flex items-center gap-2 rounded-xl">
                  <Layers className="h-4 w-4" />
                  Alla case
                </TabsTrigger>
                <TabsTrigger value="liked" className="flex items-center gap-2 rounded-xl">
                  <Heart className="h-4 w-4" />
                  Gillade företag
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upptack" className="space-y-6 sm:space-y-8">
                <div className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm sm:p-6">
                  {stockCasesLoading ? (
                    <div className="space-y-3">
                      <div className="h-4 w-28 rounded bg-muted" />
                      <div className="h-[420px] w-full rounded-2xl bg-muted/70" />
                    </div>
                  ) : filteredCases.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border/70 bg-background/60 px-6 py-16 text-center shadow-inner sm:px-10">
                      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="mb-3 text-xl font-semibold text-foreground">
                        {caseSearchTerm ? 'Inga case matchar din sökning' : 'Inga case hittades'}
                      </h3>
                      <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground sm:text-base">
                        {caseSearchTerm
                          ? 'Prova att justera dina sökkriterier eller rensa filtren.'
                          : 'Kom tillbaka senare för nya case från communityt.'}
                      </p>
                      {caseSearchTerm && (
                        <Button onClick={() => setCaseSearchTerm('')} variant="outline" className="rounded-xl border-border hover:bg-muted/50">
                          Rensa sökning
                        </Button>
                      )}
                    </div>
                  ) : (
                    <SwipeableCaseDeck
                      cases={filteredCases}
                      onLike={handleSwipeLike}
                      onSkip={handleSwipeSkip}
                      onViewDetails={handleDeckViewDetails}
                      onUndoSwipe={handleUndoSwipe}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="cases" className="space-y-6 sm:space-y-8">
                <div className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm sm:p-6">
                  <EnhancedStockCasesSearch
                    searchTerm={caseSearchTerm}
                    onSearchChange={setCaseSearchTerm}
                    selectedSector={selectedSector}
                    onSectorChange={setSelectedSector}
                    performanceFilter={performanceFilter}
                    onPerformanceFilterChange={setPerformanceFilter}
                    sortBy={caseSortBy}
                    onSortChange={setCaseSortBy}
                    sortOrder={caseSortOrder}
                    onSortOrderChange={setCaseSortOrder}
                    viewMode={caseViewMode}
                    onViewModeChange={setCaseViewMode}
                    availableSectors={availableSectors}
                    resultsCount={filteredCases.length}
                    totalCount={allStockCases?.length || 0}
                  />
                </div>

                <div
                  className={`grid gap-3 sm:gap-4 lg:gap-6 ${caseViewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}
                >
                  {remainingCases.map((sc) => (
                    <StockCaseCard
                      key={sc.id}
                      stockCase={sc}
                      onViewDetails={handleViewStockCaseDetails}
                      onDelete={isAdmin ? handleDeleteStockCase : undefined}
                      showMetaBadges={false}
                    />
                  ))}
                </div>

                {!stockCasesLoading && filteredCases.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-border/70 bg-background/60 px-6 py-16 text-center shadow-inner sm:px-10">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-foreground">
                      {caseSearchTerm ? 'Inga case matchar din sökning' : 'Inga case hittades'}
                    </h3>
                    <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground sm:text-base">
                      {caseSearchTerm ? 'Prova att justera dina sökkriterier eller rensa filtren.' : 'Kom tillbaka senare för nya case från communityt.'}
                    </p>
                    {caseSearchTerm && (
                      <Button onClick={() => setCaseSearchTerm('')} variant="outline" className="rounded-xl border-border hover:bg-muted/50">
                        Rensa sökning
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="liked" className="space-y-6 sm:space-y-8">
                {!user && (
                  <div className="rounded-3xl border border-border/60 bg-card/70 px-6 py-10 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Heart className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Logga in för att se gillade företag</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Skapa ett konto eller logga in för att samla dina favoritcase på samma ställe.
                    </p>
                    <div className="mt-6 flex justify-center">
                      <Button size="lg" className="rounded-xl" onClick={() => navigate('/auth')}>
                        Gå till inloggning
                      </Button>
                    </div>
                  </div>
                )}

                {user && (
                  <>
                    {likedCasesLoading && (
                      <div className="rounded-3xl border border-border/60 bg-card/70 px-6 py-10 text-center shadow-sm">
                        <p className="text-sm text-muted-foreground">Laddar dina gillade företag...</p>
                      </div>
                    )}

                    {!likedCasesLoading && likedStockCases.length === 0 && (
                      <div className="rounded-3xl border border-dashed border-border/70 bg-background/60 px-6 py-16 text-center shadow-inner sm:px-10">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                          <Heart className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="mb-3 text-xl font-semibold text-foreground">Inga gillade företag ännu</h3>
                        <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
                          Gilla ett case för att samla företag du vill följa. Dina gillade case visas här.
                        </p>
                      </div>
                    )}

                    {!likedCasesLoading && likedStockCases.length > 0 && (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:gap-6">
                        {likedStockCases.map((stockCase) => (
                          <StockCaseCard
                            key={stockCase.id}
                            stockCase={stockCase}
                            onViewDetails={handleViewStockCaseDetails}
                            onDelete={isAdmin ? handleDeleteStockCase : undefined}
                            showMetaBadges
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={!!detailCaseId} onOpenChange={(open) => !open && setDetailCaseId(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto border-border/60 bg-background p-0">
          {detailCaseId && <StockCaseDetail embedded embeddedCaseId={detailCaseId} showRiskWarning={false} />}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Discover;
