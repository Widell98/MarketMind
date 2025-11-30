import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowUpRight,
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Clock,
  ExternalLink,
  Filter,
  RefreshCw
} from 'lucide-react';

import Layout from '@/components/Layout';
import ReportHighlightCard from '@/components/ReportHighlightCard';
import NewsModal from '@/components/ui/NewsModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDiscoverReportSummaries } from '@/hooks/useDiscoverReportSummaries';
import { useNewsData } from '@/hooks/useNewsData';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

const formatCategoryLabel = (category?: string) => {
  if (!category) return 'Marknad';
  const normalized = category.toLowerCase().trim();
  switch (normalized) {
    case 'macro':
      return 'Makro';
    case 'tech':
    case 'technology':
      return 'Teknik';
    case 'earnings':
    case 'earnings report':
      return 'Rapporter';
    case 'commodities':
    case 'commodity':
      return 'Råvaror';
    case 'sweden':
    case 'swedish':
      return 'Sverige';
    case 'global':
    case 'globalt':
      return 'Globalt';
    default:
      // Capitalize first letter of each word
      return normalized
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }
};

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
  url: string;
}

const DiscoverNews = () => {
  const navigate = useNavigate();
  const { reports } = useDiscoverReportSummaries(24);
  const { newsData, morningBrief, loading: newsLoading, error: newsError, refetchForce } = useNewsData();
  
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const reportHighlights = useMemo(() => reports.slice(0, 3), [reports]);

  const filteredNews = useMemo(() => {
    console.log('[DiscoverNews] Filtering news:', {
      newsDataLength: newsData?.length || 0,
      selectedCategory,
      newsDataSample: newsData?.slice(0, 2).map(n => ({ headline: n.headline, category: n.category })),
    });
    
    if (!newsData || newsData.length === 0) {
      console.log('[DiscoverNews] No news data available');
      return [];
    }
    
    if (!selectedCategory) {
      console.log('[DiscoverNews] No category selected, returning all news');
      return newsData;
    }
    
    const filtered = newsData.filter(item => {
      const itemCategory = (item.category || 'global').toLowerCase().trim();
      const selected = selectedCategory.toLowerCase().trim();
      const matches = itemCategory === selected;
      if (!matches) {
        console.log('[DiscoverNews] Item filtered out:', { itemCategory, selected, headline: item.headline });
      }
      return matches;
    });
    
    console.log('[DiscoverNews] Filtered news count:', filtered.length);
    return filtered;
  }, [newsData, selectedCategory]);
  
  const heroNews = useMemo(() => {
    if (!newsData || newsData.length === 0) {
      console.log('[DiscoverNews] No hero news - newsData is empty');
      return null;
    }
    console.log('[DiscoverNews] Hero news:', { headline: newsData[0].headline, category: newsData[0].category });
    return newsData[0];
  }, [newsData]);

  const availableCategories = useMemo(() => {
    if (!newsData || newsData.length === 0) {
      console.log('[DiscoverNews] No categories - newsData is empty');
      return [];
    }
    
    const categories = new Set(
      newsData
        .map(item => {
          const cat = (item.category || 'global').toLowerCase().trim();
          return cat;
        })
        .filter(Boolean)
    );
    
    const categoryArray = Array.from(categories).sort();
    console.log('[DiscoverNews] Available categories:', categoryArray);
    return categoryArray;
  }, [newsData]);

  const formatPublishedLabel = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const todayDate = new Date().toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isWeekend = () => {
    const today = new Date();
    const day = today.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  const isWeeklySummary = isWeekend() || morningBrief?.headline?.toLowerCase().includes('veckosammanfattning');

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="h-8 w-8 text-emerald-500" />;
      case 'bearish': return <TrendingDown className="h-8 w-8 text-rose-500" />;
      default: return <Minus className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getSentimentLabel = (sentiment?: string) => {
    switch (sentiment) {
      case 'bullish': return 'Positivt';
      case 'bearish': return 'Negativt';
      default: return 'Neutralt';
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'bullish': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
      case 'bearish': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <Layout>
      <div className="w-full pb-20 bg-background/50 min-h-screen">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          
          <Tabs defaultValue="news" className="space-y-8">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-primary/80" />
                  {todayDate}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">                  
                </h1>
              </div>

              <TabsList className="bg-muted/60 p-1 rounded-full border border-border/50 self-start md:self-end">
                <TabsTrigger 
                  value="news" 
                  className="rounded-full px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Nyheter
                </TabsTrigger>
                <TabsTrigger 
                  value="reports" 
                  className="rounded-full px-6 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  Rapporter
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="news" className="space-y-8 animate-fade-in mt-0">
              
              {/* Loading State */}
              {newsLoading && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Laddar nyheter...</p>
                </div>
              )}

              {/* Error State */}
              {newsError && (
                <div className="text-center py-12">
                  <p className="text-destructive">Fel vid laddning av nyheter: {newsError}</p>
                </div>
              )}

              {/* Header Section */}
              {!newsLoading && !newsError && (
              <>
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2">
                      {isWeeklySummary ? 'Veckosammanfattning' : 'Dagens Nyheter'}
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {todayDate}
                      {isWeeklySummary && <span className="text-xs">• Veckans översikt</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => refetchForce()}
                      disabled={newsLoading}
                    >
                      <RefreshCw className={cn("w-4 h-4 mr-2", newsLoading && "animate-spin")} />
                      Uppdatera
                    </Button>
                    <div className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-full border shadow-sm",
                      getSentimentColor(morningBrief?.sentiment)
                    )}>
                      {getSentimentIcon(morningBrief?.sentiment)}
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide opacity-70">Marknadsklimat</div>
                        <div className="text-sm font-bold">{getSentimentLabel(morningBrief?.sentiment)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Filters - Only show on weekdays */}
                {!isWeeklySummary && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Button
                      variant={selectedCategory === null ? "default" : "outline"}
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        console.log('[DiscoverNews] Clearing category filter');
                        setSelectedCategory(null);
                      }}
                    >
                      Alla
                    </Button>
                    {availableCategories.length > 0 ? (
                      availableCategories.map((cat) => (
                        <Button
                          key={cat}
                          variant={selectedCategory === cat ? "default" : "outline"}
                          size="sm"
                          className="rounded-full"
                          onClick={() => {
                            console.log('[DiscoverNews] Setting category filter:', cat);
                            setSelectedCategory(cat);
                          }}
                        >
                          {formatCategoryLabel(cat)}
                        </Button>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Inga kategorier tillgängliga</span>
                    )}
                  </div>
                )}
              </div>

              {/* Morning Brief Hero Section */}
              {morningBrief && (
                <Card className="rounded-[2rem] border-border/50 shadow-lg overflow-hidden group hover:shadow-xl transition-all">
                  <div className="relative bg-gradient-to-br from-primary/5 via-transparent to-transparent p-8 md:p-12">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                          {isWeeklySummary ? 'Veckosammanfattning' : 'Morgonrapport'}
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
                          {todayDate.split(' ')[0]}
                        </Badge>
                      </div>
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight mb-4 group-hover:text-primary transition-colors">
                      {morningBrief.headline}
                    </h2>
                    
                    <div className={`${isWeeklySummary ? 'prose prose-slate dark:prose-invert max-w-none' : ''} mb-6`}>
                      {isWeeklySummary ? (
                        <div className="text-base md:text-lg text-muted-foreground leading-relaxed space-y-4 max-w-5xl">
                          {morningBrief.overview.split('\n\n').map((paragraph, idx) => (
                            paragraph.trim() && (
                              <p key={idx} className="mb-4">
                                {paragraph.trim()}
                              </p>
                            )
                          ))}
                        </div>
                      ) : (
                        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl">
                          {morningBrief.overview}
                        </p>
                      )}
                    </div>
                    
                    {morningBrief.keyHighlights && morningBrief.keyHighlights.length > 0 && (
                      <div className="mt-6 space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          {isWeeklySummary ? 'Veckans Höjdpunkter' : 'Snabbkollen'}
                        </h3>
                        <ul className="space-y-2">
                          {morningBrief.keyHighlights.slice(0, isWeeklySummary ? 7 : 3).map((highlight, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-foreground/90">
                              <span className="text-primary mt-1">•</span>
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Hero News Section - Only show on weekdays */}
              {!isWeeklySummary && heroNews && (
                <Card className="rounded-[2rem] border-border/50 shadow-lg overflow-hidden group hover:shadow-xl transition-all">
                  <div className="relative bg-gradient-to-br from-primary/5 via-transparent to-transparent p-8 md:p-12">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                          Huvudnyhet
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
                          {formatCategoryLabel(heroNews.category)}
                        </Badge>
                      </div>
                      <a
                        href={heroNews.url && heroNews.url !== '#' ? heroNews.url : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {heroNews.source}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight mb-4 group-hover:text-primary transition-colors">
                      {heroNews.headline}
                    </h2>
                    
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6 max-w-4xl">
                      {heroNews.summary}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      <Button
                        className="rounded-full"
                        onClick={() => setSelectedNews(heroNews)}
                      >
                        Läs mer
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {formatPublishedLabel(heroNews.publishedAt)}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* News Grid - Only show on weekdays */}
              {!isWeeklySummary && (() => {
                console.log('[DiscoverNews] News data state:', {
                  newsDataLength: newsData?.length || 0,
                  filteredNewsLength: filteredNews.length,
                  selectedCategory,
                  newsDataSample: newsData?.slice(0, 2),
                });
                
                if (filteredNews.length > 0) {
                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold tracking-tight">
                          {selectedCategory ? formatCategoryLabel(selectedCategory) : 'Alla Nyheter'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {filteredNews.length} {filteredNews.length === 1 ? 'artikel' : 'artiklar'}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNews.map((item) => (
                          <Card
                            key={item.id}
                            className="rounded-[1.5rem] border-border/50 bg-card hover:bg-muted/30 hover:border-border transition-all hover:shadow-md cursor-pointer group"
                            onClick={() => setSelectedNews(item)}
                          >
                            <CardContent className="p-6 flex flex-col h-full gap-4">
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="rounded-lg px-2 py-1 bg-muted font-medium text-xs">
                                  {formatCategoryLabel(item.category)}
                                </Badge>
                                <a
                                  href={item.url && item.url !== '#' ? item.url : '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {item.source}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              
                              <h4 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2">
                                {item.headline}
                              </h4>
                              
                              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1">
                                {item.summary}
                              </p>
                              
                              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {formatPublishedLabel(item.publishedAt)}
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                }
                
                // Show more helpful message
                if (newsData && newsData.length === 0) {
                  return (
                    <div className="text-center py-12 space-y-4">
                      <p className="text-muted-foreground">Inga nyheter tillgängliga just nu.</p>
                      <p className="text-sm text-muted-foreground">
                        Backend returnerade {newsData.length} nyheter. Klicka på "Uppdatera" för att hämta nya nyheter.
                      </p>
                    </div>
                  );
                }
                
                if (selectedCategory && filteredNews.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        Inga nyheter tillgängliga för kategorin "{formatCategoryLabel(selectedCategory)}".
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 rounded-full"
                        onClick={() => setSelectedCategory(null)}
                      >
                        Visa alla kategorier
                      </Button>
                    </div>
                  );
                }
                
                return (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Inga nyheter tillgängliga.</p>
                  </div>
                );
              })()}

              {/* Footer Note */}
              <div className="pt-8 border-t border-border/50 text-center">
                <p className="text-sm text-muted-foreground">
                  Alla nyheter från externa källor. Sammanfattningar genererade av AI.
                </p>
              </div>
              </>
              )}

            </TabsContent>

            <TabsContent value="reports" className="space-y-8 animate-fade-in mt-0">
               <div className="rounded-[2.5rem] bg-gradient-to-br from-primary/5 via-transparent to-transparent border border-border/50 p-8 sm:p-12 text-center space-y-4">
                 <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">AI-Rapporter</h2>
                 <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Marknadens rapporter, analyserade och sammanfattade av AI på sekunder.
                 </p>
               </div>

               <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 {reportHighlights.map((report) => (
                   <ReportHighlightCard key={report.id} report={report} />
                 ))}
               </div>

               <div className="flex justify-center pt-8">
                 <Button 
                    className="rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105"
                    onClick={() => navigate('/discover')}
                  >
                   Utforska alla rapporter <ArrowRight className="ml-2 w-5 h-5" />
                 </Button>
               </div>
            </TabsContent>
          </Tabs>
        </div>
        <NewsModal 
          news={selectedNews} 
          isOpen={!!selectedNews} 
          onClose={() => setSelectedNews(null)} 
        />
      </div>
    </Layout>
  );
};

export default DiscoverNews;
