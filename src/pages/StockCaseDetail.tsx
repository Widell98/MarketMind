
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStockCase } from '@/hooks/useStockCases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Building, DollarSign } from 'lucide-react';

const StockCaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { stockCase, loading } = useStockCase(id!);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar akticase...</p>
        </div>
      </div>
    );
  }

  if (!stockCase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Akticase hittades inte</h2>
            <p className="text-gray-600 mb-4">Det begärda aktiecaset kunde inte hittas.</p>
            <Button onClick={() => navigate('/stock-cases')}>
              Tillbaka till aktiecases
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/stock-cases')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka till aktiecases
        </Button>

        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{stockCase.title}</h1>
            <h2 className="text-2xl text-gray-700 mb-4">{stockCase.company_name}</h2>
          </div>

          {/* Image */}
          {stockCase.image_url && (
            <Card className="overflow-hidden">
              <div className="aspect-video w-full">
                <img
                  src={stockCase.image_url}
                  alt={`${stockCase.company_name} aktiekurs chart`}
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
          )}

          {/* Company Facts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Företagsfakta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stockCase.sector && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">Sektor</h3>
                    <p className="text-gray-700">{stockCase.sector}</p>
                  </div>
                )}
                {stockCase.market_cap && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900">Börsvärde</h3>
                    <p className="text-gray-700">{stockCase.market_cap}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {stockCase.description && (
            <Card>
              <CardHeader>
                <CardTitle>Om företaget</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {stockCase.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Admin Comment */}
          {stockCase.admin_comment && (
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <CardTitle className="text-blue-900">Expertanalys & Rekommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 leading-relaxed whitespace-pre-wrap">
                    {stockCase.admin_comment}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Intresserad av att investera?</h3>
                <p className="mb-4 opacity-90">
                  Kom ihåg att alltid göra din egen research innan du investerar. Detta är endast ett utbildningsexempel.
                </p>
                <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                  Läs mer om investeringar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StockCaseDetail;
