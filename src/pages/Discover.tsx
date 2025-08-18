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

  // Case filters
  const [caseFilter, setCaseFilter] = useState('all');

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

  // Case categories
  const caseCategories = [{
    id: 'all',
    name: 'Alla case',
    icon: Filter
  }, {
    id: 'trending',
    name: 'Trending',
    icon: TrendingUp
  }, {
    id: 'growth',
    name: 'Tillväxt',
    icon: TrendingUp
  }, {
    id: 'dividend',
    name: 'Utdelning',
    icon: Target
  }, {
    id: 'value',
    name: 'Värde',
    icon: BarChart3
  }];

  // Filter cases based on selected category
  const getFilteredCases = () => {
    if (caseFilter === 'trending') return trendingCases;
    if (caseFilter === 'all') return allStockCases;
    return allStockCases.filter(stockCase => {
      switch (caseFilter) {
        case 'growth':
          return stockCase.sector === 'Technology' || stockCase.sector === 'Healthcare';
        case 'dividend':
          return stockCase.dividend_yield && parseFloat(stockCase.dividend_yield) > 3;
        case 'value':
          return stockCase.pe_ratio && parseFloat(stockCase.pe_ratio) < 15;
        default:
          return true;
      }
    });
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Upptäck & Utforska
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Hitta inspiration genom visuella aktiecase och djupa marknadsanalyser
          </p>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-muted p-1 rounded-xl h-auto">
            <TabsTrigger value="cases" className="flex items-center gap-2 rounded-lg py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm">
              <Camera className="w-4 h-4" />
              Case 📷
            </TabsTrigger>
            <TabsTrigger value="analyses" className="flex items-center gap-2 rounded-lg py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm">
              <PenTool className="w-4 h-4" />
              Analyser ✍️
            </TabsTrigger>
          </TabsList>

          {/* Cases Tab */}
          <TabsContent value="cases" className="space-y-8">
            {/* AI-Powered Recommendations for logged in users */}
            {user && <>
                <AIWeeklyPicks />
                <PersonalizedAIRecommendations />
                <PersonalizedRecommendations />
              </>}

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {caseCategories.map(category => {
              const Icon = category.icon;
              return <Button key={category.id} variant={caseFilter === category.id ? 'default' : 'outline'} onClick={() => setCaseFilter(category.id)} className="flex items-center gap-2" size="sm">
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </Button>;
            })}
            </div>

            {/* Cases Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {caseCategories.find(c => c.id === caseFilter)?.name || 'Alla case'}
                </h2>
                <Badge variant="secondary">
                  {getFilteredCases().length} case
                </Badge>
              </div>

              {stockCasesLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </CardContent>
                    </Card>)}
                </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredCases().map(stockCase => <StockCaseCard key={stockCase.id} stockCase={stockCase} onViewDetails={handleViewStockCaseDetails} onDelete={handleDeleteStockCase} />)}
                </div>}

              {!stockCasesLoading && getFilteredCases().length === 0 && <div className="text-center py-12">
                  <Camera className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    Inga case hittades
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Prova att ändra kategorifilter eller kolla in andra avsnitt.
                  </p>
                  <Button onClick={() => setCaseFilter('all')} variant="outline">
                    Visa alla case
                  </Button>
                </div>}
            </div>
          </TabsContent>

          {/* Analyses Tab */}
          <TabsContent value="analyses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Marknadsanalyser</h2>
              {user && <Button onClick={() => setIsCreateAnalysisDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Ny Analys
                </Button>}
            </div>

            {/* Analysis Sub-tabs */}
            <Tabs value={analysisSubTab} onValueChange={setAnalysisSubTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6 bg-muted p-1 rounded-xl h-auto">
                <TabsTrigger value="all" className="flex items-center gap-2 rounded-lg py-2 px-3 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm">
                  <Sparkles className="w-4 h-4" />
                  Upptäck
                </TabsTrigger>
                <TabsTrigger value="following" className="flex items-center gap-2 rounded-lg py-2 px-3 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm">
                  <Users className="w-4 h-4" />
                  Följer
                </TabsTrigger>
              </TabsList>

              {/* All Analyses Tab */}
              <TabsContent value="all" className="space-y-6">
                <EnhancedAnalysesSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} selectedType={selectedType} onTypeChange={type => setSelectedType(type === 'all-types' ? '' : type)} sortBy={sortBy} onSortChange={setSortBy} sortOrder={sortOrder} onSortOrderChange={setSortOrder} viewMode={viewMode} onViewModeChange={setViewMode} resultsCount={filteredAnalyses.length} totalCount={analyses?.length || 0} />

                {analysesLoading ? <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </CardContent>
                      </Card>)}
                  </div> : filteredAnalyses.length > 0 ? <div className="space-y-4">
                    {filteredAnalyses.map(analysis => <EnhancedAnalysisCard key={analysis.id} analysis={analysis} onViewDetails={handleViewAnalysisDetails} onDelete={handleDeleteAnalysis} onEdit={handleEditAnalysis} showProfileActions={true} />)}
                  </div> : <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {searchTerm || selectedType ? "Inga analyser matchar dina filter" : "Inga analyser hittades"}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm || selectedType ? "Prova att ändra dina sökkriterier eller filter" : "Var den första att dela en marknadsanalys!"}
                    </p>
                    {searchTerm || selectedType ? <Button onClick={() => {
                  setSearchTerm('');
                  setSelectedType('');
                }} variant="outline">
                        Rensa filter
                      </Button> : user && <Button onClick={() => setIsCreateAnalysisDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Skapa första analysen
                      </Button>}
                  </div>}
              </TabsContent>

              {/* Following Analyses Tab */}
              <TabsContent value="following" className="space-y-6">
                {(followingAnalyses?.length || 0) > 0 && <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="Sök bland analyser från personer du följer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>}

                {followingAnalysesLoading ? <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </CardContent>
                      </Card>)}
                  </div> : filteredFollowingAnalyses.length > 0 ? <div className="space-y-6">
                    {searchTerm && <div className="text-sm text-muted-foreground">
                        Visar {filteredFollowingAnalyses.length} av {followingAnalyses?.length || 0} analyser
                      </div>}
                    <div className="space-y-4">
                      {filteredFollowingAnalyses.map(analysis => <EnhancedAnalysisCard key={analysis.id} analysis={analysis} onViewDetails={handleViewAnalysisDetails} onDelete={handleDeleteAnalysis} onEdit={handleEditAnalysis} showProfileActions={false} />)}
                    </div>
                  </div> : <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Inga analyser från följda användare</h3>
                    <p className="text-muted-foreground mb-6">
                      {!user ? "Logga in för att följa andra användare och se deras analyser" : "Du följer inga användare ännu, eller så har de du följer inte publicerat några analyser"}
                    </p>
                    {!user ? <Button onClick={() => navigate('/auth')}>
                        Logga in
                      </Button> : <Button onClick={() => setAnalysisSubTab('all')} variant="outline">
                        Upptäck användare att följa
                      </Button>}
                  </div>}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Create Analysis Dialog */}
        <CreateAnalysisDialog isOpen={isCreateAnalysisDialogOpen} onClose={() => setIsCreateAnalysisDialogOpen(false)} />
      </div>
    </Layout>;
};
export default Discover;