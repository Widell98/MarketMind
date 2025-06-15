
import React from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { useTrendingStockCases } from '@/hooks/useTrendingStockCases';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import StockCaseCard from '@/components/StockCaseCard';

const TrendingCasesGrid = () => {
  const { trendingCases, loading } = useTrendingStockCases(6);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            Trending Cases
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-96"></div>
          ))}
        </div>
      </div>
    );
  }

  if (trendingCases.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            Trending Cases
          </h2>
        </div>
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            No trending cases yet. Be the first to like a case!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          Trending Cases
        </h2>
        <Button 
          variant="ghost"
          onClick={() => navigate('/stock-cases')}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View All Cases
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendingCases.map((stockCase) => (
          <StockCaseCard
            key={stockCase.id}
            stockCase={stockCase}
            onViewDetails={(id) => navigate(`/stock-cases/${id}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default TrendingCasesGrid;
