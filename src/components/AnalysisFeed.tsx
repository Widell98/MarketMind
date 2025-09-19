import React, { useState } from 'react';
import { useAnalyses } from '@/hooks/useAnalyses';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  BookOpen,
  Search,
  TrendingUp,
  Eye,
  Calendar,
  Filter,
  Plus
} from 'lucide-react';
import AddAnalysisToHoldingDialog from './AddAnalysisToHoldingDialog';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

const AnalysisFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: analyses, isLoading } = useAnalyses(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Filter analyses based on search and type
  const filteredAnalyses = analyses?.filter(analysis => {
    const matchesSearch = !searchTerm || 
      analysis.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || analysis.analysis_type === selectedType;
    
    return matchesSearch && matchesType;
  }) || [];

  const getAnalysisTypeLabel = (type: string) => {
    const labels = {
      'market_insight': 'Marknadsinsikt',
      'technical_analysis': 'Teknisk analys',
      'fundamental_analysis': 'Fundamental analys',
      'sector_analysis': 'Sektoranalys',
      'portfolio_analysis': 'Portföljanalys',
      'position_analysis': 'Positionsanalys',
      'sector_deep_dive': 'Sektordjupdykning'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAnalysisTypeColor = (type: string) => {
    const colors = {
      'market_insight': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'technical_analysis': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'fundamental_analysis': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'sector_analysis': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      'portfolio_analysis': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      'position_analysis': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      'sector_deep_dive': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const handleAnalysisClick = (analysisId: string) => {
    navigate(`/analysis/${analysisId}`);
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleDiscussWithAI = (analysis: any) => {
    const contextData = {
      type: 'analysis',
      id: analysis.id,
      title: analysis.title,
      data: analysis
    };
    navigate('/ai-chatt', { state: { contextData } });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex space-x-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Sök analyser..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background text-foreground"
          >
            <option value="all">Alla typer</option>
            <option value="market_insight">Marknadsinsikt</option>
            <option value="technical_analysis">Teknisk analys</option>
            <option value="fundamental_analysis">Fundamental analys</option>
            <option value="sector_analysis">Sektoranalys</option>
          </select>
        </div>
      </div>

      {/* Analysis Feed */}
      <div className="space-y-4">
        {filteredAnalyses.map((analysis) => (
          <Card key={analysis.id} className="hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <Avatar 
                  className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                  onClick={() => handleUserClick(analysis.user_id)}
                >
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {analysis.profiles?.display_name?.[0] || analysis.profiles?.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => handleUserClick(analysis.user_id)}
                      className="font-semibold text-sm hover:underline"
                    >
                      {analysis.profiles?.display_name || analysis.profiles?.username || 'Okänd användare'}
                    </button>
                    <span className="text-muted-foreground text-sm">
                      @{analysis.profiles?.username || 'unknown'}
                    </span>
                    <span className="text-muted-foreground text-sm">·</span>
                    <span className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: sv })}
                    </span>
                  </div>

                  {/* Analysis Type Badge */}
                  <div className="mb-3">
                    <Badge variant="outline" className={`text-xs ${getAnalysisTypeColor(analysis.analysis_type)}`}>
                      <BookOpen className="w-3 h-3 mr-1" />
                      {getAnalysisTypeLabel(analysis.analysis_type)}
                    </Badge>
                  </div>

                  {/* Title and Content */}
                  <div onClick={() => handleAnalysisClick(analysis.id)} className="cursor-pointer">
                    <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 transition-colors">
                      {analysis.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                      {analysis.content.substring(0, 200)}
                      {analysis.content.length > 200 && '...'}
                    </p>
                  </div>

                  {/* Tags */}
                  {analysis.tags && analysis.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {analysis.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Engagement Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center space-x-6">
                      <button className="flex items-center space-x-2 text-muted-foreground hover:text-red-500 transition-colors group">
                        <Heart className="w-4 h-4 group-hover:fill-current" />
                        <span className="text-sm">{analysis.likes_count || 0}</span>
                      </button>
                      
                      <button 
                        onClick={() => handleAnalysisClick(analysis.id)}
                        className="flex items-center space-x-2 text-muted-foreground hover:text-blue-500 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{analysis.comments_count || 0}</span>
                      </button>

                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">{analysis.views_count || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <AddAnalysisToHoldingDialog analysis={analysis}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Lägg till
                        </Button>
                      </AddAnalysisToHoldingDialog>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDiscussWithAI(analysis)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Diskutera med AI
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAnalysisClick(analysis.id)}
                      >
                        Läs mer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAnalyses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Inga analyser hittades</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || selectedType !== 'all' 
              ? 'Prova att ändra dina sökkriterier eller filter.'
              : 'Var den första att dela en marknadsanalys!'
            }
          </p>
          {user && (
            <Button 
              onClick={() => navigate('/create-analysis')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Skapa första analysen
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisFeed;
