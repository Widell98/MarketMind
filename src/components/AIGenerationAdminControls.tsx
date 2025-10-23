import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Sparkles, CalendarClock, AlertCircle, Loader2 } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATUS_LABELS: Record<string, string> = {
  running: 'Pågår',
  completed: 'Genomförd',
  failed: 'Misslyckad',
};

type AIGenerationRun = Database['public']['Tables']['ai_generation_runs']['Row'];

type GenerateWeeklyCasesResponse = {
  success: boolean;
  run_id?: string;
  generated_cases?: number;
  error?: string;
  warnings?: string[];
};

const AIGenerationAdminControls = () => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const latestRunQuery = useQuery<AIGenerationRun | null>({
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
    enabled: isAdmin,
  });

  const latestRun = latestRunQuery.data;
  const latestRunError = latestRunQuery.error as { message?: string } | null;
  const runStatusLabel = latestRun?.status ? STATUS_LABELS[latestRun.status] ?? latestRun.status : 'Ingen körning';

  const handleRegenerate = async () => {
    if (!isAdmin || isGenerating) return;

    try {
      setIsGenerating(true);
      const { data, error } = await supabase.functions.invoke<GenerateWeeklyCasesResponse>('generate-weekly-cases', {
        body: { triggered_by: 'admin_manual' },
      });

      if (error) {
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'AI-generationen misslyckades');
      }

      toast({
        title: 'AI-case genererade',
        description: data.generated_cases
          ? `Skapade ${data.generated_cases} nya case.`
          : 'AI-generationen slutfördes.',
      });

      if (data.warnings && data.warnings.length > 0) {
        toast({
          title: 'Aviseringar',
          description: data.warnings.join(' | '),
        });
      }

      await latestRunQuery.refetch();
    } catch (err: any) {
      console.error('Failed to regenerate AI cases:', err);
      toast({
        title: 'Kunde inte generera AI-case',
        description: err?.message || 'Ett oväntat fel uppstod',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const runTimestamp = latestRun?.completed_at ?? latestRun?.created_at ?? null;
  const lastRunDistance = runTimestamp
    ? formatDistanceToNow(new Date(runTimestamp), { addSuffix: true, locale: sv })
    : 'Aldrig';

  const showAdminActions = isAdmin && !roleLoading;
  const isLoading = latestRunQuery.isLoading || roleLoading;

  if (!isAdmin && !roleLoading) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm supports-[backdrop-filter]:backdrop-blur-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-2 text-base font-semibold sm:text-lg">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI-generator
            {latestRun && (
              <Badge variant="outline" className="text-xs">
                Batch {latestRun.id.slice(0, 8)}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={latestRun?.status === 'completed' ? 'secondary' : latestRun?.status === 'failed' ? 'destructive' : 'outline'}>
              {isLoading ? 'Hämtar status...' : runStatusLabel}
            </Badge>
            <div className="flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              <span>Senast: {isLoading ? 'Uppdaterar...' : lastRunDistance}</span>
            </div>
            {latestRun && (
              <span>
                Resultat: {latestRun.generated_count ?? 0}/{latestRun.expected_count ?? 3}
              </span>
            )}
            {latestRun?.error_message && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {latestRun.error_message}
              </span>
            )}
          </div>
        </div>

        {showAdminActions && (
          <Button
            onClick={handleRegenerate}
            disabled={isGenerating || isLoading}
            size="sm"
            className="self-start"
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generera AI-case
          </Button>
        )}
      </div>

      {latestRunError && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {latestRunError.message || 'Det gick inte att hämta status för AI-generationen.'}
        </div>
      )}
    </section>
  );
};

export default AIGenerationAdminControls;
