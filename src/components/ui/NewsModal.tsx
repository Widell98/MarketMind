import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { Separator } from './separator';
import { ExternalLink, Calendar, User, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
  url: string;
}

interface NewsModalProps {
  news: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const NewsModal: React.FC<NewsModalProps> = ({ news, isOpen, onClose }) => {
  if (!news) return null;

  const formatPublishedTime = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Datum okänt';
    return new Intl.DateTimeFormat('sv-SE', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(date);
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'macro': return 'default';
      case 'tech': return 'secondary';
      case 'commodities': return 'outline';
      case 'earnings': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-2xl p-0 gap-0 border-0 shadow-2xl">
        
        {/* Header Image Area (Placeholder gradient) */}
        <div className="h-32 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 w-full relative">
          <div className="absolute top-4 left-6">
             <Badge variant={getCategoryBadgeVariant(news.category)} className="capitalize px-3 py-1 text-xs font-semibold rounded-full shadow-sm">
              {news.category || 'Nyheter'}
            </Badge>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-8 -mt-12 relative z-10">
          <div className="bg-background rounded-2xl border border-border/50 shadow-sm p-6 mb-6">
             <DialogHeader className="space-y-4 text-left">
              <DialogTitle className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-foreground">
                {news.headline}
              </DialogTitle>
              
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {news.source}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatPublishedTime(news.publishedAt)}
                </div>
              </div>
            </DialogHeader>
          </div>
          
          <div className="space-y-6">
            {/* Source Attribution */}
            <div className="mb-6 p-4 bg-muted/30 rounded-xl border border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Newspaper className="w-4 h-4" />
                <span className="font-medium">Källa:</span>
                <a
                  href={news.url && news.url !== '#' ? news.url : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {news.source}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground italic">
                Sammanfattning genererad av AI baserat på artikel från {news.source}. 
                Originalartikeln kan läsas via länken ovan.
              </p>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-lg leading-relaxed font-medium text-foreground/90">
                {news.summary}
              </p>
            </div>
            
            <Separator />
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                className="w-full sm:w-auto rounded-full font-semibold"
                asChild
              >
                <a 
                  href={news.url && news.url !== '#' ? news.url : `https://www.google.com/search?q=${encodeURIComponent(news.headline + ' ' + news.source)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Läs hela artikeln på {news.source} <ExternalLink className="ml-2 w-4 h-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto rounded-full"
                onClick={onClose}
              >
                Stäng
              </Button>
              <Button
                variant="secondary"
                className="w-full sm:w-auto rounded-full"
                asChild
              >
                <Link to={`/ai-chatt?message=${encodeURIComponent(`Kan vi diskutera nyheten ”${news.headline}”?`)}`}>
                  Diskutera med AI
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsModal;
