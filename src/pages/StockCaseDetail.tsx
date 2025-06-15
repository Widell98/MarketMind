
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStockCase } from '@/hooks/useStockCases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Building, ZoomIn, User } from 'lucide-react';
import ImageModal from '@/components/ImageModal';

const StockCaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { stockCase, loading } = useStockCase(id!);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading stock case...</p>
        </div>
      </div>
    );
  }

  if (!stockCase) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Stock case not found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">The requested stock case could not be found.</p>
            <Button onClick={() => navigate('/stock-cases')}>
              Back to stock cases
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/stock-cases')}
          className="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to stock cases
        </Button>

        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">{stockCase.title}</h1>
            <h2 className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300">{stockCase.company_name}</h2>
          </div>

          {/* Image */}
          {stockCase.image_url && (
            <Card className="overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300" onClick={() => setIsImageModalOpen(true)}>
              <div className="relative aspect-video w-full">
                <img
                  src={stockCase.image_url}
                  alt={`${stockCase.company_name} stock price chart`}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-800/90 rounded-full p-3 shadow-lg">
                    <ZoomIn className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* User Analysis - moved directly below image */}
          {stockCase.admin_comment && (
            <Card className="border-l-4 border-l-purple-500 shadow-lg">
              <CardHeader>
                <CardTitle className="text-purple-900 dark:text-purple-300 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Min Analys & Reflektion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                  <p className="text-purple-800 dark:text-purple-200 leading-relaxed whitespace-pre-wrap">
                    {stockCase.admin_comment}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Company Facts - only show sector, removed market cap */}
          {stockCase.sector && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                  <Building className="w-5 h-5 mr-2 text-blue-600" />
                  Company Facts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Sector</h3>
                    <p className="text-gray-700 dark:text-gray-300">{stockCase.sector}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {stockCase.description && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">About the company</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {stockCase.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold">Interested in investing?</h3>
                <p className="opacity-90 max-w-2xl mx-auto">
                  Remember to always do your own research before investing. This is only an educational example.
                </p>
                <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 font-medium px-8 py-3">
                  Learn more about investing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={stockCase.image_url || ''}
        altText={`${stockCase.company_name} stock price chart`}
      />
    </div>
  );
};

export default StockCaseDetail;
