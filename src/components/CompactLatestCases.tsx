
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight } from 'lucide-react';
import { useLatestStockCases } from '@/hooks/useLatestStockCases';
import { useStockCases } from '@/hooks/useStockCases';
import { useFollowingStockCases } from '@/hooks/useFollowingStockCases';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginPromptModal from '@/components/LoginPromptModal';
import EnhancedStockCaseCard from '@/components/EnhancedStockCaseCard';
import CompactLatestCasesEmpty from '@/components/CompactLatestCasesEmpty';
import CompactLatestCasesFilters from '@/components/CompactLatestCasesFilters';
import EnhancedAnalysisCard from '@/components/EnhancedAnalysisCard';
import { useAnalyses } from '@/hooks/useAnalyses';
import { useFollowingAnalyses } from '@/hooks/useFollowingAnalyses';

const CompactLatestCases = () => {
  const [viewMode, setViewMode] = useState<'all' | 'trending' | 'followed'>('all');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch data based on view mode - limit to 3 for compact display
  const { stockCases: allStockCases, loading: allLoading } = useStockCases(false);
  const { followingStockCases, loading: followingLoading } = useFollowingStockCases();
  const { trendingCases, loading: trendingLoading } = useTrendingStockCases(3);
  const { latestCases: latestStockCases, loading: latestLoading } = useLatestStockCases(3);
  const { data: latestAnalyses = [], isLoading: analysesLoading } = useAnalyses(3);
  const { data: followingAnalyses = [], isLoading: followingAnalysesLoading } = useFollowingAnalyses();
  const getDisplayData = () => {
    switch (viewMode) {
      case 'all':
        return { cases: latestStockCases, loading: latestLoading };
      case 'trending':
        return { cases: trendingCases, loading: trendingLoading };
      case 'followed':
        return { cases: followingStockCases.slice(0, 3), loading: followingLoading };
      default:
        return { cases: latestStockCases, loading: latestLoading };
    }
  };

  const { cases: displayCases, loading } = getDisplayData();
  const displayAnalyses = viewMode === 'followed' && user ? (followingAnalyses || []).slice(0, 3) : (latestAnalyses || []);
  const analysesLoadingState = viewMode === 'followed' && user ? followingAnalysesLoading : analysesLoading;

  const handleCreateCase = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    navigate('/stock-cases');
  };

  const handleViewAll = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    navigate('/stock-cases');
  };

  const handleViewDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };

  const handleViewAnalysisDetails = (id: string) => {
    navigate(`/analysis/${id}`);
  };

  const handleViewAllAnalyses = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    navigate('/market-analyses');
  };

  const handleDelete = async (id: string) => {
    // For read-only display on homepage, we don't need delete functionality
    console.log('Delete not available on homepage');
  };

  if (loading) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="w-6 h-6 text-blue-500" />
            Senaste Aktiefall & Analyser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayCases.length === 0) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock className="w-6 h-6 text-blue-500" />
              Senaste Aktiefall & Analyser
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleViewAll}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Visa alla
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <CompactLatestCasesFilters 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            user={user}
          />
        </CardHeader>
        <CardContent>
          <CompactLatestCasesEmpty 
            viewMode={viewMode}
            user={user}
            onCreateCase={handleCreateCase}
          />
        </CardContent>
        <CardContent>
          <div className="mt-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Senaste analyser</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleViewAllAnalyses}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Visa alla analyser
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            {analysesLoadingState ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : displayAnalyses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayAnalyses.map((analysis: any) => (
                  <EnhancedAnalysisCard 
                    key={analysis.id}
                    analysis={analysis}
                    onViewDetails={handleViewAnalysisDetails}
                    showProfileActions={true}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Inga analyser hittades just nu.</p>
            )}
          </div>
        </CardContent>
        <LoginPromptModal 
          isOpen={showLoginPrompt} 
          onClose={() => setShowLoginPrompt(false)} 
        />
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock className="w-6 h-6 text-blue-500" />
              Senaste Aktiefall & Analyser
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleViewAll}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Visa alla
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <CompactLatestCasesFilters 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            user={user}
          />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCases.map((stockCase) => (
              <EnhancedStockCaseCard 
                key={stockCase.id} 
                stockCase={stockCase} 
                onViewDetails={handleViewDetails} 
                onDelete={handleDelete}
                showProfileActions={true}
              />
            ))}
          </div>
          
          {/* Call to action for non-logged in users */}
          {!user && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Vill du skapa egna aktiefall och få tillgång till alla funktioner?
              </p>
              <Button onClick={handleCreateCase} variant="outline" size="sm">
                Skapa konto gratis
              </Button>
            </div>
          )}

          {/* Analyses section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Senaste analyser</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleViewAllAnalyses}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Visa alla analyser
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            {analysesLoadingState ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayAnalyses.length > 0 ? (
                  displayAnalyses.map((analysis: any) => (
                    <EnhancedAnalysisCard 
                      key={analysis.id}
                      analysis={analysis}
                      onViewDetails={handleViewAnalysisDetails}
                      showProfileActions={true}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Inga analyser hittades just nu.</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <LoginPromptModal 
        isOpen={showLoginPrompt} 
        onClose={() => setShowLoginPrompt(false)} 
      />
    </>
  );
};

export default CompactLatestCases;
