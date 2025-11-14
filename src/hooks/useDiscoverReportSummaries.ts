import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { GeneratedReport, GeneratedReportKeyMetric } from '@/types/generatedReport';
import { isSupabaseFetchError } from '@/utils/supabaseError';

export const DISCOVER_REPORT_SUMMARIES_QUERY_KEY = 'discover-report-summaries';

type DiscoverReportSummaryRow = Database['public']['Tables']['discover_report_summaries']['Row'];

const parseKeyPoints = (value: DiscoverReportSummaryRow['key_points']): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((point) => (typeof point === 'string' ? point.trim() : ''))
      .filter((point): point is string => point.length > 0);
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/\n|•|-/)
      .map((item) => item.replace(/^\s*[-•]\s*/, '').trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

const parseKeyMetrics = (value: DiscoverReportSummaryRow['key_metrics']): GeneratedReportKeyMetric[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const metric = entry as Record<string, unknown>;
      const label = typeof metric.label === 'string'
        ? metric.label.trim()
        : typeof metric.metric === 'string'
          ? metric.metric.trim()
          : '';
      const metricValue = typeof metric.value === 'string' ? metric.value.trim() : '';
      const trend = typeof metric.trend === 'string'
        ? metric.trend.trim()
        : typeof metric.description === 'string'
          ? metric.description.trim()
          : '';

      if (!label && !metricValue && !trend) {
        return null;
      }

      return {
        label: label || 'Nyckeltal',
        value: metricValue || (label ? '' : 'Saknas'),
        trend: trend || undefined,
      } satisfies GeneratedReportKeyMetric;
    })
    .filter((metric): metric is GeneratedReportKeyMetric => !!metric);
};

const mapRowToGeneratedReport = (row: DiscoverReportSummaryRow): GeneratedReport => ({
  id: row.id,
  companyName: row.company_name,
  reportTitle: row.report_title,
  summary: row.summary,
  keyPoints: parseKeyPoints(row.key_points),
  keyMetrics: parseKeyMetrics(row.key_metrics),
  ceoCommentary: row.ceo_commentary ?? undefined,
  createdAt: row.created_at,
  sourceUrl: row.source_url,
  sourceType: (row.source_type as GeneratedReport['sourceType']) ?? undefined,
  sourceDocumentName: row.source_document_name,
  sourceDocumentId: row.source_document_id,
});

export const useDiscoverReportSummaries = (limit = 12) => {
  const query = useQuery({
    queryKey: [DISCOVER_REPORT_SUMMARIES_QUERY_KEY, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discover_report_summaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        if (isSupabaseFetchError(error)) {
          console.warn('Network error fetching discover report summaries:', error);
          return [] as GeneratedReport[];
        }

        console.error('Error fetching discover report summaries:', error);
        throw error;
      }

      return (data ?? []).map(mapRowToGeneratedReport);
    },
  });

  return {
    reports: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

