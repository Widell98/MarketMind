import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sparkles, Camera, PenTool, Filter, TrendingUp, Target, BarChart3, Search, BookOpen, Plus, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';

// Components from existing pages
import PersonalizedRecommendations from '@/components/PersonalizedRecommendations';
import PersonalizedAIRecommendations from '@/components/PersonalizedAIRecommendations';
import AIWeeklyPicks from '@/components/AIWeeklyPicks';
import StockCaseCard from '@/components/StockCaseCard';
import EnhancedAnalysisCard from '@/components/EnhancedAnalysisCard';
import EnhancedAnalysesSearch from '@/components/EnhancedAnalysesSearch';
import EnhancedStockCasesSearch from '@/components/EnhancedStockCasesSearch';
import CreateAnalysisDialog from '@/components/CreateAnalysisDialog';

// Hooks
import { useStockCases } from '@/hooks/useStockCases';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
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

  // Dialog states
  const [isCreateAnalysisDialogOpen, setIsCreateAnalysisDialogOpen] = useState(false);

  // Data hooks
  const {
    stockCases: allStockCases,
    loading: stockCasesLoading
  } = useStockCases(false);
  const {
    trendingCases,
    loading: trendingLoading
  } = useTrendingStockCases(12);
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

    return filtered;
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
  const handleEditAnalysis = (analysis: any) => {
    console.log('Edit analysis:', analysis);
  };
  return <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Clean Header - Apple style */}
          <div className="text-center space-y-6 mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-foreground tracking-tight">
              Upptäck & Utforska
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              Hitta inspiration genom visuella aktiecase och djupa marknadsanalyser
            </p>
          </div>

          {/* Clean Tabs - Apple style */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto mb-12 bg-muted/50 p-1 rounded-xl h-auto border">
              <TabsTrigger 
                value="cases" 
                className="flex items-center gap-2 rounded-lg py-3 px-6 font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary text-sm"
              >
                <Camera className="w-4 h-4" />
                Stock Cases
              </TabsTrigger>
              <TabsTrigger 
                value="analyses" 
                className="flex items-center gap-2 rounded-lg py-3 px-6 font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary text-sm"
              >
                <PenTool className="w-4 h-4" />
                Analyser
              </TabsTrigger>
            </TabsList>

            {/* Cases Tab */}
            <TabsContent value="cases" className="space-y-8">
              {/* Clean Search */}
              <div className="bg-card border rounded-2xl p-6">
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

              {/* Cases Grid */}
              <div className="space-y-6">
                {stockCasesLoading ? (
                  <div className={`grid gap-6 ${caseViewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse border rounded-2xl">
                        <CardContent className="p-6">
                          <div className="h-4 bg-muted rounded mb-3"></div>
                          <div className="h-4 bg-muted rounded w-2/3 mb-6"></div>
                          <div className="h-32 bg-muted rounded-xl"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className={`grid gap-6 ${caseViewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
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
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">
                      {caseSearchTerm ? "Inga case matchar din sökning" : "Inga case hittades"}
                    </h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      {caseSearchTerm ? "Prova att ändra dina sökord eller rensa sökningen" : "Kom tillbaka senare för nya case"}
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

            {/* Analyses Tab */}
            <TabsContent value="analyses" className="space-y-8">
              {/* Clean Search */}
              <div className="bg-card border rounded-2xl p-6">
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

              {/* Analysis Sub-tabs */}
              <Tabs value={analysisSubTab} onValueChange={setAnalysisSubTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto mb-8 bg-muted/50 p-1 rounded-xl h-auto border">
                  <TabsTrigger 
                    value="all" 
                    className="flex items-center gap-2 rounded-lg py-2 px-4 font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Upptäck
                  </TabsTrigger>
                  <TabsTrigger 
                    value="following" 
                    className="flex items-center gap-2 rounded-lg py-2 px-4 font-medium transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary text-sm"
                  >
                    <Users className="w-4 h-4" />
                    Följer
                  </TabsTrigger>
                </TabsList>

                {/* All Analyses Tab */}
                <TabsContent value="all" className="space-y-6">
                  {analysesLoading ? (
                    <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}`}>
                      {[...Array(5)].map((_, i) => (
                        <Card key={i} className="animate-pulse border rounded-2xl">
                          <CardContent className="p-6">
                            <div className="h-4 bg-muted rounded mb-3"></div>
                            <div className="h-4 bg-muted rounded w-2/3 mb-6"></div>
                            <div className="h-20 bg-muted rounded-xl"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredAnalyses.length > 0 ? (
                    <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'}`}>
                      {filteredAnalyses.map(analysis => (
                        <EnhancedAnalysisCard 
                          key={analysis.id} 
                          analysis={analysis} 
                          onViewDetails={handleViewAnalysisDetails} 
                          onDelete={handleDeleteAnalysis} 
                          onEdit={handleEditAnalysis} 
                          showProfileActions={true} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">
                        {searchTerm || selectedType ? "Inga analyser matchar dina filter" : "Inga analyser hittades"}
                      </h3>
                      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        {searchTerm || selectedType ? "Prova att ändra dina sökkriterier eller filter" : "Var den första att dela en marknadsanalys!"}
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

                {/* Following Analyses Tab */}
                <TabsContent value="following" className="space-y-6">
                  {followingAnalysesLoading ? (
                    <div className="space-y-6">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse border rounded-2xl">
                          <CardContent className="p-6">
                            <div className="h-4 bg-muted rounded mb-3"></div>
                            <div className="h-4 bg-muted rounded w-2/3 mb-6"></div>
                            <div className="h-20 bg-muted rounded-xl"></div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredFollowingAnalyses.length > 0 ? (
                    <div className="space-y-6">
                      {searchTerm && (
                        <div className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-4 border">
                          Visar {filteredFollowingAnalyses.length} av {followingAnalyses?.length || 0} analyser
                        </div>
                      )}
                      <div className="space-y-6">
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
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                        <Users className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">
                        {searchTerm ? "Inga analyser matchar din sökning" : user ? "Du följer inga analyser än" : "Logga in för att följa analyser"}
                      </h3>
                      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                        {searchTerm ? "Prova att ändra dina sökord" : user ? "Gå till Upptäck-fliken för att hitta analyser att följa" : "Skapa ett konto för att följa dina favoritanalytiker"}
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
    </Layout>;
};
export default Discover;