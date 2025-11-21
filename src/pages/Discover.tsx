import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Camera, Newspaper, Sparkles } from 'lucide-react';

import Layout from '@/components/Layout';
import StockCaseCard from '@/components/StockCaseCard';
import { Button } from '@/components/ui/button';
import EnhancedStockCasesSearch from '@/components/EnhancedStockCasesSearch';
import StockCaseSpotlight from '@/components/StockCaseSpotlight';

import { useStockCases } from '@/hooks/useStockCases';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Discover = () => {
  const navigate = useNavigate();
  const { stockCases: allStockCases, loading: stockCasesLoading } = useStockCases(false);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('');
  const [caseSortBy, setCaseSortBy] = useState('created_at');
  const [caseSortOrder, setCaseSortOrder] = useState<'asc' | 'desc'>('desc');
  const [caseViewMode, setCaseViewMode] = useState<'grid' | 'list'>('grid');
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [caseCollection, setCaseCollection] = useState<'all' | 'liked'>('all');
  const [likedCaseIds, setLikedCaseIds] = useState<string[]>([]);
  const [likedCasesLoading, setLikedCasesLoading] = useState(false);

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

  const displayedCases = useMemo(() => {
    if (caseCollection === 'liked') {
      return filteredCases.filter((stockCase) => likedCaseIds.includes(stockCase.id));
    }
    return filteredCases;
  }, [caseCollection, filteredCases, likedCaseIds]);

  const availableSectors = useMemo(() => {
    const sectors = new Set<string>();
    allStockCases?.forEach((sc) => sc.sector && sectors.add(sc.sector));
    return [...sectors].sort();
  }, [allStockCases]);

  useEffect(() => {
    setSpotlightIndex((current) => {
      if (displayedCases.length === 0) {
        return 0;
      }

      if (current === 0 && current < displayedCases.length) {
        return current;
      }

      return 0;
    });
  }, [displayedCases]);

  useEffect(() => {
    const selectedCaseId = searchParams.get('case');

    if (!displayedCases.length) {
      if (selectedCaseId) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('case');
          return next;
        });
      }
      return;
    }

    if (selectedCaseId) {
      const nextIndex = displayedCases.findIndex((stockCase) => stockCase.id === selectedCaseId);
      if (nextIndex !== -1 && nextIndex !== spotlightIndex) {
        setSpotlightIndex(nextIndex);
        return;
      }
    }

    if (!selectedCaseId && displayedCases[spotlightIndex]) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('case', displayedCases[spotlightIndex].id);
        return next;
      });
    }
  }, [displayedCases, searchParams, setSearchParams, spotlightIndex]);

  useEffect(() => {
    if (!displayedCases.length) {
      return;
    }

    const selectedCaseId = displayedCases[spotlightIndex]?.id;
    if (!selectedCaseId) {
      return;
    }

    if (searchParams.get('case') === selectedCaseId) {
      return;
    }

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('case', selectedCaseId);
      return next;
    });
  }, [displayedCases, searchParams, setSearchParams, spotlightIndex]);

  useEffect(() => {
    let isMounted = true;

    const fetchLikedCases = async () => {
      if (!user) {
        setLikedCaseIds([]);
        return;
      }

      setLikedCasesLoading(true);
      const { data, error } = await supabase
        .from('stock_case_likes')
        .select('stock_case_id')
        .eq('user_id', user.id);

      if (!isMounted) return;

      if (error) {
        console.error('Error fetching liked cases:', error);
        toast({
          title: 'Kunde inte hämta gillade case',
          description: 'Försök igen senare.',
          variant: 'destructive',
        });
        setLikedCaseIds([]);
      } else {
        setLikedCaseIds(data?.map((entry) => entry.stock_case_id) || []);
      }

      setLikedCasesLoading(false);
    };

    fetchLikedCases();

    return () => {
      isMounted = false;
    };
  }, [toast, user]);

  const handleViewStockCaseDetails = (id: string) => {
    const index = displayedCases.findIndex((stockCase) => stockCase.id === id);
    if (index !== -1) {
      setSpotlightIndex(index);
    }

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('case', id);
      return next;
    });

    const spotlightEl = document.getElementById('discover-spotlight');
    if (spotlightEl) {
      spotlightEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  const handleDeleteStockCase = (id: string) => {
    toast({
      title: 'Funktion kommer snart',
      description: 'Det går ännu inte att ta bort aktiecase från denna vy.',
    });
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

          <div className="flex items-center justify-between gap-3 rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm sm:p-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Vy</p>
              <h3 className="text-lg font-semibold text-foreground sm:text-xl">Välj vilka case som visas</h3>
              <p className="text-sm text-muted-foreground">Växla mellan alla tillgängliga case och dina gillade favoriter.</p>
            </div>
            <div className="inline-flex rounded-full bg-muted/60 p-1 text-sm font-medium shadow-inner">
              <Button
                variant={caseCollection === 'all' ? 'default' : 'ghost'}
                className="rounded-full px-4"
                onClick={() => setCaseCollection('all')}
              >
                Alla case
              </Button>
              <Button
                variant={caseCollection === 'liked' ? 'default' : 'ghost'}
                className="rounded-full px-4"
                onClick={() => setCaseCollection('liked')}
                disabled={likedCasesLoading}
              >
                Gillade {likedCaseIds.length > 0 ? `(${likedCaseIds.length})` : ''}
              </Button>
            </div>
          </div>

          <StockCaseSpotlight
            cases={displayedCases}
            currentIndex={spotlightIndex}
            onIndexChange={setSpotlightIndex}
            onOpenDetails={(id) => navigate(`/stock-cases/${id}`)}
          />

          <div className="w-full space-y-6 sm:space-y-8">
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
                resultsCount={displayedCases.length}
                totalCount={allStockCases?.length || 0}
              />
            </div>

            <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${caseViewMode === 'grid' ? 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {displayedCases.map((sc) => (
                <StockCaseCard
                  key={sc.id}
                  stockCase={sc}
                  onViewDetails={handleViewStockCaseDetails}
                  onDelete={isAdmin ? handleDeleteStockCase : undefined}
                  showMetaBadges={false}
                />
              ))}
            </div>

            {!stockCasesLoading && displayedCases.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border/70 bg-background/60 px-6 py-16 text-center shadow-inner sm:px-10">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">
                  {caseCollection === 'liked'
                    ? 'Du har inga gillade case ännu'
                    : caseSearchTerm
                      ? 'Inga case matchar din sökning'
                      : 'Inga case hittades'}
                </h3>
                <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground sm:text-base">
                  {caseCollection === 'liked'
                    ? 'Gilla ett case för att samla dina favoriter här.'
                    : caseSearchTerm
                      ? 'Prova att justera dina sökkriterier eller rensa filtren.'
                      : 'Kom tillbaka senare för nya case från communityt.'}
                </p>
                {caseSearchTerm && (
                  <Button onClick={() => setCaseSearchTerm('')} variant="outline" className="rounded-xl border-border hover:bg-muted/50">
                    Rensa sökning
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Discover;
