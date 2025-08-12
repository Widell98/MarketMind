import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import EnhancedStockCaseCard from '@/components/EnhancedStockCaseCard';
import EnhancedStockCasesSearch from '@/components/EnhancedStockCasesSearch';
import EnhancedAnalysisCard from '@/components/EnhancedAnalysisCard';
import EnhancedAnalysesSearch from '@/components/EnhancedAnalysesSearch';
import AIWeeklyPicks from '@/components/AIWeeklyPicks';
import { useStockCases } from '@/hooks/useStockCases';
import { useFollowingStockCases } from '@/hooks/useFollowingStockCases';
import { useAnalyses } from '@/hooks/useAnalyses';
import { useFollowingAnalyses } from '@/hooks/useFollowingAnalyses';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, Search, Plus, Users, Sparkles, MessageSquare, BarChart3, BookOpen } from 'lucide-react';
import CreateStockCaseDialog from '@/components/CreateStockCaseDialog';
import CreateAnalysisDialog from '@/components/CreateAnalysisDialog';

const StockCases = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cases');
  const [contentType, setContentType] = useState('cases'); // 'cases' or 'analyses'
  const [isCreateStockCaseDialogOpen, setIsCreateStockCaseDialogOpen] = useState(false);
  const [isCreateAnalysisDialogOpen, setIsCreateAnalysisDialogOpen] = useState(false);
  
  // Search and filter states for stock cases
  const [stockSearchTerm, setStockSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [stockSortBy, setStockSortBy] = useState('created_at');
  const [stockSortOrder, setStockSortOrder] = useState('desc');
  const [stockViewMode, setStockViewMode] = useState('grid');
  
  // Search and filter states for analyses
  const [analysisSearchTerm, setAnalysisSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [analysisSortBy, setAnalysisSortBy] = useState('created_at');
  const [analysisSortOrder, setAnalysisSortOrder] = useState('desc');
  const [analysisViewMode, setAnalysisViewMode] = useState('grid');
  
  const { stockCases, loading: isLoading } = useStockCases();
  const { followingStockCases, loading: followingLoading } = useFollowingStockCases();
  const { data: analyses, isLoading: analysesLoading } = useAnalyses(50);
  const { data: followingAnalyses, isLoading: followingAnalysesLoading } = useFollowingAnalyses();

  const handleViewStockCaseDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };

  const handleDeleteStockCase = async (id: string) => {
    try {
      // Implementation for delete - to be implemented when needed
      console.log('Delete stock case:', id);
    } catch (error) {
      console.error('Error deleting stock case:', error);
    }
  };

  const handleViewAnalysisDetails = (id: string) => {
    navigate(`/analysis/${id}`);
  };

  const handleEditAnalysis = (analysis: any) => {
    // För framtida implementation - navigera till edit-sida eller öppna edit-dialog
    console.log('Edit analysis:', analysis);
  };

  const handleDeleteAnalysis = async (id: string) => {
    try {
      // Implementation for delete - to be implemented when needed
      console.log('Delete analysis:', id);
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };

  // Filter and sort stock cases for "Upptäck" tab
  const filteredStockCases = useMemo(() => {
    let filtered = [...(stockCases || [])];

    // Apply search filter
    if (stockSearchTerm) {
      const lowerSearchTerm = stockSearchTerm.toLowerCase();
      filtered = filtered.filter(stockCase =>
        stockCase.title.toLowerCase().includes(lowerSearchTerm) ||
        stockCase.company_name.toLowerCase().includes(lowerSearchTerm) ||
        stockCase.description?.toLowerCase().includes(lowerSearchTerm) ||
        stockCase.profiles?.display_name?.toLowerCase().includes(lowerSearchTerm) ||
        stockCase.profiles?.username?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Apply sector filter
    if (selectedSector) {
      filtered = filtered.filter(stockCase => stockCase.sector === selectedSector);
    }

    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(stockCase => stockCase.status === selectedStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (stockSortBy) {
        case 'performance':
          aValue = a.performance_percentage || 0;
          bValue = b.performance_percentage || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'company_name':
          aValue = a.company_name.toLowerCase();
          bValue = b.company_name.toLowerCase();
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }

      if (stockSortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [stockCases, stockSearchTerm, selectedSector, selectedStatus, stockSortBy, stockSortOrder]);

  // Filter following stock cases with search
  const filteredFollowingStockCases = useMemo(() => {
    if (!stockSearchTerm) return followingStockCases || [];
    
    const lowerSearchTerm = stockSearchTerm.toLowerCase();
    return (followingStockCases || []).filter(stockCase =>
      stockCase.title.toLowerCase().includes(lowerSearchTerm) ||
      stockCase.company_name.toLowerCase().includes(lowerSearchTerm) ||
      stockCase.description?.toLowerCase().includes(lowerSearchTerm) ||
      stockCase.profiles?.display_name?.toLowerCase().includes(lowerSearchTerm) ||
      stockCase.profiles?.username?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [followingStockCases, stockSearchTerm]);

  // Filter and sort analyses for "Upptäck" tab
  const filteredAnalyses = useMemo(() => {
    let filtered = [...(analyses || [])];

    // Apply search filter
    if (analysisSearchTerm) {
      const lowerSearchTerm = analysisSearchTerm.toLowerCase();
      filtered = filtered.filter(analysis =>
        analysis.title.toLowerCase().includes(lowerSearchTerm) ||
        analysis.content.toLowerCase().includes(lowerSearchTerm) ||
        analysis.profiles?.display_name?.toLowerCase().includes(lowerSearchTerm) ||
        analysis.profiles?.username?.toLowerCase().includes(lowerSearchTerm) ||
        analysis.tags?.some((tag: string) => tag.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Apply type filter
    if (selectedType) {
      filtered = filtered.filter(analysis => analysis.analysis_type === selectedType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (analysisSortBy) {
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

      if (analysisSortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [analyses, analysisSearchTerm, selectedType, analysisSortBy, analysisSortOrder]);

  // Filter following analyses with search
  const filteredFollowingAnalyses = useMemo(() => {
    if (!analysisSearchTerm) return followingAnalyses || [];
    
    const lowerSearchTerm = analysisSearchTerm.toLowerCase();
    return (followingAnalyses || []).filter(analysis =>
      analysis.title.toLowerCase().includes(lowerSearchTerm) ||
      analysis.content.toLowerCase().includes(lowerSearchTerm) ||
      analysis.profiles?.display_name?.toLowerCase().includes(lowerSearchTerm) ||
      analysis.profiles?.username?.toLowerCase().includes(lowerSearchTerm) ||
      analysis.tags?.some((tag: string) => tag.toLowerCase().includes(lowerSearchTerm))
    );
  }, [followingAnalyses, analysisSearchTerm]);

  const isAnyLoading = isLoading || analysesLoading;

  if (isAnyLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Aktiefall & Analyser</h1>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb />
        
        {/* AI Weekly Picks Section */}
        <AIWeeklyPicks />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Aktiefall & Analyser
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={contentType === 'cases' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setContentType('cases')}
                className="rounded-md"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Aktiefall
              </Button>
              <Button
                variant={contentType === 'analyses' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setContentType('analyses')}
                className="rounded-md"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analyser
              </Button>
            </div>
            {user && (
              <>
                {contentType === 'cases' ? (
                  <Button onClick={() => setIsCreateStockCaseDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nytt Aktiefall
                  </Button>
                ) : (
                  <Button onClick={() => setIsCreateAnalysisDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Ny Analys
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-muted p-1 rounded-xl h-auto">
            <TabsTrigger 
              value="cases" 
              className="flex items-center gap-2 rounded-lg py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Upptäck
            </TabsTrigger>
            <TabsTrigger 
              value="following" 
              className="flex items-center gap-2 rounded-lg py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
            >
              <Users className="w-4 h-4" />
              Följer
            </TabsTrigger>
          </TabsList>

          {/* Upptäck Tab */}
          <TabsContent value="cases" className="space-y-6">
            {/* Content Type Switch for Stock Cases and Analyses */}
            {contentType === 'cases' ? (
              <>
                {/* Enhanced Search and Filters for Stock Cases */}
                <EnhancedStockCasesSearch
                  searchTerm={stockSearchTerm}
                  onSearchChange={setStockSearchTerm}
                  selectedSector={selectedSector}
                  onSectorChange={(sector) => setSelectedSector(sector === 'all-sectors' ? '' : sector)}
                  sortBy={stockSortBy}
                  onSortChange={setStockSortBy}
                  sortOrder={stockSortOrder}
                  onSortOrderChange={setStockSortOrder}
                  viewMode={stockViewMode}
                  onViewModeChange={setStockViewMode}
                  resultsCount={filteredStockCases.length}
                  totalCount={stockCases?.length || 0}
                />

                {/* Stock Cases Feed */}
                {filteredStockCases.length > 0 ? (
                  <div className={stockViewMode === 'grid' ? "space-y-4" : "space-y-4"}>
                    {filteredStockCases.map(stockCase => (
                      <EnhancedStockCaseCard 
                        key={stockCase.id} 
                        stockCase={stockCase} 
                        onViewDetails={handleViewStockCaseDetails} 
                        onDelete={handleDeleteStockCase}
                        showProfileActions={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {stockSearchTerm || selectedSector || selectedStatus
                        ? "Inga aktiefall matchar dina filter" 
                        : "Inga aktiefall hittades"
                      }
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {stockSearchTerm || selectedSector || selectedStatus
                        ? "Prova att ändra dina sökkriterier eller filter"
                        : "Var den första att dela ett aktiefall!"
                      }
                    </p>
                    {stockSearchTerm || selectedSector || selectedStatus ? (
                      <Button 
                        onClick={() => {
                          setStockSearchTerm('');
                          setSelectedSector('');
                          setSelectedStatus('');
                        }}
                        variant="outline"
                      >
                        Rensa filter
                      </Button>
                    ) : user && (
                      <Button onClick={() => setIsCreateStockCaseDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Skapa första aktiefallet
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Enhanced Search and Filters for Analyses */}
                <EnhancedAnalysesSearch
                  searchTerm={analysisSearchTerm}
                  onSearchChange={setAnalysisSearchTerm}
                  selectedType={selectedType}
                  onTypeChange={(type) => setSelectedType(type === 'all-types' ? '' : type)}
                  sortBy={analysisSortBy}
                  onSortChange={setAnalysisSortBy}
                  sortOrder={analysisSortOrder}
                  onSortOrderChange={setAnalysisSortOrder}
                  viewMode={analysisViewMode}
                  onViewModeChange={setAnalysisViewMode}
                  resultsCount={filteredAnalyses.length}
                  totalCount={analyses?.length || 0}
                />

                {/* Analyses Feed */}
                {filteredAnalyses.length > 0 ? (
                  <div className={analysisViewMode === 'grid' ? "space-y-4" : "space-y-4"}>
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
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {analysisSearchTerm || selectedType 
                        ? "Inga analyser matchar dina filter" 
                        : "Inga analyser hittades"
                      }
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {analysisSearchTerm || selectedType 
                        ? "Prova att ändra dina sökkriterier eller filter"
                        : "Var den första att dela en marknadsanalys!"
                      }
                    </p>
                    {analysisSearchTerm || selectedType ? (
                      <Button 
                        onClick={() => {
                          setAnalysisSearchTerm('');
                          setSelectedType('');
                        }}
                        variant="outline"
                      >
                        Rensa filter
                      </Button>
                    ) : user && (
                      <Button onClick={() => setIsCreateAnalysisDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Skapa första analysen
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Följer Tab */}
          <TabsContent value="following" className="space-y-6">
            {/* Content Type Display */}
            <div className="flex items-center bg-muted rounded-lg p-1 max-w-fit">
              <Button
                variant={contentType === 'cases' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setContentType('cases')}
                className="rounded-md"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Aktiefall
              </Button>
              <Button
                variant={contentType === 'analyses' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setContentType('analyses')}
                className="rounded-md"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analyser
              </Button>
            </div>

            {contentType === 'cases' ? (
              <>
                {/* Search for following stock cases */}
                {(filteredFollowingStockCases?.length || 0) > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Sök bland aktiefall från personer du följer..."
                      value={stockSearchTerm}
                      onChange={(e) => setStockSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}

                {followingLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredFollowingStockCases.length > 0 ? (
                  <div className="space-y-6">
                    {stockSearchTerm && (
                      <div className="text-sm text-muted-foreground">
                        Visar {filteredFollowingStockCases.length} av {followingStockCases?.length || 0} aktiefall
                      </div>
                    )}
                    <div className="space-y-4">
                      {filteredFollowingStockCases.map(stockCase => (
                        <EnhancedStockCaseCard 
                          key={stockCase.id} 
                          stockCase={stockCase} 
                          onViewDetails={handleViewStockCaseDetails} 
                          onDelete={handleDeleteStockCase}
                          showProfileActions={false}
                        />
                      ))}
                    </div>
                  </div>
                ) : (followingStockCases?.length || 0) > 0 && stockSearchTerm ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Inga resultat hittades</h3>
                    <p className="text-muted-foreground mb-6">
                      Inga aktiefall från personer du följer matchar "{stockSearchTerm}"
                    </p>
                    <Button onClick={() => setStockSearchTerm('')} variant="outline">
                      Rensa sökning
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Inga aktiefall från följda användare</h3>
                    <p className="text-muted-foreground mb-6">
                      {!user 
                        ? "Logga in för att följa andra användare och se deras aktiefall"
                        : "Du följer inga användare ännu, eller så har de du följer inte publicerat några aktiefall"
                      }
                    </p>
                    {!user ? (
                      <Button asChild>
                        <Link to="/auth">
                          Logga in
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="outline">
                        <Link to="/stock-cases" onClick={() => setActiveTab('cases')}>
                          Upptäck användare att följa
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Search for following analyses */}
                {(filteredFollowingAnalyses?.length || 0) > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Sök bland analyser från personer du följer..."
                      value={analysisSearchTerm}
                      onChange={(e) => setAnalysisSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}

                {followingAnalysesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredFollowingAnalyses.length > 0 ? (
                  <div className="space-y-6">
                    {analysisSearchTerm && (
                      <div className="text-sm text-muted-foreground">
                        Visar {filteredFollowingAnalyses.length} av {followingAnalyses?.length || 0} analyser
                      </div>
                    )}
                    <div className="space-y-4">
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
                ) : (followingAnalyses?.length || 0) > 0 && analysisSearchTerm ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Inga resultat hittades</h3>
                    <p className="text-muted-foreground mb-6">
                      Inga analyser från personer du följer matchar "{analysisSearchTerm}"
                    </p>
                    <Button onClick={() => setAnalysisSearchTerm('')} variant="outline">
                      Rensa sökning
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Inga analyser från följda användare</h3>
                    <p className="text-muted-foreground mb-6">
                      {!user 
                        ? "Logga in för att följa andra användare och se deras analyser"
                        : "Du följer inga användare ännu, eller så har de du följer inte publicerat några analyser"
                      }
                    </p>
                    {!user ? (
                      <Button asChild>
                        <Link to="/auth">
                          Logga in
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="outline">
                        <Link to="/stock-cases" onClick={() => setActiveTab('cases')}>
                          Upptäck användare att följa
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Dialogs */}
        <CreateStockCaseDialog 
          isOpen={isCreateStockCaseDialogOpen}
          onClose={() => setIsCreateStockCaseDialogOpen(false)}
        />
        
        <CreateAnalysisDialog 
          isOpen={isCreateAnalysisDialogOpen}
          onClose={() => setIsCreateAnalysisDialogOpen(false)}
        />
      </div>
    </Layout>
  );
};

export default StockCases;