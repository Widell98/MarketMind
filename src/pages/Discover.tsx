import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Camera, Palette, LayoutDashboard, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';

import StockCaseCard from '@/components/StockCaseCard';
import EnhancedStockCasesSearch from '@/components/EnhancedStockCasesSearch';
import AIGenerationAdminControls from '@/components/AIGenerationAdminControls';

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
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'ai' | 'community'>('all');

  const { aiGeneratedCount, communityCount } = useMemo(() => {
    const aiCount = allStockCases?.filter((sc) => sc.ai_generated).length ?? 0;
    const communityCases = (allStockCases?.length ?? 0) - aiCount;

    return {
      aiGeneratedCount: aiCount,
      communityCount: communityCases,
    };
  }, [allStockCases]);

  const designSuggestions = useMemo(
    () => [
      {
        title: 'Visa AI-case som logotyper',
        description:
          'Ge AI-genererade case en distinkt logotypstil för att skapa en tydlig visuell skillnad mot community-casen.',
        icon: Palette,
      },
      {
        title: 'Snabba filter för ursprung',
        description:
          'Låt användaren växla mellan AI och community för att snabbare hitta det innehåll som passar deras behov.',
        icon: LayoutDashboard,
      },
      {
        title: 'Lyft fram communityn',
        description:
          'Visa hur många case som är skapade av investerare för att stärka känslan av samarbete och trovärdighet.',
        icon: Users,
      },
    ],
    []
  );

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

    if (creatorFilter === 'ai') {
      filtered = filtered.filter((sc) => sc.ai_generated);
    } else if (creatorFilter === 'community') {
      filtered = filtered.filter((sc) => !sc.ai_generated);
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
  }, [
    allStockCases,
    caseSearchTerm,
    selectedSector,
    performanceFilter,
    caseSortBy,
    caseSortOrder,
    creatorFilter,
  ]);

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
          <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm supports-[backdrop-filter]:backdrop-blur-md sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_55%)]" />
            <div className="relative z-10 flex flex-col gap-8">
              <div className="flex flex-col gap-6 text-left sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    <Sparkles className="h-4 w-4" />
                    Ny förbättrad upplevelse
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                      Upptäck & Utforska
                    </h1>
                    <p className="text-base text-muted-foreground sm:text-lg">
                      Hitta inspiration genom visuella aktiecase och AI-drivna idéer. Den nya designen lyfter fram skillnaden mellan AI-genererat innehåll och communityns egna spaningar.
                    </p>
                  </div>
                </div>

                <div className="grid w-full gap-4 sm:w-64">
                  <div className="rounded-2xl border border-primary/20 bg-background/70 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                      AI-genererade case
                    </p>
                    <p className="mt-1 text-3xl font-semibold text-foreground">{aiGeneratedCount}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Presenteras nu som logoinspirerade kort för att förstärka deras ursprung.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Community-case
                    </p>
                    <p className="mt-1 text-3xl font-semibold text-foreground">{communityCount}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Bygger vidare på insikter från investerare i nätverket.
                    </p>
                  </div>
                </div>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {designSuggestions.map((suggestion) => {
                  const Icon = suggestion.icon;
                  return (
                    <li
                      key={suggestion.title}
                      className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-inner"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <p className="text-sm font-semibold text-foreground">{suggestion.title}</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{suggestion.description}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <AIGenerationAdminControls />

          <div className="rounded-3xl border border-dashed border-border/60 bg-card/60 p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Filtrera efter ursprung
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Växla snabbt mellan AI-genererade och community-skapade case.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={creatorFilter === 'all' ? 'default' : 'ghost'}
                  onClick={() => setCreatorFilter('all')}
                  className={`rounded-full px-4 ${
                    creatorFilter === 'all'
                      ? 'shadow-md'
                      : 'border border-border/60 bg-background/80 text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  Alla case
                </Button>
                <Button
                  type="button"
                  variant={creatorFilter === 'ai' ? 'default' : 'ghost'}
                  onClick={() => setCreatorFilter('ai')}
                  className={`rounded-full px-4 ${
                    creatorFilter === 'ai'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'border border-border/60 bg-background/80 text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  AI-genererat
                </Button>
                <Button
                  type="button"
                  variant={creatorFilter === 'community' ? 'default' : 'ghost'}
                  onClick={() => setCreatorFilter('community')}
                  className={`rounded-full px-4 ${
                    creatorFilter === 'community'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'border border-border/60 bg-background/80 text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  Community
                </Button>
              </div>
            </div>
          </div>

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

            <div
              className={`grid gap-3 sm:gap-4 lg:gap-6 ${
                caseViewMode === 'grid' ? 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
              }`}
            >
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
