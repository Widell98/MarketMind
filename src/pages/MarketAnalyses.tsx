
import React from 'react';
import Layout from '@/components/Layout';
import AnalysisFeed from '@/components/AnalysisFeed';
import { BarChart3, TrendingUp } from 'lucide-react';

const MarketAnalyses = () => {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Marknadsanalyser
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Upptäck de senaste marknadsanalyserna från vårt community
          </p>
        </div>

        {/* Analysis Feed */}
        <AnalysisFeed />
      </div>
    </Layout>
  );
};

export default MarketAnalyses;
