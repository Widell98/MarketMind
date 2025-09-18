import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Camera, PenTool, BookOpen, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import StockCaseCard from '@/components/StockCaseCard';
import EnhancedStockCasesSearch from '@/components/EnhancedStockCasesSearch';
import { useStockCases } from '@/hooks/useStockCases';
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

const Discover: React.FC = () => {
  const navigate = useNavigate();
  const {
    stockCases: allStockCases,
    loading: stockCasesLoading,
  } = useStockCases(false);

  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('');
  const [caseSortBy, setCaseSortBy] = useState('created_at');
  const [caseSortOrder, setCaseSortOrder] = useState<'asc' | 'desc'>('desc');
  const [caseViewMode, setCaseViewMode] = useState<'grid' | 'list'>('grid');

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

    if (caseSearchTerm) {
      const lowerSearchTerm = caseSearchTerm.toLowerCase();
      filtered = filtered.filter((stockCase) =>
        stockCase.title.toLowerCase().includes(lowerSearchTerm) ||
        stockCase.company_name?.toLowerCase().includes(lowerSearchTerm) ||
        stockCase.description?.toLowerCase().includes(lowerSearchTerm) ||
        stockCase.sector?.toLowerCase().includes(lowerSearchTerm) ||
        stockCase.profiles?.display_name?.toLowerCase().includes(lowerSearchTerm) ||
        stockCase.profiles?.username?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (selectedSector && selectedSector !== 'all-sectors') {
      filtered = filtered.filter((stockCase) => stockCase.sector === selectedSector);
    }

    if (performanceFilter && performanceFilter !== 'all-results') {
      filtered = filtered.filter((stockCase) => {
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

    filtered.sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (caseSortBy) {
        case 'performance':
          aValue = a.performance_percentage || 0;
          bValue = b.performance_percentage || 0;
          break;
        case 'likes':
          aValue = 0;
          bValue = 0;
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

    return filtered.slice(0, 6);
  }, [allStockCases, caseSearchTerm, selectedSector, performanceFilter, caseSortBy, caseSortOrder]);

  const availableSectors = useMemo(() => {
    const sectors = new Set<string>();
    allStockCases?.forEach((stockCase) => {
      if (stockCase.sector) sectors.add(stockCase.sector);
    });
    return Array.from(sectors).sort();
  }, [allStockCases]);

  const handleViewStockCaseDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };

  const handleDeleteStockCase = async (id: string) => {
    console.log('Delete stock case:', id);
  };


  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center space-y-6 mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>

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
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
              Hitta inspiration genom visuella aktiecase
            </p>
          </section>

          <div className="bg-card border rounded-2xl p-6 mb-8">
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

          <div className="space-y-6">
            {stockCasesLoading ? (
              <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${caseViewMode === 'grid' ? 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
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
              <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${caseViewMode === 'grid' ? 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {getFilteredCases.map((stockCase) => (
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
                  {caseSearchTerm ? 'Inga case matchar din sökning' : 'Inga case hittades'}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {caseSearchTerm ? 'Prova att ändra dina sökord' : 'Var den första att dela ett aktiecase!'}
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
        </div>
      </div>
    </Layout>
  );
};

export default Discover;
