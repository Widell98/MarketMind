import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStockCase } from '@/hooks/useStockCases';
import { useStockCaseImageHistory } from '@/hooks/useStockCaseImageHistory';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, Building, ZoomIn, User, Target, DollarSign, BarChart3, Calendar } from 'lucide-react';
import ImageModal from '@/components/ImageModal';
import ImageHistoryNavigation from '@/components/ImageHistoryNavigation';

const StockCaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { stockCase, loading } = useStockCase(id!);
  const { images, loading: historyLoading, currentImageIndex, setCurrentImageIndex, setCurrentImage } = useStockCaseImageHistory(id!);
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

  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Determine which image to show - from history if available, otherwise fallback to main image
  const displayImage = images.length > 0 ? images[currentImageIndex] : null;
  const imageUrl = displayImage?.image_url || stockCase.image_url;
  
  // Check if user can edit (is admin or case owner)
  const canEdit = isAdmin || (user && stockCase.user_id === user.id);

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
          {/* Header - improved title font */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              {stockCase.title}
            </h1>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {stockCase.status === 'active' ? 'Aktiv analys' : 'Avslutad analys'}
            </Badge>
          </div>

          {/* Image */}
          {imageUrl && (
            <div className="space-y-4">
              <Card className="overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300" onClick={() => setIsImageModalOpen(true)}>
                <div className="relative aspect-video w-full">
                  <img
                    src={imageUrl}
                    alt={`${stockCase.title} stock price chart`}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-800/90 rounded-full p-3 shadow-lg">
                      <ZoomIn className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Image History Navigation */}
              {!historyLoading && (
                <ImageHistoryNavigation
                  images={images}
                  currentIndex={currentImageIndex}
                  onIndexChange={setCurrentImageIndex}
                  onSetCurrent={setCurrentImage}
                  canEdit={canEdit}
                />
              )}
            </div>
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

          {/* Company Facts - enhanced with more information */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-gray-100">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                Company Facts & Investment Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stockCase.entry_price && (
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Ingångspris</h3>
                    <p className="text-gray-700 dark:text-gray-300 font-mono">{formatPrice(stockCase.entry_price)}</p>
                  </div>
                )}

                {stockCase.target_price && (
                  <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <Target className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Målkurs</h3>
                    <p className="text-gray-700 dark:text-gray-300 font-mono">{formatPrice(stockCase.target_price)}</p>
                  </div>
                )}

                {stockCase.current_price && (
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Nuvarande Kurs</h3>
                    <p className="text-gray-700 dark:text-gray-300 font-mono">{formatPrice(stockCase.current_price)}</p>
                  </div>
                )}

                {stockCase.stop_loss && (
                  <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-800">
                    <TrendingUp className="w-8 h-8 text-red-600 mx-auto mb-3 rotate-180" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Stop Loss</h3>
                    <p className="text-gray-700 dark:text-gray-300 font-mono">{formatPrice(stockCase.stop_loss)}</p>
                  </div>
                )}

                <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 rounded-xl border border-gray-200 dark:border-gray-700">
                  <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Skapad</h3>
                  <p className="text-gray-700 dark:text-gray-300">{formatDate(stockCase.created_at)}</p>
                </div>

                {stockCase.sector && (
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Sektor</h3>
                    <p className="text-gray-700 dark:text-gray-300">{stockCase.sector}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={imageUrl || ''}
        altText={`${stockCase.title} stock price chart`}
      />
    </div>
  );
};

export default StockCaseDetail;
