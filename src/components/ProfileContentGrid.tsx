
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Eye, Calendar, TrendingUp, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getOptimizedCaseImage, handleCaseImageError } from '@/utils/imageUtils';

interface ContentItem {
  id: string;
  title: string;
  content?: string;
  image_url?: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  views_count?: number;
  type: 'stock_case' | 'analysis';
  status?: string;
  sector?: string;
  analysis_type?: string;
}

interface ProfileContentGridProps {
  stockCases: any[];
  analyses: any[];
  isLoading: boolean;
}

const ProfileContentGrid: React.FC<ProfileContentGridProps> = ({
  stockCases,
  analyses,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'cases' | 'analyses'>('all');
  const navigate = useNavigate();

  // Combine and sort content
  const allContent: ContentItem[] = [
    ...stockCases.map(item => ({ ...item, type: 'stock_case' as const })),
    ...analyses.map(item => ({ ...item, type: 'analysis' as const }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getFilteredContent = () => {
    switch (activeTab) {
      case 'cases':
        return stockCases.map(item => ({ ...item, type: 'stock_case' as const }));
      case 'analyses':
        return analyses.map(item => ({ ...item, type: 'analysis' as const }));
      default:
        return allContent;
    }
  };

  const handleContentClick = (item: ContentItem) => {
    if (item.type === 'stock_case') {
      navigate(`/stock-cases/${item.id}`);
    } else {
      navigate(`/analysis/${item.id}`);
    }
  };

  const getDefaultImage = (item: ContentItem) => {
    return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop';
  };

  const truncateText = (text: string, maxLength: number = 180) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const filteredContent = getFilteredContent();

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="flex bg-muted rounded-lg p-1 border">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Alla ({allContent.length})
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'cases'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Aktiecases ({stockCases.length})
          </button>
          <button
            onClick={() => setActiveTab('analyses')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analyses'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Analyser ({analyses.length})
          </button>
        </div>
      </div>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-600 mb-2">
            {activeTab === 'all' && 'Inga inlägg än'}
            {activeTab === 'cases' && 'Inga aktiecases än'}
            {activeTab === 'analyses' && 'Inga analyser än'}
          </div>
          <p className="text-sm text-muted-foreground">
            {activeTab === 'cases' && 'Skapa ditt första aktiecase för att komma igång'}
            {activeTab === 'analyses' && 'Skriv din första analys för att komma igång'}
            {activeTab === 'all' && 'Börja skapa innehåll för att fylla din profil'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContent.map((item) => {
            // Render stock cases as visual cards (Instagram-style)
            if (item.type === 'stock_case') {
              const optimizedSources = getOptimizedCaseImage(item.image_url);
              const displayImageSrc = optimizedSources?.src ?? item.image_url ?? null;
              const displayImageSrcSet = optimizedSources?.srcSet;

              return (
                <Card
                  key={`${item.type}-${item.id}`}
                  className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md"
                  onClick={() => handleContentClick(item)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative aspect-square md:aspect-auto">
                      {displayImageSrc ? (
                        <img
                          src={displayImageSrc}
                          srcSet={displayImageSrcSet}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                          onError={handleCaseImageError}
                          data-original-src={item.image_url || undefined}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground bg-muted">
                          Ingen bild
                        </div>
                      )}
                      
                      {/* Status indicator */}
                      {item.status && (
                        <div className="absolute top-2 right-2">
                          <Badge 
                            variant="secondary"
                            className={`backdrop-blur-sm ${
                              item.status === 'active' 
                                ? 'bg-green-500/80 text-white' 
                                : 'bg-gray-500/80 text-white'
                            }`}
                          >
                            {item.status === 'active' ? 'Aktiv' : 'Stängd'}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        <Badge 
                          variant="secondary"
                          className="bg-blue-500/10 text-blue-600 ml-2"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Case
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(item.created_at).toLocaleDateString('sv-SE', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                           <div className="flex items-center gap-1">
                             <MessageCircle className="h-4 w-4" />
                             <span>{item.comments_count || 0}</span>
                           </div>
                            {item.views_count && (
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{item.views_count}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {item.sector && (
                          <Badge variant="outline" className="text-xs">
                            {item.sector}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            }

            // Render analyses as compact text cards (Twitter/X-style)
            return (
              <Card 
                key={`${item.type}-${item.id}`}
                className="group cursor-pointer hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-800"
                onClick={() => handleContentClick(item)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Analysis icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        <Badge 
                          variant="secondary"
                          className="bg-green-500/10 text-green-600 ml-2 flex-shrink-0"
                        >
                          Analys
                        </Badge>
                      </div>
                      
                      {/* Content preview */}
                      {item.content && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                          {truncateText(item.content)}
                        </p>
                      )}
                      
                      {/* Footer with stats and date */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(item.created_at).toLocaleDateString('sv-SE', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        
                         <div className="flex items-center gap-3">
                           <div className="flex items-center gap-1">
                             <MessageCircle className="h-3 w-3" />
                             <span>{item.comments_count || 0}</span>
                           </div>
                          {item.views_count && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{item.views_count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileContentGrid;
