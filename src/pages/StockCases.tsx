
import React, { useState } from 'react';
import { useStockCases } from '@/hooks/useStockCases';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  TrendingUp, 
  Users, 
  Sparkles,
  ArrowRight,
  BookOpen,
  MessageCircle,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import StockCaseCard from '@/components/StockCaseCard';
import StockCasesFilters from '@/components/StockCasesFilters';
import CreateStockCaseDialog from '@/components/CreateStockCaseDialog';
import CreateAnalysisDialog from '@/components/CreateAnalysisDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const StockCases = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreateStockCaseOpen, setIsCreateStockCaseOpen] = useState(false);
  const [isCreateAnalysisOpen, setIsCreateAnalysisOpen] = useState(false);
  const { stockCases, loading, error, refetch } = useStockCases();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleViewDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };

  const handleDeleteStockCase = async (id: string) => {
    // Implementation for delete functionality
    console.log('Delete stock case:', id);
    refetch();
  };

  const handleCreateStockCaseSuccess = () => {
    setIsCreateStockCaseOpen(false);
    refetch();
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-8"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="text-center py-8 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-4">
              <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                Det gick inte att ladda stock cases
              </h2>
              <p className="text-sm text-red-500 dark:text-red-300 mb-4">
                {error?.message || 'Ett oväntat fel uppstod'}
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Försök igen
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header with workflow explanation */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Stock Cases
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Din inspirationskälla för investeringsidéer. Upptäck cases från communityn, spara det du gillar och implementera i din portfölj.
          </p>
          
          {/* Workflow steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center max-w-4xl mx-auto mt-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-sm font-medium">1. Upptäck</div>
              <div className="text-xs text-muted-foreground">Utforska cases och analyser</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-sm font-medium">2. Spara</div>
              <div className="text-xs text-muted-foreground">Markera intressant innehåll</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-sm font-medium">3. Diskutera</div>
              <div className="text-xs text-muted-foreground">Prata med AI om idéerna</div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-sm font-medium">4. Implementera</div>
              <div className="text-xs text-muted-foreground">Använd i din portfölj</div>
            </div>
          </div>
          
          {/* Enhanced CTA section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="w-4 h-4" />
                    Bidra till Communityn
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64">
                  <DropdownMenuItem onClick={() => setIsCreateStockCaseOpen(true)}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    <div>
                      <div className="font-medium">Skapa Stock Case</div>
                      <div className="text-xs text-muted-foreground">Dela en konkret aktie/investering</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsCreateAnalysisOpen(true)}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    <div>
                      <div className="font-medium">Skapa Analys</div>
                      <div className="text-xs text-muted-foreground">Dela insikter och marknadsanalys</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/portfolio-implementation')}
              className="flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Se dina sparade rekommendationer
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <StockCasesFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          performanceFilter={performanceFilter}
          onPerformanceFilterChange={setPerformanceFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          categories={[]}
        />

        {/* Stock Cases Grid */}
        {stockCases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stockCases.map((stockCase) => (
              <StockCaseCard
                key={stockCase.id}
                stockCase={stockCase}
                onViewDetails={handleViewDetails}
                onDelete={handleDeleteStockCase}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 bg-gray-50 dark:bg-gray-800">
            <CardContent className="pt-6">
              <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <CardTitle className="text-xl mb-2">Inga stock cases hittades</CardTitle>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Det verkar som att det inte finns några stock cases som matchar dina filter. 
                Prova att ändra filtren eller skapa det första caset!
              </p>
              {user && (
                <Button 
                  onClick={() => setIsCreateStockCaseOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Skapa första Stock Case
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Community stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Community Stats</span>
                </div>
                <Badge variant="secondary">
                  {stockCases.length} aktiva cases
                </Badge>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/portfolio-implementation')}
                className="flex items-center gap-2"
              >
                Se sparade i portfölj
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Dialogs */}
        <CreateStockCaseDialog
          isOpen={isCreateStockCaseOpen}
          onClose={() => setIsCreateStockCaseOpen(false)}
        />
        
        <CreateAnalysisDialog
          isOpen={isCreateAnalysisOpen}
          onClose={() => setIsCreateAnalysisOpen(false)}
        />
      </div>
    </Layout>
  );
};

export default StockCases;
