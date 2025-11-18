import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  Sparkles,
  CalendarClock,
  AlertCircle,
  Loader2,
  FileText,
  Upload,
  XCircle,
  CheckCircle2,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { GeneratedReport } from '@/types/generatedReport';
import { buildTextPageFromFile } from '@/utils/documentProcessing';

const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024; // 15 MB
const SUPPORTED_DOCUMENT_TYPES = ['application/pdf', 'text/plain'];

const isSupportedDocument = (file: File) => {
  if (!file.type) {
    const lowered = file.name.toLowerCase();
    return lowered.endsWith('.pdf') || lowered.endsWith('.txt');
  }

  return SUPPORTED_DOCUMENT_TYPES.includes(file.type) || file.type.startsWith('text/');
};

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [reportDocumentInfo, setReportDocumentInfo] = useState<{
    id: string;
    name: string;
    size: number;
    pageCount: number;
    characterCount: number;
    textContent: string;
  } | null>(null);

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
  const lastRunDistance = latestRun?.created_at
    ? formatDistanceToNow(new Date(latestRun.created_at), { addSuffix: true, locale: sv })
    : 'Ingen körning';

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!user) {
      toast({
        title: 'Inloggning krävs',
        description: 'Logga in för att ladda upp och bearbeta dokument.',
        variant: 'destructive',
      });
      return;
    }

    if (!isSupportedDocument(file)) {
      toast({
        title: 'Ogiltig filtyp',
        description: 'Ladda upp en PDF- eller textfil för att kunna sammanfatta rapporten.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      toast({
        title: 'Filen är för stor',
        description: 'Välj en fil som är mindre än 15 MB.',
        variant: 'destructive',
      });
      return;
    }

    setReportDocumentInfo(null);
    setIsProcessingFile(true);

    try {
      const pages = await buildTextPageFromFile(file);

      if (!pages.length) {
        throw new Error('Kunde inte läsa någon text från dokumentet.');
      }

      const combinedText = pages
        .map((page) => page.text)
        .join('\n\n')
        .trim();

      if (!combinedText) {
        throw new Error('Dokumentet saknar läsbar text.');
      }

      const storagePath = `${user.id}/discover/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('ai-chat-documents')
        .upload(storagePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        console.error('Failed to upload discover report document', uploadError);
        throw new Error('Kunde inte spara dokumentet i lagringen.');
      }

      const { data: processData, error: processError } = await supabase.functions.invoke(
        'process-chat-document',
        {
          body: {
            userId: user.id,
            documentName: file.name,
            fileType: file.type,
            fileSize: file.size,
            storagePath,
            pages,
          },
        },
      );

      const processResult = processData as { error?: string; documentId?: string } | null;

      if (processError || processResult?.error || !processResult?.documentId) {
        const message = processError?.message || processResult?.error || 'Kunde inte bearbeta dokumentet.';
        console.error('Discover document processing failed', processError || processData);
        throw new Error(message);
      }

      const characterCount = combinedText.length;
      setReportDocumentInfo({
        id: processResult.documentId,
        name: file.name,
        size: file.size,
        pageCount: pages.length,
        characterCount,
        textContent: combinedText,
      });

      toast({
        title: 'Dokument bearbetat',
        description: 'Rapporten laddades upp via AI-chatten och är redo att analyseras.',
      });
    } catch (error) {
      console.error('Failed to process report document', error);
      toast({
        title: 'Kunde inte läsa dokumentet',
        description: error instanceof Error ? error.message : 'Ett oväntat fel inträffade vid bearbetning.',
        variant: 'destructive',
      });
      setReportDocumentInfo(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleClearFile = () => {
    setReportDocumentInfo(null);
  };

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

    if (!reportDocumentInfo) {
      toast({
        title: 'Lägg till rapport',
        description: 'Ladda upp ett dokument som underlag för sammanfattningen.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGeneratingReport(true);
      const { data, error } = await supabase.functions.invoke<GenerateReportSummaryResponse>('generate-report-summary', {
        body: {
          source_type: 'document',
          source_document_name: reportDocumentInfo?.name ?? null,
          source_document_id: reportDocumentInfo?.id ?? null,
          source_content: reportDocumentInfo?.textContent ?? null,
          created_by: user?.id ?? null,
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

      setReportDocumentInfo(null);
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

  const showAdminActions = isAdmin && !roleLoading;
  const isLoading = latestRunQuery.isLoading || roleLoading;

  if (!showAdminActions) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm supports-[backdrop-filter]:backdrop-blur-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

        <Button
          onClick={handleRegenerate}
          disabled={isBatchGenerating || isLoading}
          size="sm"
          className="self-start"
        >
          {isBatchGenerating ? <Loader2 className="mr-2 h-4 w-4" /> : null}
          Generera AI-case
        </Button>
      </div>

      {latestRunError && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {latestRunError.message || 'Det gick inte att hämta status för AI-generationen.'}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr,1.1fr]">
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-blue-500" />
            Generera rapportanalys
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Rapportunderlag</Label>
            <p className="text-xs text-muted-foreground">
              Ladda upp rapporten så extraherar AI:n bolagsnamn, titel och övriga detaljer automatiskt från innehållet.
            </p>
            <div className="rounded-2xl border border-dashed border-border/70 bg-background/60 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Ladda upp rapport</p>
                  <p className="text-xs text-muted-foreground">
                    Stöd för PDF- och textfiler upp till 15 MB. Dokumentet läses in automatiskt precis som i AI-chatten.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    id="report-upload"
                    type="file"
                    accept=".pdf,.txt,application/pdf,text/plain"
                    className="hidden"
                    onChange={handleFileSelection}
                    disabled={isProcessingFile || isGeneratingReport}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingFile || isGeneratingReport}
                  >
                    {isProcessingFile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4" />
                        Läser in...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Välj fil
                      </>
                    )}
                  </Button>
                  {reportDocumentInfo && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-xl text-muted-foreground hover:text-destructive"
                      onClick={handleClearFile}
                      disabled={isProcessingFile || isGeneratingReport}
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="sr-only">Ta bort</span>
                    </Button>
                  )}
                </div>
              </div>

              {reportDocumentInfo && (
                <div className="mt-4 rounded-xl border border-border/60 bg-card/60 p-3 text-xs text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{reportDocumentInfo.name}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                      {formatFileSize(reportDocumentInfo.size)}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      {reportDocumentInfo.pageCount} sidor
                    </Badge>
                    <Badge variant="outline" className="rounded-full">
                      {`${reportDocumentInfo.characterCount.toLocaleString('sv-SE')} tecken`}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleGenerateReport}
              disabled={
                isGeneratingReport ||
                isProcessingFile ||
                !reportDocumentInfo
              }
              className="rounded-xl"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4" />
                  Genererar rapport...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generera rapportsammanfattning
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Sammanfattningen lyfter nyckelsiffror, VD:s budskap och centrala punkter från rapporten.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-border/60 bg-background/60 p-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI-batchhistorik</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Status: <span className="font-medium text-foreground">{runStatusLabel}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Senaste körning: {isLoading ? 'Hämtar...' : lastRunDistance}
            </p>
          </div>

          {latestRun && (
            <div className="rounded-2xl border border-border/60 bg-card/60 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Batch {latestRun.id.slice(0, 8)}</p>
              <p>
                Genererade case: {latestRun.generated_count ?? 0} / {latestRun.expected_count ?? 3}
              </p>
              {latestRun.error_message && (
                <p className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {latestRun.error_message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AIGenerationAdminControls;
