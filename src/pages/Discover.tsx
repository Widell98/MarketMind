import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Camera, PenTool, BookOpen, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';

import StockCaseCard from '@/components/StockCaseCard';
import EnhancedAnalysisCard from '@/components/EnhancedAnalysisCard';
import EnhancedAnalysesSearch from '@/components/EnhancedAnalysesSearch';
import EnhancedStockCasesSearch from '@/components/EnhancedStockCasesSearch';
import { Analysis } from '@/types/analysis';

// Hooks
import { useStockCases } from '@/hooks/useStockCases';
import { useAnalyses } from '@/hooks/useAnalyses';
import { useFollowingAnalyses } from '@/hooks/useFollowingAnalyses';
const Discover = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();

  // Main tab state
  const [activeTab, setActiveTab] = useState('cases');

  // Stock cases filters
  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('');
  const [caseSortBy, setCaseSortBy] = useState('created_at');
  const [caseSortOrder, setCaseSortOrder] = useState('desc');
  const [caseViewMode, setCaseViewMode] = useState('grid');

  // Analysis filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [analysisSubTab, setAnalysisSubTab] = useState('all');

  // Data hooks
  const {
    stockCases: allStockCases,
    loading: stockCasesLoading
  } = useStockCases(false);
  const {
    data: analyses,
    isLoading: analysesLoading
  } = useAnalyses(50);
  const {
    data: followingAnalyses,
    isLoading: followingAnalysesLoading
  } = useFollowingAnalyses();


  // Filter and sort stock cases
  const getFilteredCases = useMemo(() => {
    let filtered = [...(allStockCases || [])];
    
    // Search filter
    if (caseSearchTerm) {
      const lowerSearchTerm = caseSearchTerm.toLowerCase();
      filtered = filtered.filter(stockCase => 
        stockCase.title.toLowerCase().includes(lowerSearchTerm) ||
        stockCase.company_name?.toLowerCase().includes(lowerSearchTerm) ||
        stockCase.description?.toLowerCase().includes(lowerSearchTerm) ||
        stockCase.sector?.toLowerCase().includes(lowerSearchTerm) ||
        stockCase.profiles?.display_name?.toLowerCase().includes(lowerSearchTerm) ||
        stockCase.profiles?.username?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Sector filter
    if (selectedSector && selectedSector !== 'all-sectors') {
      filtered = filtered.filter(stockCase => stockCase.sector === selectedSector);
    }

    // Performance filter
    if (performanceFilter && performanceFilter !== 'all-results') {
      filtered = filtered.filter(stockCase => {
        const performance = stockCase.performance_percentage || 0;
        switch (performanceFilter) {
          case 'positive':
            return performance > 0;
          case 'negative':
            return performance < 0;
          case 'high':
            return performance > 10;
          case 'low':
            return performance < 5;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (caseSortBy) {
        case 'performance':
          aValue = a.performance_percentage || 0;
          bValue = b.performance_percentage || 0;
          break;
        case 'likes':
          aValue = 0; // Note: likes not available in StockCase type
          bValue = 0; // Note: likes not available in StockCase type
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }

      if (caseSortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Limit to 6 cases per page
    return filtered.slice(0, 6);
  }, [allStockCases, caseSearchTerm, selectedSector, performanceFilter, caseSortBy, caseSortOrder]);

  // Get available sectors
  const availableSectors = useMemo(() => {
    const sectors = new Set<string>();
    allStockCases?.forEach(stockCase => {
      if (stockCase.sector) sectors.add(stockCase.sector);
    });
    return Array.from(sectors).sort();
  }, [allStockCases]);

  // Filter and sort analyses
  const filteredAnalyses = useMemo(() => {
    let filtered = [...(analyses || [])];
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(analysis => analysis.title.toLowerCase().includes(lowerSearchTerm) || analysis.content.toLowerCase().includes(lowerSearchTerm) || analysis.profiles?.display_name?.toLowerCase().includes(lowerSearchTerm) || analysis.profiles?.username?.toLowerCase().includes(lowerSearchTerm) || analysis.tags?.some((tag: string) => tag.toLowerCase().includes(lowerSearchTerm)));
    }
    if (selectedType) {
      filtered = filtered.filter(analysis => analysis.analysis_type === selectedType);
    }
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'likes_count':
          aValue = a.likes_count || 0;
          bValue = b.likes_count || 0;
          break;
        case 'views_count':
          aValue = a.views_count || 0;
          bValue = b.views_count || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    return filtered;
  }, [analyses, searchTerm, selectedType, sortBy, sortOrder]);

  // Filter following analyses
  const filteredFollowingAnalyses = useMemo(() => {
    if (!searchTerm) return followingAnalyses || [];
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (followingAnalyses || []).filter(analysis => analysis.title.toLowerCase().includes(lowerSearchTerm) || analysis.content.toLowerCase().includes(lowerSearchTerm) || analysis.profiles?.display_name?.toLowerCase().includes(lowerSearchTerm) || analysis.profiles?.username?.toLowerCase().includes(lowerSearchTerm) || analysis.tags?.some((tag: string) => tag.toLowerCase().includes(lowerSearchTerm)));
  }, [followingAnalyses, searchTerm]);

  // Event handlers
  const handleViewStockCaseDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };
  const handleDeleteStockCase = async (id: string) => {
    console.log('Delete stock case:', id);
  };
  const handleViewAnalysisDetails = (id: string) => {
    navigate(`/analysis/${id}`);
  };
  const handleDeleteAnalysis = async (id: string) => {
    console.log('Delete analysis:', id);
  };
  const handleEditAnalysis = (analysis: Analysis) => {
    console.log('Edit analysis:', analysis);
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
              Hitta inspiration genom visuella aktiecase och djupa marknadsanalyser.
            </p>
          </section>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6 sm:space-y-8">
            <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-border/80 bg-muted/40 p-1.5 sm:mx-auto sm:max-w-md sm:gap-3 sm:p-2">
              <TabsTrigger
                value="cases"
                className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm sm:py-3 sm:text-base"
              >
                <Camera className="h-4 w-4" />
                Case
              </TabsTrigger>
              <TabsTrigger
                value="analyses"
                className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm sm:py-3 sm:text-base"
              >
                <PenTool className="h-4 w-4" />
                Analyser
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

              <div className="space-y-5 sm:space-y-6">
                {stockCasesLoading ? (
                  <div className={`grid gap-4 sm:gap-5 lg:gap-6 ${caseViewMode === 'grid' ? 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse rounded-2xl border border-border/60 bg-card/70">
                        <CardContent className="space-y-4 p-5 sm:p-6">
                          <div className="h-4 w-3/4 rounded bg-muted" />
                          <div className="h-4 w-1/2 rounded bg-muted" />
                          <div className="h-32 rounded-xl bg-muted" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className={`grid gap-4 sm:gap-5 lg:gap-6 ${caseViewMode === 'grid' ? 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {getFilteredCases.map(stockCase => (
                      <StockCaseCard
                        key={stockCase.id}
                        stockCase={stockCase}
                        onViewDetails={handleViewStockCaseDetails}
                        onDelete={handleDeleteStockCase}
                      />
                    ))}
                  </div>
                )}

                {!stockCasesLoading && getFilteredCases.length === 0 && (
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
                      <Button
                        onClick={() => setCaseSearchTerm('')}
                        variant="outline"
                        className="rounded-xl border-border hover:bg-muted/50"
                      >
                        Rensa sökning
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analyses" className="space-y-6 sm:space-y-8">
              <div className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm sm:p-6">
                <EnhancedAnalysesSearch
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedType={selectedType}
                  onTypeChange={setSelectedType}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  sortOrder={sortOrder}
                  onSortOrderChange={setSortOrder}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  resultsCount={filteredAnalyses.length}
                  totalCount={analyses?.length || 0}
                />
              </div>

              <Tabs value={analysisSubTab} onValueChange={setAnalysisSubTab} className="w-full space-y-5 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-border/80 bg-muted/40 p-1.5 sm:mx-auto sm:max-w-md sm:gap-3 sm:p-2">
                  <TabsTrigger
                    value="all"
                    className="flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm sm:py-2.5"
                  >
                    <Sparkles className="h-4 w-4" />
                    Upptäck
                  </TabsTrigger>
                  <TabsTrigger
                    value="following"
                    className="flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm sm:py-2.5"
                  >
                    <Users className="h-4 w-4" />
                    Följer
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-5 sm:space-y-6">
                  {analysesLoading ? (
                    <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6' : 'space-y-4 sm:space-y-5 lg:space-y-6'}`}>
                      {[...Array(5)].map((_, i) => (
                        <Card key={i} className="animate-pulse rounded-2xl border border-border/60 bg-card/70">
                          <CardContent className="space-y-4 p-5 sm:p-6">
                            <div className="h-4 w-3/4 rounded bg-muted" />
                            <div className="h-4 w-1/2 rounded bg-muted" />
                            <div className="h-20 rounded-xl bg-muted" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredAnalyses.length > 0 ? (
                    <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6' : 'space-y-4 sm:space-y-5 lg:space-y-6'}`}>
                      {filteredAnalyses.map(analysis => (
                        <EnhancedAnalysisCard
                          key={analysis.id}
                          analysis={analysis}
                          onViewDetails={handleViewAnalysisDetails}
                          onDelete={handleDeleteAnalysis}
                          onEdit={handleEditAnalysis}
                          showProfileActions
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-border/70 bg-background/60 px-6 py-16 text-center shadow-inner sm:px-10">
                      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="mb-3 text-xl font-semibold text-foreground">
                        {searchTerm || selectedType ? 'Inga analyser matchar dina filter' : 'Inga analyser hittades'}
                      </h3>
                      <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground sm:text-base">
                        {searchTerm || selectedType
                          ? 'Prova att ändra dina sökkriterier eller återställ filtren.'
                          : 'Var den första att dela en marknadsanalys!'}
                      </p>
                      {searchTerm && (
                        <Button
                          onClick={() => setSearchTerm('')}
                          variant="outline"
                          className="rounded-xl border-border hover:bg-muted/50"
                        >
                          Rensa sökning
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="following" className="space-y-5 sm:space-y-6">
                  {followingAnalysesLoading ? (
                    <div className="space-y-4 sm:space-y-5">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse rounded-2xl border border-border/60 bg-card/70">
                          <CardContent className="space-y-4 p-5 sm:p-6">
                            <div className="h-4 w-3/4 rounded bg-muted" />
                            <div className="h-4 w-1/2 rounded bg-muted" />
                            <div className="h-20 rounded-xl bg-muted" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredFollowingAnalyses.length > 0 ? (
                    <div className="space-y-5 sm:space-y-6">
                      {searchTerm && (
                        <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
                          Visar {filteredFollowingAnalyses.length} av {followingAnalyses?.length || 0} analyser
                        </div>
                      )}
                      <div className="space-y-4 sm:space-y-5">
                        {filteredFollowingAnalyses.map(analysis => (
                          <EnhancedAnalysisCard
                            key={analysis.id}
                            analysis={analysis}
                            onViewDetails={handleViewAnalysisDetails}
                            onDelete={handleDeleteAnalysis}
                            onEdit={handleEditAnalysis}
                            showProfileActions={false}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-border/70 bg-background/60 px-6 py-16 text-center shadow-inner sm:px-10">
                      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="mb-3 text-xl font-semibold text-foreground">
                        {searchTerm
                          ? 'Inga analyser matchar din sökning'
                          : user
                          ? 'Du följer inga analyser än'
                          : 'Logga in för att följa analyser'}
                      </h3>
                      <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground sm:text-base">
                        {searchTerm
                          ? 'Prova att ändra dina sökord.'
                          : user
                          ? 'Gå till Upptäck-fliken för att hitta analyser att följa.'
                          : 'Skapa ett konto för att följa dina favoritanalytiker.'}
                      </p>
                      {searchTerm && (
                        <Button
                          onClick={() => setSearchTerm('')}
                          variant="outline"
                          className="rounded-xl border-border hover:bg-muted/50"
                        >
                          Rensa sökning
                        </Button>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Discover;
