
import React, { useState } from 'react';
import { useStockCases } from '@/hooks/useStockCases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, TrendingUp, AlertCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import StockCaseCard from '@/components/StockCaseCard';
import { useAuth } from '@/contexts/AuthContext';

const Watchlist = () => {
  const { user } = useAuth();
  const { stockCases: followedCases, loading } = useStockCases(true);
  const navigate = useNavigate();

  const handleViewStockCaseDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };

  // Helper function to calculate performance
  const calculatePerformance = (stockCase: any) => {
    if (stockCase.entry_price && stockCase.current_price) {
      return ((stockCase.current_price - stockCase.entry_price) / stockCase.entry_price) * 100;
    }
    return stockCase.performance_percentage || 0;
  };

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Sign In Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need to be signed in to view your watchlist.
          </p>
          <Button onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <Bookmark className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              My Watchlist
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your followed stock cases and investment opportunities
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-lg text-blue-800 dark:text-blue-200">Followed Cases</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                {followedCases.length}
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Active Follows</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                <CardTitle className="text-lg text-green-800 dark:text-green-200">Performing Well</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100 mb-1">
                {followedCases.filter(c => calculatePerformance(c) > 0).length}
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">Positive Performance</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-yellow-100 dark:from-orange-950 dark:to-yellow-900 border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <CardTitle className="text-lg text-orange-800 dark:text-orange-200">Needs Attention</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-1">
                {followedCases.filter(c => calculatePerformance(c) < -5).length}
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300">Down {'>'}5%</p>
            </CardContent>
          </Card>
        </div>

        {/* Watchlist Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : followedCases.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <Bookmark className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <CardTitle className="text-xl mb-2 text-gray-900 dark:text-gray-100">
                Your watchlist is empty
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start following stock cases to see them here. Browse our curated cases and click the bookmark icon to add them to your watchlist.
              </p>
              <Button onClick={() => navigate('/stock-cases')}>
                <Plus className="w-4 h-4 mr-2" />
                Browse Stock Cases
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {followedCases.map((stockCase) => (
              <StockCaseCard
                key={stockCase.id}
                stockCase={stockCase}
                onViewDetails={handleViewStockCaseDetails}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Watchlist;
