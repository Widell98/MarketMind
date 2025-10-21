import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Calendar, MessageCircle, Loader2, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useStockCases } from '@/hooks/useStockCases';
import { useLatestAIGenerationRun } from '@/hooks/useAIGenerationRuns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { StockCase } from '@/types/stockCase';

const AIWeeklyPicks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const { latestRun, loading: runLoading, error: runError, refetch: refetchRun } = useLatestAIGenerationRun();

  const shouldFilterByBatch = latestRun?.status === 'succeeded' && !!latestRun.ai_batch_id;

  const {
    stockCases: aiCases,
    loading: casesLoading,
    error: casesError,
    refetch: refetchCases,
  } = useStockCases(false, {
    aiGeneratedOnly: true,
    limit: 3,
    batchId: shouldFilterByBatch ? latestRun?.ai_batch_id ?? undefined : undefined,
    waitForBatchId: shouldFilterByBatch,
  });

  const isAdmin = useMemo(() => {
    if (!user) return false;

    const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>;
    const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;

    const rolesValue = appMetadata.roles;
    if (Array.isArray(rolesValue)) {
      const roles = rolesValue.filter((role): role is string => typeof role === 'string');
      if (roles.includes('admin')) {
        return true;
      }
    }

    if (appMetadata.is_admin === true) {
      return true;
    }

    if (typeof userMetadata.role === 'string' && userMetadata.role === 'admin') {
      return true;
    }

    return false;
  }, [user]);

  const isLoading = runLoading || casesLoading || (shouldFilterByBatch && !latestRun?.ai_batch_id);
  const hasData = (aiCases?.length ?? 0) > 0;
  const runTimestamp = latestRun ? new Date(latestRun.completed_at ?? latestRun.started_at) : null;
  const runDistance = runTimestamp
    ? formatDistanceToNow(runTimestamp, { addSuffix: true, locale: sv })
    : null;

  const statusLabel = latestRun?.status === 'succeeded'
    ? 'Senaste batchen'
    : latestRun?.status === 'failed'
      ? 'Misslyckad generering'
      : latestRun?.status === 'running'
        ? 'Generering pågår'
        : latestRun?.status === 'pending'
          ? 'Planerad körning'
          : 'Ingen körning ännu';

  const statusVariant: 'outline' | 'secondary' | 'destructive' = latestRun?.status === 'succeeded'
    ? 'outline'
    : latestRun?.status === 'failed'
      ? 'destructive'
      : 'secondary';

  const handleViewDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };

  const handleDiscussWithAI = (stockCase: StockCase) => {
    const contextData = {
      type: 'stock_case',
      id: stockCase.id,
      title: stockCase.title,
      data: stockCase,
    };

    navigate('/ai-chatt', {
      state: {
        contextData,
      },
    });
  };

  const handleGenerateAICases = async () => {
    if (!isAdmin) return;

    setIsRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-cases', {
        body: { triggered_by: 'admin_manual' },
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error ?? 'Kunde inte generera nya case');
      }

      toast({
        title: 'AI-case genereras',
        description: 'En ny batch AI-case genereras nu.',
      });

      await Promise.all([refetchRun(), refetchCases()]);
    } catch (error) {
      console.error('Failed to regenerate AI cases', error);
      toast({
        title: 'Kunde inte generera case',
        description: error instanceof Error ? error.message : 'Försök igen senare.',
        variant: 'destructive',
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const headerBadges = (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
        <Calendar className="w-3 h-3 mr-1" />
        Uppdateras 2x/vecka
      </Badge>
      {runDistance && (
        <Badge variant="outline" className="bg-muted text-muted-foreground">
          <Clock className="w-3 h-3 mr-1" />
          Senast {runDistance}
        </Badge>
      )}
      {latestRun && (
        <Badge variant={statusVariant}>
          {statusLabel}
        </Badge>
      )}
    </div>
  );

  if (isLoading && !hasData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold">AI Veckans Val</h2>
          </div>
          {isAdmin && (
            <Button variant="outline" size="sm" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Genererar...
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if ((runError || casesError) && !hasData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold">AI Veckans Val</h2>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex items-start gap-3 p-6">
            <AlertCircle className="mt-1 h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">Kunde inte läsa in AI-case just nu.</p>
              <p className="text-sm text-muted-foreground">Försök att uppdatera sidan eller kom tillbaka lite senare.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold">AI Veckans Val</h2>
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAICases}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Generera ny batch
            </Button>
          )}
        </div>
        <Card className="border-dashed">
          <CardContent className="space-y-3 p-6">
            <p className="font-medium">Inga AI-case är tillgängliga ännu.</p>
            <p className="text-sm text-muted-foreground">
              Så snart den schemalagda körningen har lyckats dyker de senaste AI-förslagen upp här.
            </p>
            {latestRun?.status === 'failed' && latestRun.error_message && (
              <p className="text-xs text-destructive">Fel: {latestRun.error_message}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold">AI Veckans Val</h2>
          {headerBadges}
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateAICases}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Generera ny batch
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {aiCases.map((stockCase) => (
          <Card
            key={stockCase.id}
            className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20"
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI-Genererad
                      </Badge>
                      {stockCase.case_categories && (
                        <Badge variant="secondary" className="text-xs">
                          {stockCase.case_categories.name}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold line-clamp-2 text-sm mb-1">
                      {stockCase.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {stockCase.company_name}
                    </p>
                    {stockCase.sector && (
                      <Badge variant="outline" className="text-xs mb-2">
                        {stockCase.sector}
                      </Badge>
                    )}
                  </div>
                </div>

                {stockCase.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {stockCase.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDiscussWithAI(stockCase)}
                      className="text-purple-600 hover:text-purple-700 text-xs"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Diskutera
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(stockCase.id)}
                    className="text-xs"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Visa detaljer
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Genererad {formatDistanceToNow(new Date(stockCase.generated_at ?? stockCase.created_at), {
                    addSuffix: true,
                    locale: sv,
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIWeeklyPicks;
