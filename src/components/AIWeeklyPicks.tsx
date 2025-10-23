import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Calendar, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { useLatestStockCases } from '@/hooks/useLatestStockCases';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type AIGenerationRun = Database['public']['Tables']['ai_generation_runs']['Row'];

type GenerateWeeklyCasesResponse = {
  success: boolean;
  run_id?: string;
  generated_cases?: number;
  warnings?: string[];
  error?: string;
};

const AIWeeklyPicks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const metadata = user.app_metadata || {};
    return metadata.is_admin === true || metadata.role === 'admin';
  }, [user]);

  const latestBatchQuery = useQuery<AIGenerationRun | null>({
    queryKey: ['ai-generation-runs', 'latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_generation_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      return data?.[0] ?? null;
    },
  });

  const latestRun = latestBatchQuery.data;

  const {
    latestCases: aiCases,
    loading: casesLoading,
    error: casesError,
    refetch: refetchCases,
  } = useLatestStockCases({
    limit: 3,
    aiGeneratedOnly: true,
    aiBatchId: latestRun?.status === 'completed' ? latestRun.id : undefined,
    enabled: latestRun?.status === 'completed',
  });

  const handleViewDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };

  const handleDiscussWithAI = (stockCase: any) => {
    const contextData = {
      type: 'stock_case',
      id: stockCase.id,
      title: stockCase.title,
      data: stockCase
    };
    navigate('/ai-chatt', {
      state: {
        contextData
      }
    });
  };

  const handleRegenerate = async () => {
    if (!isAdmin) return;

    try {
      setIsGenerating(true);
      const { data, error } = await supabase.functions.invoke<GenerateWeeklyCasesResponse>('generate-weekly-cases', {
        body: { triggered_by: 'admin_manual' },
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'AI-generation misslyckades');
      }

      toast({
        title: 'AI-generation klar',
        description: data.generated_cases
          ? `Genererade ${data.generated_cases} nya AI-case.`
          : 'AI-generationen slutfördes utan rapporterad mängd.',
      });

      if (data.warnings && data.warnings.length > 0) {
        toast({
          title: 'Avisering',
          description: data.warnings.join(' | '),
        });
      }

      await latestBatchQuery.refetch();
      refetchCases();
    } catch (error: any) {
      console.error('Failed to regenerate AI cases:', error);
      toast({
        title: 'Kunde inte generera AI-case',
        description: error.message || 'Ett oväntat fel uppstod',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const runError = latestBatchQuery.error as { message?: string } | null;
  const runTimestamp = latestRun?.completed_at ?? latestRun?.created_at ?? null;
  const runDistance = runTimestamp
    ? formatDistanceToNow(new Date(runTimestamp), {
        addSuffix: true,
        locale: sv,
      })
    : null;

  const showSkeleton = latestBatchQuery.isLoading || (latestRun?.status === 'completed' && casesLoading);

  if (!latestRun && !latestBatchQuery.isLoading && !isAdmin) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Veckans Val
          </span>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            <Calendar className="mr-1 h-3 w-3" />
            Uppdateras automatiskt
          </Badge>
          {latestRun && (
            <Badge variant={latestRun.status === 'completed' ? 'secondary' : latestRun.status === 'failed' ? 'destructive' : 'outline'}>
              {latestRun.status === 'completed' ? 'Senaste batch klar' : latestRun.status === 'failed' ? 'Misslyckad batch' : 'Körs...'}
            </Badge>
          )}
          {runDistance && (
            <Badge variant="outline">{`Senast ${runDistance}`}</Badge>
          )}
          {latestRun && (
            <Badge variant="outline">{`${latestRun.generated_count}/${latestRun.expected_count} idéer`}</Badge>
          )}
        </div>
        {isAdmin && (
          <Button onClick={handleRegenerate} size="sm" disabled={isGenerating}>
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Regenerera batch
          </Button>
        )}
      </div>

      {showSkeleton && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="space-y-3 p-4">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!showSkeleton && latestRun?.status === 'completed' && aiCases.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {aiCases.map((stockCase) => (
            <Card
              key={stockCase.id}
              className="border-0 bg-gradient-to-br from-purple-50 to-blue-50 shadow-sm transition-all duration-200 hover:shadow-md dark:from-purple-900/20 dark:to-blue-900/20"
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          <Sparkles className="mr-1 h-3 w-3" />
                          AI-Genererad
                        </Badge>
                        {stockCase.case_categories && (
                          <Badge variant="secondary" className="text-xs">
                            {stockCase.case_categories.name}
                          </Badge>
                        )}
                      </div>
                      <h3 className="mb-1 line-clamp-2 text-sm font-semibold">{stockCase.title}</h3>
                      <p className="mb-2 text-sm text-muted-foreground">{stockCase.company_name}</p>
                      {stockCase.sector && (
                        <Badge variant="outline" className="mb-2 text-xs">
                          {stockCase.sector}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {stockCase.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{stockCase.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDiscussWithAI(stockCase)}
                      className="text-xs text-purple-600 hover:text-purple-700"
                    >
                      <MessageCircle className="mr-1 h-3 w-3" />
                      Diskutera
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(stockCase.id)} className="text-xs">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Visa detaljer
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Genererad{' '}
                    {formatDistanceToNow(new Date(stockCase.generated_at || stockCase.created_at), {
                      addSuffix: true,
                      locale: sv,
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!showSkeleton && latestRun?.status === 'completed' && latestRun.generated_count < latestRun.expected_count && (
        <p className="mt-4 text-sm text-muted-foreground">
          Endast {latestRun.generated_count} av {latestRun.expected_count} planerade idéer genererades denna gång
          {latestRun.error_message ? ` (${latestRun.error_message})` : ''}.
        </p>
      )}

      {!showSkeleton && latestRun?.status === 'completed' && aiCases.length === 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-background/80 p-4 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          Inga AI-case kunde hämtas från den senaste batchen.{latestRun.error_message ? ` ${latestRun.error_message}` : ''}
        </div>
      )}

      {!showSkeleton && latestRun && latestRun.status !== 'completed' && (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-background/80 p-4 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          {latestRun.status === 'failed'
            ? `Senaste körningen misslyckades${latestRun.error_message ? `: ${latestRun.error_message}` : ''}.`
            : 'AI-generationen pågår just nu. Kom tillbaka om en stund!'}
        </div>
      )}

      {!showSkeleton && !latestRun && isAdmin && (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-background/80 p-4 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          Inga AI-generationer har körts ännu. Klicka på "Regenerera batch" för att skapa den första.
        </div>
      )}

      {(runError || casesError) && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>
            {runError?.message || casesError?.message || 'Ett fel inträffade när AI-casen skulle hämtas.'}
          </span>
        </div>
      )}
    </section>
  );
};

export default AIWeeklyPicks;