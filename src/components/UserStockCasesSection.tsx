
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Eye, Heart, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

const UserStockCasesSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: stockCases, isLoading } = useQuery({
    queryKey: ['user-stock-cases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('stock_cases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const deleteStockCaseMutation = useMutation({
    mutationFn: async (stockCaseId: string) => {
      const { error } = await supabase
        .from('stock_cases')
        .delete()
        .eq('id', stockCaseId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stock-cases'] });
      toast({
        title: 'Aktiecase borttaget',
        description: 'Ditt aktiecase har tagits bort framgångsrikt.',
      });
    },
    onError: (error) => {
      console.error('Error deleting stock case:', error);
      toast({
        title: 'Fel vid borttagning',
        description: 'Kunde inte ta bort aktiecaset. Försök igen.',
        variant: 'destructive',
      });
    },
  });

  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const getStatusBadge = (status: string, performance: number | null) => {
    if (status === 'winner') {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs">
          Winner {performance ? `+${performance}%` : ''}
        </Badge>
      );
    }
    if (status === 'loser') {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs">
          Loser {performance ? `${performance}%` : ''}
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
        Active
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Mina Aktiecases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Laddar aktiecases...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Mina Aktiecases ({stockCases?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!stockCases || stockCases.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Du har inte skapat några aktiecases än.</p>
            <Button 
              onClick={() => navigate('/my-stock-cases')} 
              className="mt-4"
            >
              Skapa ditt första aktiecase
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {stockCases.map((stockCase) => (
              <div key={stockCase.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {stockCase.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {stockCase.company_name}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(stockCase.status, stockCase.performance_percentage)}
                      <Badge variant="outline" className="text-xs">
                        {stockCase.sector || 'Sektor ej angiven'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/stock-cases/${stockCase.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
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
                          <AlertDialogTitle>Ta bort aktiecase</AlertDialogTitle>
                          <AlertDialogDescription>
                            Är du säker på att du vill ta bort detta aktiecase? Alla kopplade analyser kommer också att tas bort. Denna åtgärd kan inte ångras.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteStockCaseMutation.mutate(stockCase.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Ta bort
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                {stockCase.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {stockCase.description.substring(0, 150)}...
                  </p>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  {stockCase.entry_price && (
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Entry</div>
                      <div className="text-sm font-semibold">{formatPrice(stockCase.entry_price)}</div>
                    </div>
                  )}
                  {stockCase.current_price && (
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Current</div>
                      <div className="text-sm font-semibold">{formatPrice(stockCase.current_price)}</div>
                    </div>
                  )}
                  {stockCase.target_price && (
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Target</div>
                      <div className="text-sm font-semibold">{formatPrice(stockCase.target_price)}</div>
                    </div>
                  )}
                  {stockCase.stop_loss && (
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Stop Loss</div>
                      <div className="text-sm font-semibold">{formatPrice(stockCase.stop_loss)}</div>
                    </div>
                  )}
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(stockCase.created_at), { addSuffix: true, locale: sv })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={stockCase.is_public ? "default" : "secondary"} className="text-xs">
                      {stockCase.is_public ? "Publikt" : "Privat"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserStockCasesSection;
