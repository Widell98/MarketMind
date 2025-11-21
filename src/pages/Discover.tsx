import type { PointerEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Camera, Heart, Newspaper, Sparkles, X } from 'lucide-react';

import Layout from '@/components/Layout';
import StockCaseCard from '@/components/StockCaseCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EnhancedStockCasesSearch from '@/components/EnhancedStockCasesSearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useStockCases } from '@/hooks/useStockCases';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useSwipeLikedCases } from '@/hooks/useSwipeLikedCases';
import { useAuth } from '@/contexts/AuthContext';

const DISMISSED_STORAGE_KEY = 'dismissedStockCaseIds';

const buildDismissedStorageKey = (userId?: string) =>
  userId ? `${DISMISSED_STORAGE_KEY}:${userId}` : DISMISSED_STORAGE_KEY;

const readDismissedCaseIds = (userId?: string): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(buildDismissedStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Could not read dismissed stock cases from localStorage', error);
    return [];
  }
};

const persistDismissedCaseIds = (ids: string[], userId?: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(buildDismissedStorageKey(userId), JSON.stringify(ids));
  } catch (error) {
    console.error('Could not persist dismissed stock cases to localStorage', error);
  }
};

const Discover = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stockCases: allStockCases, loading: stockCasesLoading } = useStockCases(false);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  const {
    likedCaseIds,
    likedCount,
    loading: likedCasesLoading,
    likeCase,
    removeLikedCase,
    clearLikedCases,
  } = useSwipeLikedCases();

  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('');
  const [caseSortBy, setCaseSortBy] = useState('created_at');
  const [caseSortOrder, setCaseSortOrder] = useState<'asc' | 'desc'>('desc');
  const [caseViewMode, setCaseViewMode] = useState<'grid' | 'list' | 'swipe'>('grid');
  const [activeTab, setActiveTab] = useState<'discover' | 'liked'>('discover');
  const [activeSwipeIndex, setActiveSwipeIndex] = useState(0);
  const [dismissedCaseIds, setDismissedCaseIds] = useState<string[]>([]);
  const [swipeDelta, setSwipeDelta] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setDismissedCaseIds(readDismissedCaseIds(user?.id));
  }, [user?.id]);

  const updateDismissedCaseIds = (updater: (prev: string[]) => string[]) => {
    setDismissedCaseIds((prev) => {
      const next = updater(prev);
      persistDismissedCaseIds(next, user?.id);
      return next;
    });
  };

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

    return filtered.filter((sc) => !dismissedCaseIds.includes(sc.id));
  }, [
    allStockCases,
    caseSearchTerm,
    selectedSector,
    performanceFilter,
    caseSortBy,
    caseSortOrder,
    dismissedCaseIds,
  ]);

  useEffect(() => {
    setActiveSwipeIndex(0);
    setSwipeDelta({ x: 0, y: 0 });
    setIsAnimatingOut(false);
  }, [caseViewMode, filteredCases.length]);

  const availableSectors = useMemo(() => {
    const sectors = new Set<string>();
    allStockCases?.forEach((sc) => sc.sector && sectors.add(sc.sector));
    return [...sectors].sort();
  }, [allStockCases]);

  const handleViewStockCaseDetails = (id: string) => navigate(`/stock-cases/${id}`);
  const handleDeleteStockCase = (id: string) => {
    toast({
      title: 'Funktion kommer snart',
      description: 'Det går ännu inte att ta bort aktiecase från denna vy.',
    });
  };

  const likedCases = useMemo(
    () => (allStockCases || []).filter((sc) => likedCaseIds.includes(sc.id)),
    [allStockCases, likedCaseIds]
  );

  const currentSwipeCase = filteredCases[activeSwipeIndex];

  const handleSwipeLike = (caseId: string) => {
    updateDismissedCaseIds((prev) => prev.filter((id) => id !== caseId));
    likeCase(caseId);
    setActiveSwipeIndex((prev) => Math.min(filteredCases.length - 1, prev + 1));
    toast({
      title: 'Tillagt i gillade case',
      description: 'Du hittar alla gillade case i flödet för Gillade case.',
    });
  };

  const handleSwipeSkip = () => {
    if (currentSwipeCase) {
      updateDismissedCaseIds((prev) =>
        prev.includes(currentSwipeCase.id) ? prev : [...prev, currentSwipeCase.id]
      );
      toast({
        title: 'Case avfärdat',
        description: 'Caseet visas inte i flödet. Återställ om du vill se allt igen.',
      });
    }
    setActiveSwipeIndex((prev) => Math.min(filteredCases.length - 1, prev + 1));
  };

  const handleResetDismissed = () => {
    updateDismissedCaseIds(() => []);
    toast({
      title: 'Avfärdade case återställda',
      description: 'Alla case visas nu igen i Discover.',
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!currentSwipeCase || isAnimatingOut) return;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
    setIsAnimatingOut(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !pointerStartRef.current) return;
    const deltaX = event.clientX - pointerStartRef.current.x;
    const deltaY = event.clientY - pointerStartRef.current.y;
    setSwipeDelta({ x: deltaX, y: deltaY });
  };

  const runSwipeActionWithAnimation = (
    direction: 'like' | 'skip',
    velocityX: number,
    velocityY: number
  ) => {
    setIsAnimatingOut(true);
    pointerStartRef.current = null;
    setSwipeDelta({
      x: direction === 'like' ? Math.max(320, velocityX * 1.1) : Math.min(-320, velocityX * 1.1),
      y: velocityY,
    });

    setTimeout(() => {
      setIsAnimatingOut(false);
      setSwipeDelta({ x: 0, y: 0 });
      if (direction === 'like' && currentSwipeCase) {
        handleSwipeLike(currentSwipeCase.id);
      } else {
        handleSwipeSkip();
      }
    }, 180);
  };

  const resetSwipePosition = () => {
    setSwipeDelta({ x: 0, y: 0 });
    setIsDragging(false);
    setIsAnimatingOut(false);
    pointerStartRef.current = null;
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDragging(false);
    pointerStartRef.current = null;

    const threshold = 120;
    if (swipeDelta.x > threshold && currentSwipeCase) {
      runSwipeActionWithAnimation('like', swipeDelta.x, swipeDelta.y);
      return;
    }
    if (swipeDelta.x < -threshold) {
      runSwipeActionWithAnimation('skip', swipeDelta.x, swipeDelta.y);
      return;
    }

    resetSwipePosition();
  };
  return (
    <Layout>
      <div className="w-full pb-12">
        <div className="mx-auto w-full max-w-6xl space-y-8 px-1 sm:px-4 lg:px-0">
          <section className="rounded-3xl border border-border/60 bg-card/70 p-6 text-center shadow-sm supports-[backdrop-filter]:backdrop-blur-sm sm:p-10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 sm:h-14 sm:w-14">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Upptäck & Utforska
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Hitta inspiration genom visuella aktiecase och AI-drivna idéer.
            </p>
          </section>

          <section className="rounded-3xl border border-border/60 bg-gradient-to-r from-primary/5 via-background to-background p-6 shadow-sm supports-[backdrop-filter]:backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Newspaper className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Nyhet</p>
                  <h2 className="text-xl font-semibold text-foreground sm:text-2xl">AI-rapporter har flyttat</h2>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Du hittar nu de genererade rapporterna och marknadsinsikterna på vår nya nyhetssida.
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                className="group rounded-xl px-5"
                onClick={() => navigate('/news')}
              >
                <span>Öppna nyhetssidan</span>
                <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
              </Button>
            </div>
          </section>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'discover' | 'liked')}
            className="w-full space-y-6 sm:space-y-8"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/60">
              <TabsTrigger value="discover" className="rounded-2xl">
                Alla bolag
              </TabsTrigger>
              <TabsTrigger value="liked" className="rounded-2xl">
                <div className="flex items-center gap-2">
                  Gillade case
                  <Badge variant="secondary" className="px-2 py-0.5 text-xs font-semibold">
                    {likedCount}
                  </Badge>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-6 sm:space-y-8">
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
                  enableSwipeView
                />
              </div>

              {caseViewMode === 'swipe' ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">Swipe-läge</p>
                      <p className="text-sm text-muted-foreground">
                        Bläddra mellan filtrerade case i en staplad vy. Dina filtreringar följer med när du växlar mellan lägena.
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {filteredCases.length > 0
                        ? `${activeSwipeIndex + 1} / ${filteredCases.length}`
                        : '0 / 0'}
                    </div>
                  </div>

                  {dismissedCaseIds.length > 0 && (
                    <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-muted/40 p-3 text-sm text-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-0.5">
                        <p className="font-semibold">{dismissedCaseIds.length} case är dolda</p>
                        <p className="text-muted-foreground">
                          Återställ för att visa alla case igen och fortsätta swipa från början.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={handleResetDismissed}>
                        Återställ avfärdade
                      </Button>
                    </div>
                  )}

                  {filteredCases.length > 0 ? (
                    <div className="space-y-6">
                      <div className="relative mx-auto h-[520px] max-w-3xl">
                        {filteredCases.slice(activeSwipeIndex, activeSwipeIndex + 3).map((sc, idx) => {
                          const offset = idx * 14;
                          const scale = 1 - idx * 0.03;
                          const isTopCard = idx === 0;
                          const rotate = isTopCard ? swipeDelta.x / 14 : 0;
                          const translateX = isTopCard ? swipeDelta.x : 0;
                          const translateY = offset + (isTopCard ? swipeDelta.y : 0);
                          const opacity = isTopCard
                            ? 1
                            : Math.max(0.85, 1 - idx * 0.05 + Math.min(Math.abs(swipeDelta.x) / 800, 0.08));
                          return (
                            <div
                              key={sc.id}
                              className={`absolute inset-0 ${
                                isTopCard ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
                              }`}
                              style={{
                                transform: `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
                                zIndex: 10 - idx,
                                opacity,
                                transition: isDragging ? 'none' : 'transform 0.2s ease, opacity 0.2s ease',
                                willChange: isTopCard ? 'transform' : undefined,
                              }}
                              onPointerDown={isTopCard ? handlePointerDown : undefined}
                              onPointerMove={isTopCard ? handlePointerMove : undefined}
                              onPointerUp={isTopCard ? handlePointerEnd : undefined}
                              onPointerCancel={isTopCard ? handlePointerEnd : undefined}
                              onPointerLeave={isTopCard && isDragging ? handlePointerEnd : undefined}
                            >
                              <StockCaseCard
                                stockCase={sc}
                                onViewDetails={handleViewStockCaseDetails}
                                onDelete={isAdmin ? handleDeleteStockCase : undefined}
                                showMetaBadges={false}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          disabled={activeSwipeIndex === 0}
                          onClick={() => setActiveSwipeIndex((prev) => Math.max(0, prev - 1))}
                        >
                          Föregående
                        </Button>
                        <Button
                          className="rounded-xl"
                          disabled={activeSwipeIndex >= filteredCases.length - 1}
                          onClick={() => setActiveSwipeIndex((prev) => Math.min(filteredCases.length - 1, prev + 1))}
                        >
                          Nästa
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-xl"
                          onClick={() => currentSwipeCase && handleViewStockCaseDetails(currentSwipeCase.id)}
                          disabled={!currentSwipeCase}
                        >
                          Visa detaljer
                        </Button>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          onClick={handleSwipeSkip}
                          disabled={!currentSwipeCase || activeSwipeIndex >= filteredCases.length - 1}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Hoppa över
                        </Button>
                        <Button
                          className="rounded-xl"
                          onClick={() => currentSwipeCase && handleSwipeLike(currentSwipeCase.id)}
                          disabled={!currentSwipeCase}
                        >
                          <Heart className="mr-2 h-4 w-4" />
                          Gilla och nästa
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-border/70 bg-background/60 px-6 py-12 text-center shadow-inner sm:px-10">
                      <h3 className="mb-2 text-lg font-semibold text-foreground">Inga case att visa i swipe-läget</h3>
                      <p className="text-sm text-muted-foreground">
                        Justera dina filter eller sökningar för att se fler aktiecase.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${caseViewMode === 'grid' ? 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {filteredCases.map((sc) => (
                    <StockCaseCard
                      key={sc.id}
                      stockCase={sc}
                      onViewDetails={handleViewStockCaseDetails}
                      onDelete={isAdmin ? handleDeleteStockCase : undefined}
                      showMetaBadges={false}
                    />
                  ))}
                </div>
              )}

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
              <div className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Gillade case</p>
                    <p className="text-sm text-muted-foreground">
                      Här samlas alla case du har gillat via swipe. Du kan gå till detaljer eller ta bort dem från listan.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-2 py-1 text-xs font-semibold">
                      {likedCount} case
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={clearLikedCases}
                      disabled={likedCount === 0}
                    >
                      Rensa alla
                    </Button>
                  </div>
                </div>
              </div>

              {likedCasesLoading ? (
                <p className="text-sm text-muted-foreground">Laddar dina gillade case...</p>
              ) : likedCases.length > 0 ? (
                <div className="grid gap-3 sm:gap-4 lg:gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {likedCases.map((sc) => (
                    <div key={sc.id} className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/60 p-3 shadow-sm">
                      <StockCaseCard
                        stockCase={sc}
                        onViewDetails={handleViewStockCaseDetails}
                        onDelete={isAdmin ? handleDeleteStockCase : undefined}
                        showMetaBadges={false}
                      />
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => removeLikedCase(sc.id)}
                        >
                          Ta bort från gillade
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-xl"
                          onClick={() => handleViewStockCaseDetails(sc.id)}
                        >
                          Öppna case
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-border/70 bg-background/60 px-6 py-16 text-center shadow-inner sm:px-10">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <Heart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-foreground">Inga gillade case ännu</h3>
                  <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground sm:text-base">
                    Gå till swipe-läget under Alla bolag och gilla case för att samla dem här.
                  </p>
                  <Button onClick={() => setActiveTab('discover')} className="rounded-xl">
                    Utforska case
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Discover;
