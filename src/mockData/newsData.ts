
export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  category: string;
  url: string;
  publishedAt: string;
  relatedSymbols?: string[];
}

export const newsData: NewsItem[] = [
  {
    id: '5',
    headline: "European Markets Rally on Economic Data",
    summary: "European stocks climbed to six-month highs after better-than-expected manufacturing data suggested the region's economy is gaining momentum.",
    source: "Reuters",
    category: "global",
    url: "#",
    publishedAt: "2025-05-20T11:20:00Z",
    relatedSymbols: ["EZU", "VGK"]
  }
];
