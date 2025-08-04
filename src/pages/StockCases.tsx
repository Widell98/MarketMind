import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import CreateStockCaseDialog from '@/components/CreateStockCaseDialog';
import StockCaseCard from '@/components/StockCaseCard';
import EnhancedStockCaseCard from '@/components/EnhancedStockCaseCard';
import EnhancedStockCasesSearch from '@/components/EnhancedStockCasesSearch';
import AIWeeklyPicks from '@/components/AIWeeklyPicks';
import { useStockCases } from '@/hooks/useStockCases';
import { useFollowingStockCases } from '@/hooks/useFollowingStockCases';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, PlusCircle, Sparkles, MessageCircle, Users, Search } from 'lucide-react';
const StockCases = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  
  const { stockCases, loading, refetch } = useStockCases();
  const { followingStockCases, loading: followingLoading } = useFollowingStockCases();
  const handleViewDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };
  const handleDelete = async (id: string) => {
    try {
      // Implementation for delete
      refetch();
    } catch (error) {
      console.error('Error deleting stock case:', error);
    }
  };
  const handleDiscussWithAI = (stockCase: any) => {
    const contextData = {
      type: 'stock_case',
      id: stockCase.id,
      title: stockCase.title,
      data: stockCase
    };
    navigate('/ai-chat', {
      state: {
        contextData
      }
    });
  };
  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    refetch();
  };

  // Get available sectors from stock cases
  const availableSectors = useMemo(() => {
    const sectors = new Set<string>();
    stockCases.forEach(stockCase => {
      if (stockCase.sector) sectors.add(stockCase.sector);
    });
    return Array.from(sectors).sort();
  }, [stockCases]);

  // Filter and sort stock cases
  const filteredStockCases = useMemo(() => {
    let filtered = [...stockCases];

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
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

    // Apply performance filter
    if (performanceFilter) {
      filtered = filtered.filter(stockCase => {
        const performance = stockCase.performance_percentage || 0;
        switch (performanceFilter) {
          case 'positive': return performance > 0;
          case 'negative': return performance < 0;
          case 'high': return performance > 10;
          case 'low': return performance < 5;
          default: return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'performance':
          aValue = a.performance_percentage || 0;
          bValue = b.performance_percentage || 0;
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
  }, [stockCases, searchTerm, selectedSector, performanceFilter, sortBy, sortOrder]);

  // Filter following stock cases with search
  const filteredFollowingStockCases = useMemo(() => {
    if (!searchTerm) return followingStockCases;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return followingStockCases.filter(stockCase =>
      stockCase.title.toLowerCase().includes(lowerSearchTerm) ||
      stockCase.company_name.toLowerCase().includes(lowerSearchTerm) ||
      stockCase.description?.toLowerCase().includes(lowerSearchTerm) ||
      stockCase.profiles?.display_name?.toLowerCase().includes(lowerSearchTerm) ||
      stockCase.profiles?.username?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [followingStockCases, searchTerm]);
  if (loading) {
    return <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Aktiefall</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </Layout>;
  }
  return <Layout>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb />
        
        {/* AI Weekly Picks Section - moved to top */}
        <AIWeeklyPicks />

        {/* Header - moved below AI Weekly Picks */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Aktiefall
            </h1>
          </div>
          {user && <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Nytt Aktiefall
            </Button>}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-muted p-1 rounded-xl h-auto">
            <TabsTrigger 
              value="all" 
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
          <TabsContent value="all" className="space-y-6">
            {/* Enhanced Search and Filters */}
            <EnhancedStockCasesSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedSector={selectedSector}
              onSectorChange={(sector) => setSelectedSector(sector === 'all-sectors' ? '' : sector)}
              performanceFilter={performanceFilter}
              onPerformanceFilterChange={(filter) => setPerformanceFilter(filter === 'all-results' ? '' : filter)}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              availableSectors={availableSectors}
              resultsCount={filteredStockCases.length}
              totalCount={stockCases.length}
            />

            {/* Stock Cases Feed */}
            {filteredStockCases.length > 0 ? (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6" : "space-y-4"}>
                {filteredStockCases.map(stockCase => (
                  <EnhancedStockCaseCard 
                    key={stockCase.id} 
                    stockCase={stockCase} 
                    onViewDetails={handleViewDetails} 
                    onDelete={handleDelete}
                    showProfileActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm || selectedSector || performanceFilter 
                    ? "Inga aktiefall matchar dina filter" 
                    : "Inga aktiefall hittades"
                  }
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || selectedSector || performanceFilter 
                    ? "Prova att ändra dina sökkriterier eller filter"
                    : "Var den första att skapa ett aktiefall!"
                  }
                </p>
                {searchTerm || selectedSector || performanceFilter ? (
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedSector('');
                      setPerformanceFilter('');
                    }}
                    variant="outline"
                  >
                    Rensa filter
                  </Button>
                ) : user && (
                  <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Skapa första aktiefallet
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Följer Tab */}
          <TabsContent value="following" className="space-y-6">
            {/* Search for following tab */}
            {followingStockCases.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Sök bland aktiefall från personer du följer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {followingLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredFollowingStockCases.length > 0 ? (
              <div className="space-y-6">
                {searchTerm && (
                  <div className="text-sm text-muted-foreground">
                    Visar {filteredFollowingStockCases.length} av {followingStockCases.length} aktiefall
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFollowingStockCases.map(stockCase => (
                    <EnhancedStockCaseCard 
                      key={stockCase.id} 
                      stockCase={stockCase} 
                      onViewDetails={handleViewDetails} 
                      onDelete={handleDelete}
                      showProfileActions={false} // Don't show follow button in following tab
                    />
                  ))}
                </div>
              </div>
            ) : followingStockCases.length > 0 && searchTerm ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Inga resultat hittades</h3>
                <p className="text-muted-foreground mb-6">
                  Inga aktiefall från personer du följer matchar "{searchTerm}"
                </p>
                <Button onClick={() => setSearchTerm('')} variant="outline">
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
                    <Link to="/stock-cases" onClick={() => setActiveTab('all')}>
                      Upptäck användare att följa
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Stock Case Dialog */}
        <CreateStockCaseDialog isOpen={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onSuccess={handleCreateSuccess} />
      </div>
    </Layout>;
};
export default StockCases;