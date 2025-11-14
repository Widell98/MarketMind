export interface GeneratedReport {
  id: string;
  reportTitle: string;
  companyName: string;
  summary: string;
  keyPoints: string[];
  createdAt: string;
  sourceUrl?: string | null;
  sourceType?: 'text' | 'url';
}
