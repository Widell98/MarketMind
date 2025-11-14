import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Sparkles, CalendarClock, AlertCircle, Loader2, FileText } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { GeneratedReport } from '@/types/generatedReport';

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

type GenerateReportSummaryResponse = {
  success: boolean;
  report?: GeneratedReport;
  error?: string;
};

interface AIGenerationAdminControlsProps {
  onReportGenerated?: (report: GeneratedReport) => void;
}

const AIGenerationAdminControls: React.FC<AIGenerationAdminControlsProps> = ({ onReportGenerated }) => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceContent, setSourceContent] = useState('');

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
    if (!isAdmin || isBatchGenerating) return;

    try {
      setIsBatchGenerating(true);
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
    } catch (err) {
      console.error('Failed to regenerate AI cases:', err);
      const message = err instanceof Error ? err.message : 'Ett oväntat fel uppstod';
      toast({
        title: 'Kunde inte generera AI-case',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!isAdmin || isGeneratingReport) {
      return;
    }

    const normalizedCompany = companyName.trim();
    const normalizedTitle = reportTitle.trim();
    const normalizedUrl = sourceUrl.trim();
    const normalizedContent = sourceContent.trim();

    if (!normalizedCompany) {
      toast({
        title: 'Fyll i bolagsnamn',
        description: 'Ange vilket bolag rapporten handlar om innan du genererar en analys.',
        variant: 'destructive',
      });
      return;
    }

    if (!normalizedContent && !normalizedUrl) {
      toast({
        title: 'Lägg till underlag',
        description: 'Klistra in rapporttext eller ange en länk som underlag för analysen.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGeneratingReport(true);
      const { data, error } = await supabase.functions.invoke<GenerateReportSummaryResponse>('generate-report-summary', {
        body: {
          company_name: normalizedCompany,
          report_title: normalizedTitle || `${normalizedCompany} rapport`,
          source_url: normalizedUrl || null,
          source_content: normalizedContent || null,
          source_type: normalizedContent ? 'text' : 'url',
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.success || !data.report) {
        throw new Error(data?.error || 'Rapportsammanfattningen kunde inte skapas');
      }

      toast({
        title: 'Rapport genererad',
        description: `${data.report.companyName} sammanfattades automatiskt.`,
      });

      if (onReportGenerated) {
        onReportGenerated(data.report);
      }

      setReportTitle('');
      setSourceUrl('');
      setSourceContent('');
    } catch (err) {
      console.error('Failed to generate report summary:', err);
      const message = err instanceof Error ? err.message : 'Ett oväntat fel uppstod vid generering av analys.';
      toast({
        title: 'Kunde inte skapa rapport',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingReport(false);
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
            disabled={isBatchGenerating || isLoading}
            size="sm"
            className="self-start"
          >
            {isBatchGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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

      {showAdminActions && (
        <div className="mt-6 space-y-4 rounded-2xl border border-border/70 bg-background/50 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-blue-500" />
            Generera rapportanalys
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="report-company">Bolag *</Label>
              <Input
                id="report-company"
                placeholder="Volvo, Investor, etc."
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                disabled={isGeneratingReport}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-title">Rapporttitel</Label>
              <Input
                id="report-title"
                placeholder="Q2-rapport 2024"
                value={reportTitle}
                onChange={(event) => setReportTitle(event.target.value)}
                disabled={isGeneratingReport}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="report-url">Länk till källa</Label>
              <Input
                id="report-url"
                placeholder="https://"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                disabled={isGeneratingReport}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="report-content">Klistra in rapporttext</Label>
              <Textarea
                id="report-content"
                placeholder="Klistra in relevanta avsnitt från rapporten här..."
                value={sourceContent}
                onChange={(event) => setSourceContent(event.target.value)}
                disabled={isGeneratingReport}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Ange antingen en länk till rapporten eller klistra in ett utdrag för att skapa en AI-sammanfattning.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Button onClick={handleGenerateReport} disabled={isGeneratingReport}>
              {isGeneratingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generera case
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default AIGenerationAdminControls;
