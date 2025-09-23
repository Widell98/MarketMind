import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Eye, Heart, Calendar, FileText, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import CreateAnalysisDialog from '@/components/CreateAnalysisDialog';
import { useNavigate } from 'react-router-dom';
import { usePersistentDialogOpenState } from '@/hooks/usePersistentDialogOpenState';
import { CREATE_ANALYSIS_DIALOG_STORAGE_KEY } from '@/constants/storageKeys';

interface UserAnalysesSectionProps {
  compact?: boolean;
}

const UserAnalysesSection = ({ compact = false }: UserAnalysesSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    isOpen: isCreateDialogOpen,
    open: openCreateDialog,
    close: closeCreateDialog,
  } = usePersistentDialogOpenState(CREATE_ANALYSIS_DIALOG_STORAGE_KEY, 'user-analyses');
  const navigate = useNavigate();

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['user-analyses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('analyses')
        .select(`
          *,
          stock_cases(title, company_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const deleteAnalysisMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', analysisId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-analyses'] });
      toast({
        title: 'Analys borttagen',
        description: 'Din analys har tagits bort framgångsrikt.',
      });
    },
    onError: (error) => {
      console.error('Error deleting analysis:', error);
      toast({
        title: 'Fel vid borttagning',
        description: 'Kunde inte ta bort analysen. Försök igen.',
        variant: 'destructive',
      });
    },
  });

  const getAnalysisTypeBadge = (type: string) => {
    const colors = {
      'market_insight': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'technical_analysis': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'fundamental_analysis': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'sector_analysis': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    };
    
    const colorClass = colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    
    return (
      <Badge className={`${colorClass} text-xs`}>
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Mina Analyser ({analyses?.length || 0})
            </CardTitle>
            <Button 
              onClick={() => navigate('/market-analyses')}
              variant="outline"
              size="sm"
            >
              Se alla
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Laddar...</p>
            </div>
          ) : !analyses || analyses.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">Inga analyser än.</p>
              <Button 
                onClick={openCreateDialog}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Skapa första analys
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.slice(0, 3).map((analysis) => (
                <div key={analysis.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {analysis.title}
                    </h4>
                    {analysis.stock_cases && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                        {analysis.stock_cases.company_name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {getAnalysisTypeBadge(analysis.analysis_type)}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ta bort analys</AlertDialogTitle>
                          <AlertDialogDescription>
                            Är du säker på att du vill ta bort denna analys? Denna åtgärd kan inte ångras.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAnalysisMutation.mutate(analysis.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Ta bort
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              {analyses.length > 3 && (
                <Button 
                  onClick={() => navigate('/market-analyses')}
                  variant="outline"
                  className="w-full mt-3"
                  size="sm"
                >
                  Se alla {analyses.length} analyser
                </Button>
              )}
            </div>
          )}
          
        <CreateAnalysisDialog
          isOpen={isCreateDialogOpen}
          onClose={closeCreateDialog}
        />
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Mina Analyser
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Laddar analyser...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Mina Analyser ({analyses?.length || 0})
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Skapa analys
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!analyses || analyses.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Du har inte skapat några analyser än.</p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Skapa analys
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <div key={analysis.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {analysis.title}
                    </h3>
                    {analysis.stock_cases && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                        Kopplad till: {analysis.stock_cases.title} - {analysis.stock_cases.company_name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      {getAnalysisTypeBadge(analysis.analysis_type)}
                      {analysis.tags && analysis.tags.length > 0 && (
                        <div className="flex gap-1">
                          {analysis.tags.slice(0, 3).map((tag: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {analysis.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{analysis.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ta bort analys</AlertDialogTitle>
                          <AlertDialogDescription>
                            Är du säker på att du vill ta bort denna analys? Denna åtgärd kan inte ångras.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAnalysisMutation.mutate(analysis.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Ta bort
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {analysis.content.substring(0, 150)}...
                </p>
                
                <Separator className="my-3" />
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: sv })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{analysis.views_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>{analysis.likes_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CreateAnalysisDialog
        isOpen={isCreateDialogOpen}
        onClose={closeCreateDialog}
      />
    </Card>
  );
};

export default UserAnalysesSection;
