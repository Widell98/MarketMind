
import React from 'react';
import { useStockCases } from '@/hooks/useStockCases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StockCases = () => {
  const { stockCases, loading } = useStockCases();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar aktiecases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till startsidan
          </Button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Aktiecases</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Utforska våra handplockade aktiecases och lär dig om intressanta investeringsmöjligheter
            </p>
          </div>
        </div>

        {stockCases.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Inga aktiecases än</h2>
            <p className="text-gray-600">Aktiecases kommer att visas här när de läggs till av våra experter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stockCases.map((stockCase) => (
              <Card
                key={stockCase.id}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => navigate(`/stock-cases/${stockCase.id}`)}
              >
                {stockCase.image_url && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img
                      src={stockCase.image_url}
                      alt={stockCase.company_name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {stockCase.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 font-medium">{stockCase.company_name}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {stockCase.sector && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Sektor:</span>
                        <span className="font-medium">{stockCase.sector}</span>
                      </div>
                    )}
                    {stockCase.market_cap && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Börsvärde:</span>
                        <span className="font-medium">{stockCase.market_cap}</span>
                      </div>
                    )}
                    {stockCase.description && (
                      <p className="text-sm text-gray-700 line-clamp-3 mt-3">
                        {stockCase.description}
                      </p>
                    )}
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    Läs mer
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockCases;
