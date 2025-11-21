import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Heart,
  Layers,
  Sparkles,
} from 'lucide-react';

import Layout from '@/components/Layout';
import StockCaseCard from '@/components/StockCaseCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedStockCasesSearch from '@/components/EnhancedStockCasesSearch';

import { useStockCases } from '@/hooks/useStockCases';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { useLikedStockCases } from '@/hooks/useLikedStockCases';
import StockCaseDetail from './StockCaseDetail';

const Discover = () => {
  const navigate = useNavigate();
  const { stockCases: allStockCases, loading: stockCasesLoading } = useStockCases(false);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const { groupedByCompany, loading: likedCasesLoading } = useLikedStockCases();

  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('');
  const [caseSortBy, setCaseSortBy] = useState('created_at');
  const [caseSortOrder, setCaseSortOrder] = useState<'asc' | 'desc'>('desc');
  const [caseViewMode, setCaseViewMode] = useState<'grid' | 'list'>('grid');
  const [featuredCaseId, setFeaturedCaseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cases' | 'liked'>('cases');

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
  const handleDeleteStockCase = (id: string) => {
    toast({
      title: 'Funktion kommer snart',
      description: 'Det går ännu inte att ta bort aktiecase från denna vy.',
    });
  };

  useEffect(() => {
    if (stockCasesLoading) {
      return;
    }

    if (!filteredCases.length) {
      setFeaturedCaseId(null);
      return;
    }

    const existingFeatured = filteredCases.find((sc) => sc.id === featuredCaseId);
    if (!existingFeatured) {
      setFeaturedCaseId(filteredCases[0].id);
    }
  }, [filteredCases, featuredCaseId, stockCasesLoading]);

  const featuredCase = featuredCaseId
    ? filteredCases.find((sc) => sc.id === featuredCaseId)
    : filteredCases[0];
  const featuredCaseIndex = featuredCase
    ? filteredCases.findIndex((sc) => sc.id === featuredCase.id)
    : -1;
  const remainingCases = featuredCase
    ? filteredCases.filter((sc) => sc.id !== featuredCase.id)
    : filteredCases;
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

          <div className="w-full space-y-6 sm:space-y-8">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'cases' | 'liked')} className="w-full">
              <TabsList className="mx-auto grid w-full max-w-md grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
                <TabsTrigger value="cases" className="flex items-center gap-2 rounded-xl">
                  <Layers className="h-4 w-4" />
                  Alla case
                </TabsTrigger>
                <TabsTrigger value="liked" className="flex items-center gap-2 rounded-xl">
                  <Heart className="h-4 w-4" />
                  Gillade företag
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
                    resultsCount={filteredCases.length}
                    totalCount={allStockCases?.length || 0}
                  />
                </div>

                {featuredCase && (
                  <StockCaseDetail embedded embeddedCaseId={featuredCase.id} />
                )}

                <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${caseViewMode === 'grid' ? 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
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

                    {!likedCasesLoading && groupedByCompany.length === 0 && (
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

                    {!likedCasesLoading && groupedByCompany.length > 0 && (
                      <div className="space-y-6">
                        {groupedByCompany.map((group) => (
                          <section
                            key={group.companyName}
                            className="space-y-4 rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm sm:p-6"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Gillade case</p>
                                <h3 className="text-xl font-semibold text-foreground sm:text-2xl">{group.companyName}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {group.cases.length === 1
                                    ? '1 case du har gillat'
                                    : `${group.cases.length} case du har gillat`}
                                </p>
                              </div>
                            </div>
                            <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3">
                              {group.cases.map((stockCase) => (
                                <StockCaseCard
                                  key={stockCase.id}
                                  stockCase={stockCase}
                                  onViewDetails={handleViewStockCaseDetails}
                                  onDelete={isAdmin ? handleDeleteStockCase : undefined}
                                  showMetaBadges={true}
                                />
                              ))}
                            </div>
                          </section>
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
    </Layout>
  );
};

export default Discover;
