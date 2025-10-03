import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type MarketSnapshot = Tables<'market_snapshots'>;

type ParsedIndex = {
  name: string;
  symbol: string;
  changePercent: number | null;
  change: number | null;
  level: number | null;
};

type ParsedSector = {
  sector: string;
  changePercent: number | null;
};

type MarketPulseWidgetProps = {
  data: MarketSnapshot | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const sanitized = value.replace(/[^0-9+\-.]/g, '');
    if (!sanitized) {
      return null;
    }

    const parsed = Number.parseFloat(sanitized);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

const parseIndices = (value: MarketSnapshot['indices']): ParsedIndex[] => {
  if (!value || !Array.isArray(value)) {
    return [];
  }

  return (value as Record<string, unknown>[])?.map((entry) => {
    const name = typeof entry.name === 'string' ? entry.name : 'Index';
    const symbol = typeof entry.symbol === 'string' ? entry.symbol : name;
    return {
      name,
      symbol,
      changePercent: toNumber(entry.change_percent),
      change: toNumber(entry.change),
      level: toNumber(entry.level),
    };
  }).filter(Boolean);
};

const parseSectors = (value: MarketSnapshot['sector_heatmap']): ParsedSector[] => {
  if (!value || !Array.isArray(value)) {
    return [];
  }

  return (value as Record<string, unknown>[])?.map((entry) => ({
    sector: typeof entry.sector === 'string' ? entry.sector : 'Sektor',
    changePercent: toNumber(entry.change_percent),
  })).filter(Boolean);
};

const parseHighlights = (value: MarketSnapshot['highlights']): string[] => {
  if (!value || !Array.isArray(value)) {
    return [];
  }

  return (value as unknown[]).filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
};

const formatUpdatedTime = (timestamp: string | null | undefined) => {
  if (!timestamp) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
};

const getPerformanceColor = (value: number | null) => {
  if (value === null || value === undefined) {
    return 'text-muted-foreground';
  }

  return value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
};

const getHeatmapClasses = (value: number | null) => {
  if (value === null || value === undefined) {
    return 'bg-muted text-muted-foreground';
  }

  return value >= 0
    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300';
};

const MarketPulseWidget: React.FC<MarketPulseWidgetProps> = ({ data, loading, refreshing, error, onRefresh }) => {
  const indices = data ? parseIndices(data.indices) : [];
  const sectors = data ? parseSectors(data.sector_heatmap) : [];
  const highlights = data ? parseHighlights(data.highlights) : [];

  return (
    <Card className="h-full">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">Marknadspulsen</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            disabled={loading || refreshing}
            onClick={() => {
              void onRefresh();
            }}
            className="h-8 w-8"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription>Snabbt sentiment och rörelser från dagens marknad.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !data ? (
          <div className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : data ? (
          <div className="space-y-4">
            <Badge variant="outline" className="w-fit text-xs font-medium uppercase tracking-wide">
              {data.sentiment_label}
            </Badge>
            <p className="text-sm leading-relaxed text-muted-foreground">{data.narrative}</p>
            {highlights.length > 0 && (
              <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                {highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            )}
            {indices.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Ledande index</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {indices.map((index) => {
                    const changeColor = getPerformanceColor(index.changePercent);
                    return (
                      <div key={index.symbol} className="rounded-lg border border-border/60 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{index.name}</p>
                            <p className="text-xs text-muted-foreground">{index.symbol}</p>
                          </div>
                          {index.changePercent !== null && (
                            index.changePercent >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-rose-500" />
                            )
                          )}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {index.level !== null ? index.level.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                        </div>
                        <div className={`text-xs font-medium ${changeColor}`}>
                          {index.change !== null ? index.change.toFixed(2) : '—'} ({index.changePercent !== null ? index.changePercent.toFixed(2) : '—'}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {sectors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Sektor-heatmap</h4>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {sectors.map((sector) => (
                    <div
                      key={sector.sector}
                      className={`rounded-lg px-3 py-2 text-xs font-medium ${getHeatmapClasses(sector.changePercent)}`}
                    >
                      <div>{sector.sector}</div>
                      <div className="text-[11px] opacity-80">
                        {sector.changePercent !== null ? `${sector.changePercent.toFixed(2)}%` : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Ingen marknadspuls tillgänglig. Försök igen senare.</p>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        {data?.updated_at && (
          <span className="text-xs text-muted-foreground">Uppdaterad {formatUpdatedTime(data.updated_at)}</span>
        )}
      </CardFooter>
    </Card>
  );
};

export default MarketPulseWidget;
