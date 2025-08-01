
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import EnhancedAnalysisCard from '@/components/EnhancedAnalysisCard';
import EnhancedAnalysesSearch from '@/components/EnhancedAnalysesSearch';
import { useAnalyses } from '@/hooks/useAnalyses';
import { useFollowingAnalyses } from '@/hooks/useFollowingAnalyses';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Sparkles, Users, Search, BookOpen, Plus } from 'lucide-react';

const MarketAnalyses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  
  const { data: analyses, isLoading } = useAnalyses(50);
  const { data: followingAnalyses, isLoading: followingLoading } = useFollowingAnalyses();

  const handleViewDetails = (id: string) => {
    navigate(`/analysis/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      // Implementation for delete - to be implemented when needed
      console.log('Delete analysis:', id);
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };

  // Filter and sort analyses for "Upptäck" tab
  const filteredAnalyses = useMemo(() => {
    let filtered = [...(analyses || [])];

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
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

  // Filter following analyses with search
  const filteredFollowingAnalyses = useMemo(() => {
    if (!searchTerm) return followingAnalyses || [];
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (followingAnalyses || []).filter(analysis =>
      analysis.title.toLowerCase().includes(lowerSearchTerm) ||
      analysis.content.toLowerCase().includes(lowerSearchTerm) ||
      analysis.profiles?.display_name?.toLowerCase().includes(lowerSearchTerm) ||
      analysis.profiles?.username?.toLowerCase().includes(lowerSearchTerm) ||
      analysis.tags?.some((tag: string) => tag.toLowerCase().includes(lowerSearchTerm))
    );
  }, [followingAnalyses, searchTerm]);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Marknadsanalyser</h1>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
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

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Marknadsanalyser
            </h1>
          </div>
          {user && (
            <Button onClick={() => navigate('/create-analysis')} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Ny Analys
            </Button>
          )}
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
            <EnhancedAnalysesSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedType={selectedType}
              onTypeChange={(type) => setSelectedType(type === 'all-types' ? '' : type)}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              resultsCount={filteredAnalyses.length}
              totalCount={analyses?.length || 0}
            />

            {/* Analyses Feed */}
            {filteredAnalyses.length > 0 ? (
              <div className={viewMode === 'grid' ? "space-y-4" : "space-y-4"}>
                {filteredAnalyses.map(analysis => (
                  <EnhancedAnalysisCard 
                    key={analysis.id} 
                    analysis={analysis} 
                    onViewDetails={handleViewDetails} 
                    onDelete={handleDelete}
                    showProfileActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {searchTerm || selectedType 
                    ? "Inga analyser matchar dina filter" 
                    : "Inga analyser hittades"
                  }
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || selectedType 
                    ? "Prova att ändra dina sökkriterier eller filter"
                    : "Var den första att dela en marknadsanalys!"
                  }
                </p>
                {searchTerm || selectedType ? (
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedType('');
                    }}
                    variant="outline"
                  >
                    Rensa filter
                  </Button>
                ) : user && (
                  <Button onClick={() => navigate('/create-analysis')} className="bg-purple-600 hover:bg-purple-700">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Skapa första analysen
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Följer Tab */}
          <TabsContent value="following" className="space-y-6">
            {/* Search for following tab */}
            {(followingAnalyses?.length || 0) > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Sök bland analyser från personer du följer..."
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
            ) : filteredFollowingAnalyses.length > 0 ? (
              <div className="space-y-6">
                {searchTerm && (
                  <div className="text-sm text-muted-foreground">
                    Visar {filteredFollowingAnalyses.length} av {followingAnalyses?.length || 0} analyser
                  </div>
                )}
                <div className="space-y-4">
                  {filteredFollowingAnalyses.map(analysis => (
                    <EnhancedAnalysisCard 
                      key={analysis.id} 
                      analysis={analysis} 
                      onViewDetails={handleViewDetails} 
                      onDelete={handleDelete}
                      showProfileActions={false} // Don't show follow button in following tab
                    />
                  ))}
                </div>
              </div>
            ) : (followingAnalyses?.length || 0) > 0 && searchTerm ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Inga resultat hittades</h3>
                <p className="text-muted-foreground mb-6">
                  Inga analyser från personer du följer matchar "{searchTerm}"
                </p>
                <Button onClick={() => setSearchTerm('')} variant="outline">
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
                    <Link to="/market-analyses" onClick={() => setActiveTab('all')}>
                      Upptäck användare att följa
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MarketAnalyses;