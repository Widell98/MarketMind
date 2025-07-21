
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Heart, MessageCircle, Calendar, User, Edit, Bot } from 'lucide-react';
import { useAnalyses } from '@/hooks/useAnalyses';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import SaveOpportunityButton from '@/components/SaveOpportunityButton';
import CreateAnalysisDialog from '@/components/CreateAnalysisDialog';

interface AnalysisSectionProps {
  limit?: number;
  showHeader?: boolean;
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ 
  limit = 6, 
  showHeader = true 
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: analyses, isLoading, error } = useAnalyses(limit);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleViewAnalysis = (id: string) => {
    navigate(`/analysis/${id}`);
  };

  const handleDiscussWithAI = (analysis: any) => {
    const contextData = {
      type: 'analysis',
      id: analysis.id,
      title: analysis.title,
      data: analysis
    };
    navigate('/ai-chat', { state: { contextData } });
  };

  const handleEditAnalysis = (analysisId: string) => {
    navigate('/my-analyses');
  };

  const getAnalysisTypeColor = (type: string) => {
    const colors = {
      'market_insight': 'bg-blue-500',
      'company_analysis': 'bg-green-500',
      'sector_analysis': 'bg-purple-500',
      'technical_analysis': 'bg-orange-500',
      'fundamental_analysis': 'bg-red-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const getAnalysisTypeLabel = (type: string) => {
    const labels = {
      'market_insight': 'Marknadsinsikt',
      'company_analysis': 'Företagsanalys',
      'sector_analysis': 'Sektoranalys',
      'technical_analysis': 'Teknisk analys',
      'fundamental_analysis': 'Fundamental analys'
    };
    return labels[type as keyof typeof labels] || 'Analys';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Senaste Analyser</h2>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Skapa Analys
            </Button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Senaste Analyser</h2>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Skapa Analys
            </Button>
          </div>
        )}
        <Card className="text-center py-8 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-4">
            <p className="text-red-600 dark:text-red-400 mb-2">
              Det gick inte att ladda analyser
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Försök igen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Senaste Analyser</h2>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Skapa Analys
            </Button>
          </div>
        )}
        <Card className="text-center py-8 bg-gray-50 dark:bg-gray-800">
          <CardContent className="pt-4">
            <MessageCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <CardTitle className="text-lg mb-2">Inga analyser än</CardTitle>
            <p className="text-sm text-muted-foreground mb-4">
              Bli den första att dela en analys med communityn!
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Skapa Analys
            </Button>
          </CardContent>
        </Card>
        <CreateAnalysisDialog 
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Senaste Analyser</h2>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Skapa Analys
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analyses.map((analysis) => {
          const isOwner = user && analysis.user_id === user.id;
          
          return (
            <Card 
              key={analysis.id} 
              className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={() => handleViewAnalysis(analysis.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={`${getAnalysisTypeColor(analysis.analysis_type)} text-white text-xs`}
                      >
                        {getAnalysisTypeLabel(analysis.analysis_type)}
                      </Badge>
                      
                      {/* Owner Badge */}
                      {isOwner && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                          Din Analys
                        </Badge>
                      )}
                      
                      {/* AI Generated Badge */}
                      {analysis.ai_generated && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                          <Bot className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                    
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {analysis.title}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                  {analysis.content}
                </p>

                {/* Tags */}
                {analysis.tags && analysis.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {analysis.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {analysis.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{analysis.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* AI Discussion and Save Section */}
                {user && (
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg mb-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDiscussWithAI(analysis);
                        }}
                        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex-1"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Diskutera med AI
                      </Button>
                      
                      <SaveOpportunityButton 
                        itemType="analysis" 
                        itemId={analysis.id}
                        itemTitle={analysis.title}
                        variant="outline"
                        size="sm"
                        showText={false}
                      />
                    </div>
                    
                    {/* Owner Actions */}
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAnalysis(analysis.id);
                        }}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 w-full"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Redigera i Mina Analyser
                      </Button>
                    )}
                  </div>
                )}

                {/* Meta information */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{analysis.views_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>{analysis.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{analysis.comments_count || 0}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: sv })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{analysis.profiles?.display_name || analysis.profiles?.username || 'Anonym'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <CreateAnalysisDialog 
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
};

export default AnalysisSection;
