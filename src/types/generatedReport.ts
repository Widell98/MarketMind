export interface GeneratedReportKeyMetric {
  label: string;
  value: string;
  trend?: string;
  beatPercent?: number | null;
}

export interface GeneratedReport {
  id: string;
  reportTitle: string;
  companyName: string;
  companyLogoUrl?: string | null;
  summary: string;
  keyPoints: string[];
  keyMetrics: GeneratedReportKeyMetric[];
  ceoCommentary?: string;
  createdAt: string;
  sourceUrl?: string | null;
  sourceType?: 'text' | 'url' | 'document';
  sourceDocumentName?: string | null;
  sourceDocumentId?: string | null;
  isFeatured: boolean; // Nytt fält
  // Optional fields for extracted earnings data (for future use if stored directly)
  epsBeatStatus?: 'beat' | 'miss' | 'in_line' | null;
  epsBeatPercent?: number | null;
  revenueBeatStatus?: 'beat' | 'miss' | 'in_line' | null;
  revenueBeatPercent?: number | null;
  guidanceStatus?: 'raised' | 'lowered' | 'maintained' | null;
}
