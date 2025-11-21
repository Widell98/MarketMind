import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, TrendingUp, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StockCase } from '@/types/stockCase';

interface StockCaseSpotlightProps {
  cases: StockCase[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onOpenDetails?: (id: string) => void;
}

const formatPerformance = (stockCase: StockCase): string => {
  const { entry_price: entryPrice, current_price: currentPrice, performance_percentage: performancePercentage } = stockCase;

  if (typeof entryPrice === 'number' && typeof currentPrice === 'number') {
    const performance = ((currentPrice - entryPrice) / entryPrice) * 100;
    return `${performance > 0 ? '+' : ''}${performance.toFixed(1).replace('.', ',')}%`;
  }

  if (typeof performancePercentage === 'number') {
    return `${performancePercentage > 0 ? '+' : ''}${performancePercentage.toFixed(1).replace('.', ',')}%`;
  }

  return '—';
};

const getPerformanceTone = (stockCase: StockCase): string => {
  const { entry_price: entryPrice, current_price: currentPrice, performance_percentage: performancePercentage } = stockCase;
  const derivedPerformance =
    typeof entryPrice === 'number' && typeof currentPrice === 'number'
      ? ((currentPrice - entryPrice) / entryPrice) * 100
      : performancePercentage ?? 0;

  if (!Number.isFinite(derivedPerformance)) {
    return 'bg-muted text-muted-foreground';
  }

  if (derivedPerformance > 0) {
    return 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300';
  }

  if (derivedPerformance < 0) {
    return 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300';
  }

  return 'bg-muted text-muted-foreground';
};

const buildSummary = (stockCase: StockCase): string => {
  const normalizedDescription = (stockCase.description || '').trim();
  const normalizedLong = (stockCase.long_description || '').trim();

  if (normalizedDescription) {
    return normalizedDescription;
  }

  if (normalizedLong) {
    const MAX_LENGTH = 200;
    if (normalizedLong.length <= MAX_LENGTH) {
      return normalizedLong;
    }

    return `${normalizedLong.slice(0, MAX_LENGTH).trim()}...`;
  }

  return 'Inget sammandrag tillgängligt just nu.';
};

const StockCaseSpotlight = ({ cases, currentIndex, onIndexChange, onOpenDetails }: StockCaseSpotlightProps) => {
  const pointerStartX = useRef<number | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  const safeIndex = useMemo(() => {
    if (!cases.length) return 0;
    return Math.min(Math.max(currentIndex, 0), cases.length - 1);
  }, [cases.length, currentIndex]);

  const selectedCase = cases[safeIndex];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('discoverSpotlightSwipeHintDismissed');
    setShowSwipeHint(stored !== 'true');
  }, []);

  useEffect(() => {
    if (safeIndex !== currentIndex) {
      onIndexChange(safeIndex);
    }
  }, [currentIndex, onIndexChange, safeIndex]);

  const dismissHint = () => {
    if (!showSwipeHint) return;
    setShowSwipeHint(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('discoverSpotlightSwipeHintDismissed', 'true');
    }
  };

  const handlePrevious = () => {
    if (!cases.length) return;
    dismissHint();
    const nextIndex = currentIndex === 0 ? cases.length - 1 : currentIndex - 1;
    onIndexChange(nextIndex);
  };

  const handleNext = () => {
    if (!cases.length) return;
    dismissHint();
    const nextIndex = currentIndex === cases.length - 1 ? 0 : currentIndex + 1;
    onIndexChange(nextIndex);
  };

  const handleJumpToIndex = (index: number) => {
    if (!cases.length) return;
    dismissHint();
    onIndexChange(index);
  };

  const handlePointerDown = (clientX: number) => {
    dismissHint();
    pointerStartX.current = clientX;
  };

  const handlePointerUp = (clientX: number) => {
    if (pointerStartX.current === null) return;
    const deltaX = clientX - pointerStartX.current;
    const SWIPE_THRESHOLD = 40;

    if (deltaX > SWIPE_THRESHOLD) {
      handlePrevious();
    } else if (deltaX < -SWIPE_THRESHOLD) {
      handleNext();
    }

    pointerStartX.current = null;
  };

  if (!cases.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 bg-background/60 px-6 py-12 text-center shadow-inner sm:px-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="text-lg font-semibold text-foreground">Inga case matchar dina filter ännu.</p>
        <p className="mt-2 text-sm text-muted-foreground">Justera sökningen eller prova att visa alla sektorer.</p>
      </div>
    );
  }

  return (
    <section className="relative space-y-4" aria-label="Utvalt aktiecase" id="discover-spotlight">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-4 w-4" />
            Spotlight
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Utforska case med swipe</h2>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Svep eller använd pilarna för att växla mellan aktuella case. Scrolla nedanför för att se alla kort.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label="Föregående case"
            onClick={handlePrevious}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground" aria-live="polite">
            {safeIndex + 1} / {cases.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label="Nästa case"
            onClick={handleNext}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-background shadow-sm"
        onPointerDown={(event) => handlePointerDown(event.clientX)}
        onPointerUp={(event) => handlePointerUp(event.clientX)}
        onTouchStart={(event) => handlePointerDown(event.touches[0].clientX)}
        onTouchEnd={(event) => handlePointerUp(event.changedTouches[0].clientX)}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            dismissHint();
            handlePrevious();
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            dismissHint();
            handleNext();
          }
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" aria-hidden />

        <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 sm:hidden">
          <Button
            variant="secondary"
            size="icon"
            className="pointer-events-auto rounded-full shadow-md backdrop-blur"
            aria-label="Föregående case"
            onClick={handlePrevious}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 sm:hidden">
          <Button
            variant="secondary"
            size="icon"
            className="pointer-events-auto rounded-full shadow-md backdrop-blur"
            aria-label="Nästa case"
            onClick={handleNext}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {showSwipeHint && (
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center p-3 sm:p-4">
            <div className="pointer-events-auto inline-flex max-w-sm items-center gap-3 rounded-2xl bg-background/95 px-4 py-3 text-sm shadow-lg ring-1 ring-border/70">
              <span className="font-medium text-foreground">Svep för att utforska</span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8 rounded-full"
                aria-label="Stäng swipe-hjälp"
                onClick={dismissHint}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
              <Badge variant="secondary" className={`px-2.5 py-1 ${getPerformanceTone(selectedCase)}`}>
                <TrendingUp className="mr-1 h-3 w-3" />
                {formatPerformance(selectedCase)}
              </Badge>
              {selectedCase.sector && (
                <Badge variant="outline" className="px-2.5 py-1">
                  {selectedCase.sector}
                </Badge>
              )}
              {selectedCase.case_categories?.name && (
                <Badge variant="outline" className="px-2.5 py-1">
                  {selectedCase.case_categories.name}
                </Badge>
              )}
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                {selectedCase.title}
              </CardTitle>
              {selectedCase.company_name && (
                <p className="text-base font-medium text-muted-foreground sm:text-lg">{selectedCase.company_name}</p>
              )}
            </div>
          </div>

          {onOpenDetails && (
            <Button
              variant="ghost"
              className="group rounded-full border border-transparent px-3 py-2 hover:border-border"
              onClick={() => onOpenDetails(selectedCase.id)}
            >
              <span className="text-sm font-medium">Öppna detaljvy</span>
              <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
            </Button>
          )}
        </CardHeader>

        <CardContent className="grid gap-6 p-6 sm:grid-cols-[1fr,0.6fr] sm:items-center">
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {buildSummary(selectedCase)}
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 sm:text-base">
              {selectedCase.entry_price !== undefined && selectedCase.entry_price !== null && (
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Ingång</p>
                  <p className="text-lg font-semibold text-foreground">{selectedCase.entry_price}</p>
                </div>
              )}
              {selectedCase.target_price !== undefined && selectedCase.target_price !== null && (
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Mål</p>
                  <p className="text-lg font-semibold text-foreground">{selectedCase.target_price}</p>
                </div>
              )}
              {selectedCase.stop_loss !== undefined && selectedCase.stop_loss !== null && (
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Stop-loss</p>
                  <p className="text-lg font-semibold text-foreground">{selectedCase.stop_loss}</p>
                </div>
              )}
              {selectedCase.timeframe && (
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Tidshorisont</p>
                  <p className="text-lg font-semibold text-foreground">{selectedCase.timeframe}</p>
                </div>
              )}
              {selectedCase.currency && (
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Valuta</p>
                  <p className="text-lg font-semibold text-foreground">{selectedCase.currency}</p>
                </div>
              )}
              {selectedCase.likes_count !== undefined && selectedCase.likes_count !== null && (
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Gillanden</p>
                  <p className="text-lg font-semibold text-foreground">{selectedCase.likes_count}</p>
                </div>
              )}
            </div>
          </div>

        {selectedCase.image_url ? (
          <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted shadow-sm">
            <img
              src={selectedCase.image_url}
              alt={selectedCase.company_name ? `${selectedCase.company_name} illustration` : 'Aktiecase'}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" aria-hidden />
          </div>
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/70 text-muted-foreground shadow-inner">
            <p className="text-sm">Ingen bild tillgänglig</p>
          </div>
        )}
      </CardContent>
    </Card>

      <div className="flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Pagination för spotlightcase">
        {cases.map((stockCase, index) => {
          const isActive = index === safeIndex;
          return (
            <Button
              key={stockCase.id}
              variant={isActive ? 'default' : 'ghost'}
              size="icon"
              className={`h-6 w-6 rounded-full p-0 transition ${isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
              onClick={() => handleJumpToIndex(index)}
              aria-label={`Gå till case ${index + 1}: ${stockCase.title}`}
              aria-pressed={isActive}
              role="tab"
            >
              <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-primary-foreground' : 'bg-muted-foreground/50'}`} aria-hidden />
            </Button>
          );
        })}
      </div>
    </section>
  );
};

export default StockCaseSpotlight;
