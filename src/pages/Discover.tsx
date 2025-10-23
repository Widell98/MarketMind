import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';

import StockCaseCard from '@/components/StockCaseCard';
import EnhancedStockCasesSearch from '@/components/EnhancedStockCasesSearch';
import AIWeeklyPicks from '@/components/AIWeeklyPicks';

import { useStockCases } from '@/hooks/useStockCases';
import { useToast } from '@/hooks/use-toast';

const Discover = () => {
  const navigate = useNavigate();
  const { stockCases: allStockCases, loading: stockCasesLoading } = useStockCases(false);
  const { toast } = useToast();

  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('');
  const [caseSortBy, setCaseSortBy] = useState('created_at');
  const [caseSortOrder, setCaseSortOrder] = useState<'asc' | 'desc'>('desc');
  const [caseViewMode, setCaseViewMode] = useState<'grid' | 'list'>('grid');

  const filteredCases = useMemo(() => {
    let filtered = [...(allStockCases || [])];
    const normalizedSearchTerm = caseSearchTerm.trim().toLowerCase();

    if (normalizedSearchTerm) {
      filtered = filtered.filter((sc) => {
        const sector = sc.sector?.toLowerCase();
        const title = sc.title.toLowerCase();
        const company = sc.company_name?.toLowerCase();
        const description = sc.description?.toLowerCase();
        const displayName = sc.profiles?.display_name?.toLowerCase();
        const username = sc.profiles?.username?.toLowerCase();

        return (
          title.includes(normalizedSearchTerm) ||
          company?.includes(normalizedSearchTerm) ||
          description?.includes(normalizedSearchTerm) ||
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

          <AIWeeklyPicks />

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
                resultsCount={filteredCases.length}
                totalCount={allStockCases?.length || 0}
              />
            </div>

            <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${caseViewMode === 'grid' ? 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {filteredCases.map((sc) => (
                <StockCaseCard
                  key={sc.id}
                  stockCase={sc}
                  onViewDetails={handleViewStockCaseDetails}
                  onDelete={handleDeleteStockCase}
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
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Discover;
