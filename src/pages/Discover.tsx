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
import EnhancedAnalysesSearch from '@/components/EnhancedAnalysesSearch';
import EnhancedAnalysisCard from '@/components/EnhancedAnalysisCard';
import { Analysis } from '@/types/analysis';

import { useStockCases } from '@/hooks/useStockCases';
import { useAnalyses } from '@/hooks/useAnalyses';
import { useFollowingAnalyses } from '@/hooks/useFollowingAnalyses';

const Discover = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { stockCases: allStockCases, loading: stockCasesLoading } = useStockCases(false);
  const { data: analyses, isLoading: analysesLoading } = useAnalyses(50);
  const { data: followingAnalyses, isLoading: followingAnalysesLoading } = useFollowingAnalyses();

  const [activeTab, setActiveTab] = useState<'cases' | 'analyses'>('cases');

  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('');
  const [caseSortBy, setCaseSortBy] = useState('created_at');
  const [caseSortOrder, setCaseSortOrder] = useState<'asc' | 'desc'>('desc');
  const [caseViewMode, setCaseViewMode] = useState<'grid' | 'list'>('grid');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [analysisSubTab, setAnalysisSubTab] = useState<'all' | 'following'>('all');

  const filteredAnalyses = analyses || [];
  const filteredFollowingAnalyses = followingAnalyses || [];

  const getFilteredCases = useMemo(() => {
    let filtered = [...(allStockCases || [])];

    if (caseSearchTerm) {
      const lowerSearchTerm = caseSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (stockCase) =>
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

      return caseSortOrder === 'asc'
        ? aValue < bValue
          ? -1
          : aValue > bValue
          ? 1
          : 0
        : aValue > bValue
        ? -1
        : aValue < bValue
        ? 1
        : 0;
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

  const handleViewStockCaseDetails = (id: string) => navigate(`/stock-cases/${id}`);
  const handleDeleteStockCase = async (id: string) => console.log('Delete stock case:', id);
  const handleViewAnalysisDetails = (id: string) => navigate(`/analysis/${id}`);
  const handleDeleteAnalysis = async (id: string) => console.log('Delete analysis:', id);
  const handleEditAnalysis = (analysis: Analysis) => console.log('Edit analysis:', analysis);

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
              <TabsTrigger value="cases" className="flex items-center gap-2">
                <Camera className="h-4 w-4" /> Case
              </TabsTrigger>
              <TabsTrigger value="analyses" className="flex items-center gap-2">
                <PenTool className="h-4 w-4" /> Analyser
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
                {getFilteredCases.map((stockCase) => (
                  <StockCaseCard key={stockCase.id} stockCase={stockCase} onViewDetails={handleViewStockCaseDetails} onDelete={handleDeleteStockCase} />
                ))}
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
              {/* Resterande analyser-tabbar samma som din originalkod */}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Discover;
