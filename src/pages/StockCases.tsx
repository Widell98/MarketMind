
import React from 'react';
import { useStockCases } from '@/hooks/useStockCases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Users, Activity, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import StockCaseCard from '@/components/StockCaseCard';

const StockCases = () => {
  const { stockCases, loading, deleteStockCase } = useStockCases();
  const navigate = useNavigate();

  const handleViewStockCaseDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };

  const handleDeleteStockCase = async (id: string) => {
    try {
      await deleteStockCase(id);
    } catch (error) {
      // Error is already handled in the deleteStockCase function
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Laddar aktiecases...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 lg:space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till startsidan
          </Button>
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Aktiecases
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Utforska våra handplockade aktiecases och lär dig om intressanta investeringsmöjligheter
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-lg text-blue-800 dark:text-blue-200">Community</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                1,234
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">Aktiva medlemmar</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                <CardTitle className="text-lg text-green-800 dark:text-green-200">Cases totalt</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100 mb-1">
                {stockCases.length}
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">Aktiecases</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-lg text-purple-800 dark:text-purple-200">Topprankade</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-1">
                {stockCases.filter(c => c.status === 'winner').length}
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">Vinnare</p>
            </CardContent>
          </Card>
        </div>

        {/* Stock Cases Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Alla aktiecases
            </h2>
          </div>

          {stockCases.length === 0 ? (
            <Card className="text-center py-12 bg-gray-50 dark:bg-gray-800">
              <CardContent className="pt-6">
                <TrendingUp className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <CardTitle className="text-xl mb-2 text-gray-900 dark:text-gray-100">
                  Inga aktiecases än
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Aktiecases kommer att visas här när de läggs till av våra experter.
                </p>
                <Button onClick={() => navigate('/profile')}>
                  Skapa ditt första case
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stockCases.map((stockCase) => (
                <StockCaseCard
                  key={stockCase.id}
                  stockCase={stockCase}
                  onViewDetails={handleViewStockCaseDetails}
                  onDelete={handleDeleteStockCase}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StockCases;
