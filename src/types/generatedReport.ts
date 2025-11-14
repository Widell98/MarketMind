export interface GeneratedReportKeyMetric {
  label: string;
  value: string;
  trend?: string;
}

export interface GeneratedReport {
  id: string;
  reportTitle: string;
  companyName: string;
  summary: string;
  keyPoints: string[];
  keyMetrics: GeneratedReportKeyMetric[];
  ceoCommentary?: string;
  createdAt: string;
  sourceUrl?: string | null;
  sourceType?: 'text' | 'url' | 'document';
  sourceDocumentName?: string | null;
}
