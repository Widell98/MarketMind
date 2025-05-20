
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
    id: '1',
    headline: "Fed's Powell Signals Potential Rate Cuts",
    summary: "Federal Reserve Chair Jerome Powell indicated the central bank is ready to cut interest rates if economic conditions warrant, citing cooling inflation data.",
    source: "Financial Times",
    category: "macro",
    url: "#",
    publishedAt: "2025-05-20T08:30:00Z",
    relatedSymbols: ["SPY", "QQQ", "DIA"]
  },
  {
    id: '2',
    headline: "Apple Unveils New AI Features for iPhone",
    summary: "At its annual developer conference, Apple showcased several new AI-powered features coming to iPhones, including enhanced Siri capabilities and on-device ML processing.",
    source: "TechCrunch",
    category: "tech",
    url: "#",
    publishedAt: "2025-05-20T10:15:00Z",
    relatedSymbols: ["AAPL"]
  },
  {
    id: '3',
    headline: "Oil Prices Surge on Supply Concerns",
    summary: "Crude oil prices jumped over 3% after reports of production disruptions in major oil-producing regions, raising concerns about global supply constraints.",
    source: "Bloomberg",
    category: "commodities",
    url: "#",
    publishedAt: "2025-05-20T09:45:00Z",
    relatedSymbols: ["USO", "XLE"]
  },
  {
    id: '4',
    headline: "Nvidia Reports Record Quarterly Revenue",
    summary: "Semiconductor giant Nvidia beat analyst estimates with record quarterly revenue driven by continued strong demand for AI chips and data center solutions.",
    source: "CNBC",
    category: "earnings",
    url: "#",
    publishedAt: "2025-05-19T16:30:00Z",
    relatedSymbols: ["NVDA"]
  },
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
