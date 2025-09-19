import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';

import StockCaseCard from '@/components/StockCaseCard';
import EnhancedStockCasesSearch from '@/components/EnhancedStockCasesSearch';

import { useStockCases } from '@/hooks/useStockCases';

const Discover = () => {
  const navigate = useNavigate();
  const { stockCases: allStockCases, loading: stockCasesLoading } = useStockCases(false);

  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('');
  const [caseSortBy, setCaseSortBy] = useState('created_at');
  const [caseSortOrder, setCaseSortOrder] = useState<'asc' | 'desc'>('desc');
  const [caseViewMode, setCaseViewMode] = useState<'grid' | 'list'>('grid');

  const getFilteredCases = useMemo(() => {
    let filtered = [...(allStockCases || [])];
    if (caseSearchTerm) {
      const lower = caseSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (sc) =>
          sc.title.toLowerCase().includes(lower) ||
          sc.company_name?.toLowerCase().includes(lower) ||
          sc.description?.toLowerCase().includes(lower) ||
          sc.sector?.toLowerCase().includes(lower) ||
          sc.profiles?.display_name?.toLowerCase().includes(lower) ||
          sc.profiles?.username?.toLowerCase().includes(lower)
      );
    }
    if (selectedSector && selectedSector !== 'all-sectors') {
      filtered = filtered.filter((sc) => sc.sector === selectedSector);
    }
    if (performanceFilter && performanceFilter !== 'all-results') {
      filtered = filtered.filter((sc) => {
        const perf = sc.performance_percentage || 0;
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
          aVal = 0;
          bVal = 0;
          break;
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        default:
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
      }
      return caseSortOrder === 'asc'
        ? aVal < bVal
          ? -1
          : aVal > bVal
          ? 1
          : 0
        : aVal > bVal
        ? -1
        : aVal < bVal
        ? 1
        : 0;
    });
    return filtered.slice(0, 6);
  }, [allStockCases, caseSearchTerm, selectedSector, performanceFilter, caseSortBy, caseSortOrder]);

  const availableSectors = useMemo(() => {
    const sectors = new Set<string>();
    allStockCases?.forEach((sc) => sc.sector && sectors.add(sc.sector));
    return [...sectors].sort();
  }, [allStockCases]);

  const handleViewStockCaseDetails = (id: string) => navigate(`/stock-cases/${id}`);
  const handleDeleteStockCase = (id: string) => console.log('Delete stock case:', id);
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

          <Tabs defaultValue="cases" className="w-full space-y-6 sm:space-y-8">
            <TabsList className="grid w-full grid-cols-1 gap-2 rounded-2xl border border-border/80 bg-muted/40 p-1.5 sm:mx-auto sm:max-w-xs sm:gap-3 sm:p-2">
              <TabsTrigger value="cases">
                <Camera className="h-4 w-4" /> Case
              </TabsTrigger>
            </TabsList>

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
                  resultsCount={getFilteredCases.length}
                  totalCount={allStockCases?.length || 0}
                />
              </div>

              <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${caseViewMode === 'grid' ? 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {getFilteredCases.map((sc) => (
                  <StockCaseCard
                    key={sc.id}
                    stockCase={sc}
                    onViewDetails={handleViewStockCaseDetails}
                    onDelete={handleDeleteStockCase}
                    showMetaBadges={false}
                  />
                ))}
              </div>

              {!stockCasesLoading && getFilteredCases.length === 0 && (
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

          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Discover;
