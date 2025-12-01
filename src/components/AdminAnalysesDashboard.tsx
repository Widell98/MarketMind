import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  BarChart3,
  Calendar,
  FileText,
  ImageOff,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  User,
} from 'lucide-react';

import AIGenerationAdminControls from '@/components/AIGenerationAdminControls';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAnalyses, useDeleteAnalysis } from '@/hooks/useAnalysisOperations';
import {
  DISCOVER_REPORT_SUMMARIES_QUERY_KEY,
  useDiscoverReportSummaries,
} from '@/hooks/useDiscoverReportSummaries';
import { useToast } from '@/hooks/use-toast';
import { GeneratedReport, GeneratedReportKeyMetric } from '@/types/generatedReport';

interface Analysis {
  id: string;
  title: string;
  content: string;
  analysis_type: string;
  created_at: string;
  user_id: string;
  is_public: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  ai_generated?: boolean;
  profiles?: {
    username: string;
    display_name: string | null;
  };
  stock_cases?: {
    company_name: string;
    title: string;
  };
  user_portfolios?: {
    portfolio_name: string;
  };
}

interface EditableMetric {
  label: string;
  value: string;
  trend: string;
}

interface UpdateReportPayload {
  id: string;
  report_title: string;
  company_name: string;
  summary: string;
  key_points: string[];
  key_metrics: GeneratedReportKeyMetric[];
  ceo_commentary: string | null;
  source_url: string | null;
  company_logo_url: string | null;
}

const PUBLIC_REPORT_LIMIT = 12;
const ADMIN_REPORT_LIMIT = 50;

const AdminAnalysesDashboard: React.FC = () => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [editingReport, setEditingReport] = useState<GeneratedReport | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreviewFailed, setLogoPreviewFailed] = useState(false);
  const [editForm, setEditForm] = useState({
    reportTitle: '',
    companyName: '',
    summary: '',
    keyPointsText: '',
    ceoCommentary: '',
    sourceUrl: '',
    companyLogoUrl: '',
  });
  const [editMetrics, setEditMetrics] = useState<EditableMetric[]>([]);

  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const deleteAnalysis = useDeleteAnalysis();
  const { fetchAllAnalyses } = useAdminAnalyses();
  const { reports: reportSummaries, loading: reportsLoading } = useDiscoverReportSummaries(ADMIN_REPORT_LIMIT);

  const loadAnalyses = async () => {
    setLoadingAnalyses(true);
    const data = await fetchAllAnalyses();
    setAnalyses(data);
    setLoadingAnalyses(false);
  };

  useEffect(() => {
    setLogoPreviewFailed(false);
  }, [editForm.companyLogoUrl]);

  useEffect(() => {
    loadAnalyses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteAnalysis = async (analysisId: string) => {
    await deleteAnalysis.mutateAsync(analysisId);
    loadAnalyses();
  };

  const syncReportCache = (report: GeneratedReport) => {
    const updateCache = (limit: number) => {
      queryClient.setQueryData<GeneratedReport[]>(
        [DISCOVER_REPORT_SUMMARIES_QUERY_KEY, limit],
        (current = []) => {
          const merged = [report, ...current.filter((item) => item.id !== report.id)];
          return merged.slice(0, limit);
        },
      );
    };

    updateCache(PUBLIC_REPORT_LIMIT);
    updateCache(ADMIN_REPORT_LIMIT);
  };

  const pruneReportCache = (reportId: string) => {
    const prune = (limit: number) => {
      queryClient.setQueryData<GeneratedReport[]>(
        [DISCOVER_REPORT_SUMMARIES_QUERY_KEY, limit],
        (current = []) => current.filter((item) => item.id !== reportId),
      );
    };

    prune(PUBLIC_REPORT_LIMIT);
    prune(ADMIN_REPORT_LIMIT);
  };

  const handleReportGenerated = (report: GeneratedReport) => {
    syncReportCache(report);
    queryClient.invalidateQueries({ queryKey: [DISCOVER_REPORT_SUMMARIES_QUERY_KEY] });
  };

  const getAnalysisTypeColor = (type: string) => {
    const colors = {
      market_insight: 'bg-purple-100 text-purple-800',
      technical_analysis: 'bg-blue-100 text-blue-800',
      fundamental_analysis: 'bg-green-100 text-green-800',
      sector_analysis: 'bg-orange-100 text-orange-800',
      portfolio_analysis: 'bg-indigo-100 text-indigo-800',
      position_analysis: 'bg-pink-100 text-pink-800',
      sector_deep_dive: 'bg-yellow-100 text-yellow-800',
    } as const;

    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getAnalysisTypeLabel = (type: string) => {
    const labels = {
      market_insight: 'Marknadsinsikt',
      technical_analysis: 'Teknisk analys',
      fundamental_analysis: 'Fundamental analys',
      sector_analysis: 'Sektoranalys',
      portfolio_analysis: 'Portföljanalys',
      position_analysis: 'Positionsanalys',
      sector_deep_dive: 'Djupanalys sektor',
    } as const;

    return labels[type as keyof typeof labels] || type;
  };

  const resetEditState = () => {
    setEditingReport(null);
    setEditForm({
      reportTitle: '',
      companyName: '',
      summary: '',
      keyPointsText: '',
      ceoCommentary: '',
      sourceUrl: '',
      companyLogoUrl: '',
    });
    setEditMetrics([]);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    resetEditState();
  };

  const handleRefreshNews = async () => {
    setIsRefreshingNews(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-news-data', {
        body: { forceRefresh: true },
      });

      if (error) throw error;

      toast({
        title: 'Nyheter uppdaterade',
        description: 'Morgonrapporten har uppdaterats med senaste data.',
      });

      window.dispatchEvent(new CustomEvent('news-refreshed'));
    } catch (error) {
      console.error('Error refreshing news:', error);
      toast({
        title: 'Misslyckades att uppdatera',
        description: 'Ett fel uppstod vid uppdatering av nyheter.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshingNews(false);
    }
  };

  const updateReportMutation = useMutation<GeneratedReport, Error, UpdateReportPayload>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.functions.invoke('update-report-summary', {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || 'Ett fel uppstod vid uppdateringen.');
      }

      const response = data as { success?: boolean; report?: GeneratedReport; error?: string } | null;

      if (!response?.success || !response.report) {
        throw new Error(response?.error || 'Rapporten kunde inte uppdateras.');
      }

      return response.report;
    },
    onSuccess: (updatedReport) => {
      syncReportCache(updatedReport);
      toast({
        title: 'Rapport uppdaterad',
        description: `${updatedReport.companyName} sparades.`,
      });
      closeEditDialog();
      queryClient.invalidateQueries({ queryKey: [DISCOVER_REPORT_SUMMARIES_QUERY_KEY] });
    },
    onError: (error) => {
      toast({
        title: 'Kunde inte spara rapporten',
        description: error.message || 'Ett oväntat fel uppstod.',
        variant: 'destructive',
      });
    },
  });

  const deleteReportMutation = useMutation<string, Error, string>({
    mutationFn: async (reportId) => {
      const { data, error } = await supabase.functions.invoke('delete-report-summary', {
        body: { id: reportId },
      });

      if (error) {
        throw new Error(error.message || 'Ett fel uppstod vid borttagningen.');
      }

      const response = data as { success?: boolean; error?: string } | null;

      if (!response?.success) {
        throw new Error(response?.error || 'Rapporten kunde inte tas bort.');
      }

      return reportId;
    },
    onSuccess: (reportId) => {
      pruneReportCache(reportId);
      toast({
        title: 'Rapport borttagen',
        description: 'Rapportsammanfattningen togs bort från Discover.',
      });
      queryClient.invalidateQueries({ queryKey: [DISCOVER_REPORT_SUMMARIES_QUERY_KEY] });
    },
    onError: (error) => {
      toast({
        title: 'Kunde inte ta bort rapporten',
        description: error.message || 'Ett oväntat fel uppstod.',
        variant: 'destructive',
      });
    },
  });

  const openEditDialog = (report: GeneratedReport) => {
    setEditingReport(report);
    setEditForm({
      reportTitle: report.reportTitle,
      companyName: report.companyName,
      summary: report.summary,
      keyPointsText: report.keyPoints.join('\n'),
      ceoCommentary: report.ceoCommentary ?? '',
      sourceUrl: report.sourceUrl ?? '',
      companyLogoUrl: report.companyLogoUrl ?? '',
    });
    setEditMetrics(
      report.keyMetrics.map((metric) => ({
        label: metric.label,
        value: metric.value,
        trend: metric.trend ?? '',
      })),
    );
    setEditDialogOpen(true);
  };

  const handleMetricChange = (index: number, field: keyof EditableMetric, value: string) => {
    setEditMetrics((previous) =>
      previous.map((metric, idx) => (idx === index ? { ...metric, [field]: value } : metric)),
    );
  };

  const handleRemoveMetric = (index: number) => {
    setEditMetrics((previous) => previous.filter((_, idx) => idx !== index));
  };

  const handleAddMetric = () => {
    setEditMetrics((previous) => [...previous, { label: '', value: '', trend: '' }]);
  };

  const handleUpdateReport = () => {
    if (!editingReport) {
      return;
    }

    const reportTitle = editForm.reportTitle.trim();
    const companyName = editForm.companyName.trim();
    const summary = editForm.summary.trim();
    const ceoCommentary = editForm.ceoCommentary.trim();
    const sourceUrl = editForm.sourceUrl.trim();

    if (!companyName) {
      toast({
        title: 'Bolagsnamn krävs',
        description: 'Ange vilket bolag rapporten avser innan du sparar.',
        variant: 'destructive',
      });
      return;
    }

    if (!reportTitle) {
      toast({
        title: 'Rapporttitel saknas',
        description: 'Lägg till en titel för sammanfattningen.',
        variant: 'destructive',
      });
      return;
    }

    if (!summary) {
      toast({
        title: 'Sammanfattning saknas',
        description: 'Sammanfattningen kan inte vara tom.',
        variant: 'destructive',
      });
      return;
    }

    const keyPoints = editForm.keyPointsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const keyMetrics: GeneratedReportKeyMetric[] = editMetrics
      .map((metric) => ({
        label: metric.label.trim(),
        value: metric.value.trim(),
        trend: metric.trend.trim() ? metric.trend.trim() : undefined,
      }))
      .filter((metric) => metric.label || metric.value || metric.trend);

    const payload: UpdateReportPayload = {
      id: editingReport.id,
      report_title: reportTitle,
      company_name: companyName,
      summary,
      key_points: keyPoints,
      key_metrics: keyMetrics,
      ceo_commentary: ceoCommentary ? ceoCommentary : null,
      source_url: sourceUrl ? sourceUrl : null,
      company_logo_url: editForm.companyLogoUrl.trim() ? editForm.companyLogoUrl.trim() : null,
    };

    updateReportMutation.mutate(payload);
  };

  const handleDeleteReport = (reportId: string) => {
    deleteReportMutation.mutate(reportId);
  };

  const handleLogoUploadClick = () => {
    logoInputRef.current?.click();
  };

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Ogiltig bildtyp',
        description: 'Ladda upp en JPG-, PNG- eller WebP-fil.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Filen är för stor',
        description: 'Maximal filstorlek är 5 MB.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Inloggning krävs',
        description: 'Logga in igen för att kunna ladda upp bilder.',
        variant: 'destructive',
      });
      return;
    }

    setLogoUploading(true);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
      const filePath = `report-logos/${user.id}-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('company-logos').getPublicUrl(filePath);

      setEditForm((previous) => ({ ...previous, companyLogoUrl: publicUrl }));
      toast({
        title: 'Logotyp sparad',
        description: 'Bolagsbilden har laddats upp och kopplats till rapporten.',
      });
    } catch (error) {
      console.error('Logo upload failed', error);
      toast({
        title: 'Kunde inte ladda upp bilden',
        description: 'Försök igen om en stund.',
        variant: 'destructive',
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setEditForm((previous) => ({ ...previous, companyLogoUrl: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <AIGenerationAdminControls onReportGenerated={handleReportGenerated} />
        <Button 
          variant="outline" 
          onClick={handleRefreshNews} 
          disabled={isRefreshingNews}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshingNews ? 'animate-spin' : ''}`} />
          {isRefreshingNews ? 'Uppdaterar...' : 'Uppdatera Morgonrapport'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            AI-rapporter ({reportSummaries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="text-gray-600">Hämtar rapportsammanfattningar...</p>
            </div>
          ) : reportSummaries.length === 0 ? (
            <div className="py-8 text-center">
              <BarChart3 className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="text-gray-600">Inga AI-genererade rapporter har sparats ännu.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rapport</TableHead>
                    <TableHead>Nyckelinsikter</TableHead>
                    <TableHead>Skapad</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportSummaries.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="min-w-[220px] align-top">
                        <div className="font-semibold leading-tight">{report.reportTitle}</div>
                        <div className="text-sm text-muted-foreground">{report.companyName}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {report.sourceType && (
                            <Badge variant="outline" className="capitalize">
                              Källa: {report.sourceType}
                            </Badge>
                          )}
                          {report.sourceDocumentName && (
                            <Badge variant="secondary">{report.sourceDocumentName}</Badge>
                          )}
                          {report.sourceUrl && !report.sourceDocumentName && (
                            <Badge variant="secondary">Extern länk</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="text-sm">{report.keyMetrics.length} nyckeltal</div>
                        <div className="text-sm text-muted-foreground">
                          {report.keyPoints.length} nyckelpunkter
                        </div>
                        {report.ceoCommentary && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            VD-kommentar inkluderad
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(report.createdAt), {
                            addSuffix: true,
                            locale: sv,
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(report)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Redigera
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deleteReportMutation.isPending}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Ta bort
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ta bort rapport</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Är du säker på att du vill ta bort sammanfattningen "{report.reportTitle}"?
                                  Den visas inte längre på Discover efter borttagning.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteReport(report.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Ta bort
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {loadingAnalyses ? (
        <Card>
          <CardContent className="pt-6">
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="text-gray-600">Laddar analyser...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Hantera Analyser ({analyses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyses.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <p className="text-gray-600">Inga analyser hittades.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titel</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Författare</TableHead>
                      <TableHead>Kopplad till</TableHead>
                      <TableHead>Statistik</TableHead>
                      <TableHead>Skapad</TableHead>
                      <TableHead>Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyses.map((analysis) => (
                      <TableRow key={analysis.id}>
                        <TableCell className="max-w-xs font-medium">
                          <div className="truncate" title={analysis.title}>
                            {analysis.title}
                          </div>
                          {analysis.ai_generated && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              AI-genererad
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getAnalysisTypeColor(analysis.analysis_type)}>
                            {getAnalysisTypeLabel(analysis.analysis_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {analysis.profiles?.display_name ||
                                analysis.profiles?.username ||
                                'Okänd användare'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {analysis.stock_cases && (
                            <div className="text-sm text-blue-600">
                              {analysis.stock_cases.company_name}
                            </div>
                          )}
                          {analysis.user_portfolios && (
                            <div className="text-sm text-green-600">
                              {analysis.user_portfolios.portfolio_name}
                            </div>
                          )}
                          {!analysis.stock_cases && !analysis.user_portfolios && (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div>👁️ {analysis.views_count}</div>
                            <div>❤️ {analysis.likes_count}</div>
                            <div>💬 {analysis.comments_count}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {formatDistanceToNow(new Date(analysis.created_at), {
                              addSuffix: true,
                              locale: sv,
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deleteAnalysis.isPending}
                                className="flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Ta bort
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Ta bort analys</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Är du säker på att du vill ta bort analysen "{analysis.title}"?
                                  Denna åtgärd kan inte ångras och kommer även att ta bort alla
                                  kommentarer och likes kopplade till analysen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteAnalysis(analysis.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Ta bort
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeEditDialog();
          }
        }}
      >
        <DialogContent className="max-h-[85vh] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Redigera rapportsammanfattning</DialogTitle>
            <DialogDescription>
              Uppdatera texten, nyckelpunkterna och nyckeltalen innan du sparar ändringarna.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="reportTitle">Rapporttitel</Label>
                <Input
                  id="reportTitle"
                  value={editForm.reportTitle}
                  onChange={(event) =>
                    setEditForm((previous) => ({ ...previous, reportTitle: event.target.value }))
                  }
                  placeholder="Q2-rapporten"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="companyName">Bolag</Label>
                <Input
                  id="companyName"
                  value={editForm.companyName}
                  onChange={(event) =>
                    setEditForm((previous) => ({ ...previous, companyName: event.target.value }))
                  }
                  placeholder="Exempel AB"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="companyLogoUrl">Bolagsbild</Label>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    {editForm.companyLogoUrl && !logoPreviewFailed ? (
                      <img
                        src={editForm.companyLogoUrl}
                        alt={`${editForm.companyName || 'Bolag'} logotyp`}
                        className="h-full w-full object-cover"
                        onError={() => setLogoPreviewFailed(true)}
                      />
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ImageOff className="h-4 w-4" />
                        Ingen bild
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Input
                      id="companyLogoUrl"
                      value={editForm.companyLogoUrl}
                      onChange={(event) =>
                        setEditForm((previous) => ({
                          ...previous,
                          companyLogoUrl: event.target.value,
                        }))
                      }
                      placeholder="https://bild-url"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleLogoUploadClick}
                        disabled={logoUploading}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {logoUploading ? 'Laddar upp...' : 'Ladda upp bild'}
                      </Button>
                      {editForm.companyLogoUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveLogo}
                          disabled={logoUploading}
                        >
                          Ta bort bild
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Visas på rapportkortet i nyhetsflödet. Ladda upp en logotyp eller klistra in en bildlänk.
                    </p>
                  </div>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoFileChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="summary">Sammanfattning</Label>
                <Textarea
                  id="summary"
                  value={editForm.summary}
                  onChange={(event) =>
                    setEditForm((previous) => ({ ...previous, summary: event.target.value }))
                  }
                  rows={5}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="keyPoints">Nyckelpunkter</Label>
                <Textarea
                  id="keyPoints"
                  value={editForm.keyPointsText}
                  onChange={(event) =>
                    setEditForm((previous) => ({ ...previous, keyPointsText: event.target.value }))
                  }
                  placeholder={'En rad per punkt\nExempel: Förbättrat kassaflöde'}
                  rows={4}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Nyckeltal</Label>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddMetric}>
                    <Plus className="mr-2 h-4 w-4" /> Lägg till nyckeltal
                  </Button>
                </div>
                {editMetrics.length === 0 ? (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    Inga nyckeltal är sparade för denna rapport ännu.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {editMetrics.map((metric, index) => (
                      <div key={`metric-${index}`} className="space-y-3 rounded-lg border p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="grid gap-1">
                            <Label htmlFor={`metric-label-${index}`}>Rubrik</Label>
                            <Input
                              id={`metric-label-${index}`}
                              value={metric.label}
                              onChange={(event) =>
                                handleMetricChange(index, 'label', event.target.value)
                              }
                              placeholder="Omsättning Q2"
                            />
                          </div>
                          <div className="grid gap-1">
                            <Label htmlFor={`metric-value-${index}`}>Värde</Label>
                            <Input
                              id={`metric-value-${index}`}
                              value={metric.value}
                              onChange={(event) =>
                                handleMetricChange(index, 'value', event.target.value)
                              }
                              placeholder="123 MSEK"
                            />
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div className="grid gap-1">
                            <Label htmlFor={`metric-trend-${index}`}>Trend / kommentar</Label>
                            <Input
                              id={`metric-trend-${index}`}
                              value={metric.trend}
                              onChange={(event) =>
                                handleMetricChange(index, 'trend', event.target.value)
                              }
                              placeholder="+8 % y/y"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="justify-self-start text-destructive"
                            onClick={() => handleRemoveMetric(index)}
                          >
                            Ta bort
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ceoCommentary">VD:s kommentar</Label>
                <Textarea
                  id="ceoCommentary"
                  value={editForm.ceoCommentary}
                  onChange={(event) =>
                    setEditForm((previous) => ({ ...previous, ceoCommentary: event.target.value }))
                  }
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sourceUrl">Källa (URL)</Label>
                <Input
                  id="sourceUrl"
                  value={editForm.sourceUrl}
                  onChange={(event) =>
                    setEditForm((previous) => ({ ...previous, sourceUrl: event.target.value }))
                  }
                  placeholder="https://"
                />
                {editingReport?.sourceDocumentName && (
                  <p className="text-xs text-muted-foreground">
                    Dokument: {editingReport.sourceDocumentName}
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeEditDialog}
              disabled={updateReportMutation.isPending}
            >
              Avbryt
            </Button>
            <Button
              type="button"
              onClick={handleUpdateReport}
              disabled={updateReportMutation.isPending}
            >
              {updateReportMutation.isPending ? 'Sparar...' : 'Spara ändringar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAnalysesDashboard;