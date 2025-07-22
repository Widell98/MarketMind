
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Eye, Calendar, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ContentItem {
  id: string;
  title: string;
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
    if (item.type === 'stock_case') {
      return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop';
    } else {
      return 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=300&fit=crop';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const filteredContent = getFilteredContent();

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-white dark:bg-gray-700 text-finance-navy dark:text-gray-200 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-finance-navy dark:hover:text-gray-200'
            }`}
          >
            Alla ({allContent.length})
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'cases'
                ? 'bg-white dark:bg-gray-700 text-finance-navy dark:text-gray-200 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-finance-navy dark:hover:text-gray-200'
            }`}
          >
            Aktiecases ({stockCases.length})
          </button>
          <button
            onClick={() => setActiveTab('analyses')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analyses'
                ? 'bg-white dark:bg-gray-700 text-finance-navy dark:text-gray-200 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-finance-navy dark:hover:text-gray-200'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContent.map((item) => (
            <Card 
              key={`${item.type}-${item.id}`}
              className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md"
              onClick={() => handleContentClick(item)}
            >
              <div className="relative aspect-square">
                <img
                  src={item.image_url || getDefaultImage(item)}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Overlay with stats - appears on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-white text-center space-y-2">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1">
                        <Heart className="h-5 w-5 fill-current" />
                        <span className="font-semibold">{item.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-5 w-5 fill-current" />
                        <span className="font-semibold">{item.comments_count || 0}</span>
                      </div>
                      {item.views_count && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-5 w-5" />
                          <span className="font-semibold">{item.views_count}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Type indicator */}
                <div className="absolute top-2 left-2">
                  <Badge 
                    variant="secondary"
                    className={`${
                      item.type === 'stock_case' 
                        ? 'bg-blue-500/80 text-white' 
                        : 'bg-green-500/80 text-white'
                    } backdrop-blur-sm`}
                  >
                    {item.type === 'stock_case' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <Eye className="h-3 w-3 mr-1" />
                    )}
                    {item.type === 'stock_case' ? 'Case' : 'Analys'}
                  </Badge>
                </div>

                {/* Status indicator for stock cases */}
                {item.type === 'stock_case' && item.status && (
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

              <CardContent className="p-4">
                <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(item.created_at).toLocaleDateString('sv-SE', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                  
                  {(item.sector || item.analysis_type) && (
                    <Badge variant="outline" className="text-xs">
                      {item.sector || item.analysis_type}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileContentGrid;
