
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filter, TrendingUp, BarChart3 } from 'lucide-react';
import InstagramStockCaseCard from './InstagramStockCaseCard';
import TwitterAnalysisCard from './TwitterAnalysisCard';
import { useStockCases } from '@/hooks/useStockCases';
import { useAnalyses } from '@/hooks/useAnalyses';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';

interface MixedDiscoveryFeedProps {
  onViewStockCase: (id: string) => void;
  onViewAnalysis: (id: string) => void;
}

const MixedDiscoveryFeed = ({ onViewStockCase, onViewAnalysis }: MixedDiscoveryFeedProps) => {
  const [filter, setFilter] = useState<'all' | 'stock_cases' | 'analyses'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'trending'>('latest');

  const { stockCases, loading: stockCasesLoading } = useStockCases(false);
  const { data: analyses, isLoading: analysesLoading } = useAnalyses(20);
  const { trendingCases, loading: trendingLoading } = useTrendingStockCases(10);

  // Combine and sort content
  const mixedContent = useMemo(() => {
    const items: Array<{ type: 'stock_case' | 'analysis'; data: any; timestamp: string }> = [];

    // Add stock cases
    if (filter === 'all' || filter === 'stock_cases') {
      const casesToUse = sortBy === 'trending' ? trendingCases : stockCases;
      casesToUse.forEach(stockCase => {
        items.push({
          type: 'stock_case',
          data: stockCase,
          timestamp: stockCase.created_at
        });
      });
    }

    // Add analyses
    if (filter === 'all' || filter === 'analyses') {
      (analyses || []).forEach(analysis => {
        items.push({
          type: 'analysis',
          data: analysis,
          timestamp: analysis.created_at
        });
      });
    }

    // Sort by timestamp (latest first)
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [stockCases, analyses, trendingCases, filter, sortBy]);

  const loading = stockCasesLoading || analysesLoading || (sortBy === 'trending' && trendingLoading);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Alla
          </Button>
          <Button
            variant={filter === 'stock_cases' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('stock_cases')}
            className="flex items-center gap-2"
          >
            📊 Aktie-case
          </Button>
          <Button
            variant={filter === 'analyses' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('analyses')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analyser
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={sortBy === 'latest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('latest')}
          >
            Senaste
          </Button>
          <Button
            variant={sortBy === 'trending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('trending')}
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Trending
          </Button>
        </div>
      </div>

      {/* Content count */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {mixedContent.length} {filter === 'all' ? 'innehåll' : filter === 'stock_cases' ? 'aktie-case' : 'analyser'}
        </Badge>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-96"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {mixedContent.map((item, index) => (
            <div key={`${item.type}-${item.data.id}-${index}`}>
              {item.type === 'stock_case' ? (
                <div className="flex justify-center">
                  <InstagramStockCaseCard
                    stockCase={item.data}
                    onViewDetails={onViewStockCase}
                  />
                </div>
              ) : (
                <TwitterAnalysisCard
                  analysis={item.data}
                  onViewDetails={onViewAnalysis}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && mixedContent.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-600 mb-4">
            {filter === 'all' ? '📱' : filter === 'stock_cases' ? '📊' : '📄'}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Inget innehåll hittades
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all' 
              ? 'Det finns inget innehåll att visa just nu.'
              : filter === 'stock_cases'
              ? 'Inga aktie-case hittades.'
              : 'Inga analyser hittades.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default MixedDiscoveryFeed;
