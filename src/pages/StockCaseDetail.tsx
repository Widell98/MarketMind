import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStockCase } from '@/hooks/useStockCases';
import { useStockCaseImageHistory } from '@/hooks/useStockCaseImageHistory';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, TrendingUp, Building, ZoomIn, User, Target, DollarSign, BarChart3, Calendar, Eye } from 'lucide-react';
import ImageModal from '@/components/ImageModal';
import ImageHistoryNavigation from '@/components/ImageHistoryNavigation';
import ImageUploadDialog from '@/components/ImageUploadDialog';
import UserProfileSidebar from '@/components/UserProfileSidebar';
import RelatedAnalyses from '@/components/RelatedAnalyses';
import CreateAnalysisFromStockCase from '@/components/CreateAnalysisFromStockCase';

const StockCaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { stockCase, loading } = useStockCase(id!);
  const { 
    images, 
    loading: historyLoading, 
    currentImageIndex, 
    setCurrentImageIndex, 
    setCurrentImage, 
    addImageToHistory 
  } = useStockCaseImageHistory(id!);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Initialize image history with the main stock case image if no history exists
  useEffect(() => {
    const initializeImageHistory = async () => {
      if (stockCase && !historyLoading && images.length === 0 && stockCase.image_url) {
        try {
          await addImageToHistory(
            stockCase.image_url, 
            'Initial analysis chart', 
            true
          );
        } catch (error) {
          console.error('Error initializing image history:', error);
        }
      }
    };

    initializeImageHistory();
  }, [stockCase, historyLoading, images.length, addImageToHistory]);

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
    return new Date(dateString).toLocaleDateString('en-US', {
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

  const handleImageAdded = async (imageUrl: string, description?: string) => {
    try {
      // Add the new image to history and set it as current
      await addImageToHistory(imageUrl, description, true);
    } catch (error) {
      console.error('Error adding image to history:', error);
      throw error;
    }
  };

  const handleImageClick = () => {
    console.log('Image clicked, opening modal');
    setIsImageModalOpen(true);
  };

  // Create a proper UserProfile object with all required fields
  const userProfile = stockCase.profiles ? {
    id: stockCase.profiles.id,
    username: stockCase.profiles.username,
    display_name: stockCase.profiles.display_name,
    bio: null,
    avatar_url: null,
    location: null,
    website: null,
    created_at: new Date().toISOString(), // Fallback date
    updated_at: new Date().toISOString()  // Fallback date
  } : null;

  // Component for expandable text
  const ExpandableText = ({ text, maxLength = 200 }: { text: string; maxLength?: number }) => {
    if (text.length <= maxLength) {
      return <span>{text}</span>;
    }

    return (
      <Dialog>
        <DialogTrigger asChild>
          <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {text.substring(0, maxLength)}...{' '}
            <span className="text-blue-600 dark:text-blue-400 underline inline-flex items-center">
              <Eye className="w-3 h-3 ml-1" />
              Läs mer
            </span>
          </span>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fullständig text</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {text}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/stock-cases')}
          className="mb-4 sm:mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to stock cases
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="text-center space-y-3 sm:space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-heading bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight px-2">
                {stockCase.title}
              </h1>
              <Badge variant="outline" className="text-sm sm:text-base lg:text-lg px-3 py-1 sm:px-4 sm:py-2">
                {stockCase.status === 'active' ? 'Active Analysis' : 'Completed Analysis'}
              </Badge>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 sm:gap-4 justify-center px-2">
              <CreateAnalysisFromStockCase
                stockCaseId={stockCase.id}
                stockCaseTitle={stockCase.title}
                companyName={stockCase.company_name}
                stockCaseUserId={stockCase.user_id}
              />
            </div>

            {/* Image with better mobile sizing */}
            {imageUrl && (
              <div className="space-y-4 sm:space-y-6">
                <Card className="overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300" onClick={handleImageClick}>
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt={`${stockCase.title} stock price chart`}
                      className="w-full h-auto object-contain transition-all duration-300 group-hover:scale-105 min-h-[350px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[600px] max-h-[500px] sm:max-h-[600px] md:max-h-[700px] lg:max-h-[800px] mx-auto"
                      style={{
                        imageRendering: 'crisp-edges'
                      }}
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="bg-white/95 dark:bg-gray-800/95 rounded-full p-3 shadow-lg backdrop-blur-sm border border-white/20">
                        <ZoomIn className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                      </div>
                    </div>
                    {/* Click hint overlay */}
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                      Click to enlarge
                    </div>
                  </div>
                </Card>

                {/* Upload new image button */}
                <div className="flex justify-end px-2">
                  <ImageUploadDialog
                    stockCaseId={id!}
                    onImageAdded={handleImageAdded}
                    canEdit={canEdit}
                  />
                </div>

                {/* Image History Navigation - More compact for mobile */}
                {!historyLoading && images.length > 1 && (
                  <div className="px-2">
                    <ImageHistoryNavigation
                      images={images}
                      currentIndex={currentImageIndex}
                      onIndexChange={setCurrentImageIndex}
                      onSetCurrent={setCurrentImage}
                      canEdit={canEdit}
                      caseOwnerId={stockCase.user_id}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Related Analyses */}
            <div className="px-2">
              <RelatedAnalyses stockCaseId={stockCase.id} />
            </div>

            {/* User Analysis */}
            {stockCase.admin_comment && (
              <div className="px-2">
                <Card className="border-l-4 border-l-purple-500 shadow-lg">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-purple-900 dark:text-purple-300 flex items-center text-base sm:text-lg">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      My Analysis & Reflection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 sm:p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                      <div className="text-purple-800 dark:text-purple-200 leading-relaxed text-sm sm:text-base">
                        <ExpandableText text={stockCase.admin_comment} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Company Facts - Improved mobile grid */}
            <div className="px-2">
              <Card className="shadow-lg">
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center text-gray-900 dark:text-gray-100 text-base sm:text-lg">
                    <Building className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                    Company Facts & Investment Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {stockCase.entry_price && (
                      <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                        <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2 sm:mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-xs sm:text-sm">Entry Price</h3>
                        <p className="text-gray-700 dark:text-gray-300 font-mono text-xs sm:text-sm">{formatPrice(stockCase.entry_price)}</p>
                      </div>
                    )}

                    {stockCase.target_price && (
                      <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                        <Target className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 mx-auto mb-2 sm:mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-xs sm:text-sm">Target Price</h3>
                        <p className="text-gray-700 dark:text-gray-300 font-mono text-xs sm:text-sm">{formatPrice(stockCase.target_price)}</p>
                      </div>
                    )}

                    {stockCase.current_price && (
                      <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800 col-span-2 sm:col-span-1">
                        <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2 sm:mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-xs sm:text-sm">Current Price</h3>
                        <p className="text-gray-700 dark:text-gray-300 font-mono text-xs sm:text-sm">{formatPrice(stockCase.current_price)}</p>
                      </div>
                    )}

                    {stockCase.stop_loss && (
                      <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-800">
                        <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 mx-auto mb-2 sm:mb-3 rotate-180" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-xs sm:text-sm">Stop Loss</h3>
                        <p className="text-gray-700 dark:text-gray-300 font-mono text-xs sm:text-sm">{formatPrice(stockCase.stop_loss)}</p>
                      </div>
                    )}

                    <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 rounded-xl border border-gray-200 dark:border-gray-700">
                      <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 mx-auto mb-2 sm:mb-3" />
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-xs sm:text-sm">Created</h3>
                      <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">{formatDate(stockCase.created_at)}</p>
                    </div>

                    {stockCase.sector && (
                      <div className="text-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800 col-span-2 sm:col-span-1">
                        <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2 sm:mb-3" />
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-xs sm:text-sm">Sector</h3>
                        <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">{stockCase.sector}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {stockCase.description && (
              <div className="px-2">
                <Card className="shadow-lg">
                  <CardHeader className="pb-3 sm:pb-6">
                    <CardTitle className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">About the company</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                      <ExpandableText text={stockCase.description} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Sidebar - User Profile - Better mobile handling */}
          <div className="lg:col-span-1 px-2 lg:px-0">
            <UserProfileSidebar 
              userId={stockCase.user_id} 
              userProfile={userProfile}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => {
          console.log('Closing modal');
          setIsImageModalOpen(false);
        }}
        imageUrl={imageUrl || ''}
        altText={`${stockCase.title} stock price chart`}
      />
    </div>
  );
};

export default StockCaseDetail;
