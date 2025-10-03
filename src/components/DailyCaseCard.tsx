import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Loader2, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat('sv-SE', {
      dateStyle: 'long',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
};

const formatTime = (dateString: string | null | undefined) => {
  if (!dateString) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
};

type DailyCase = Tables<'daily_cases'>;

type DailyCaseCardProps = {
  data: DailyCase | null;
  loading: boolean;
  refreshing: boolean;
  voting: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onVote?: (direction: 'up' | 'down') => Promise<void>;
  canVote: boolean;
};

const DailyCaseCard: React.FC<DailyCaseCardProps> = ({
  data,
  loading,
  refreshing,
  voting,
  error,
  onRefresh,
  onVote,
  canVote,
}) => {
  const isDisabled = !canVote || !onVote;
  const thesis = (data?.thesis as Record<string, string | undefined> | null) ?? null;
  const voteDisabled = voting || isDisabled;

  const handleVote = async (direction: 'up' | 'down') => {
    if (!onVote || isDisabled) {
      return;
    }

    try {
      await onVote(direction);
    } catch (voteError) {
      console.error('Röstningen misslyckades:', voteError);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">Dagens case</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              void onRefresh();
            }}
            disabled={loading || refreshing}
            className="h-8 w-8"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription>
          Ett unikt investeringscase som uppdateras varje morgon.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !data ? (
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="uppercase tracking-wide">
                {data.ticker}
              </Badge>
              <span className="text-sm text-muted-foreground">{formatDate(data.case_date)}</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">{data.company_name}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
            </div>
            {(data.upside ?? null) !== null || (data.downside ?? null) !== null ? (
              <div className="flex flex-wrap gap-3 text-sm">
                {data.upside !== null && data.upside !== undefined && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600 dark:text-emerald-400">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Upsida {data.upside.toFixed(1)}%
                  </span>
                )}
                {data.downside !== null && data.downside !== undefined && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1 text-rose-600 dark:text-rose-400">
                    <ArrowUpRight className="h-3.5 w-3.5 rotate-180" />
                    Nedsida {data.downside.toFixed(1)}%
                  </span>
                )}
              </div>
            ) : null}
            {thesis && (
              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
                {thesis.bull_case && (
                  <div>
                    <span className="font-medium text-foreground">Bull-case:</span> {thesis.bull_case}
                  </div>
                )}
                {thesis.bear_case && (
                  <div>
                    <span className="font-medium text-foreground">Bear-case:</span> {thesis.bear_case}
                  </div>
                )}
                {thesis.key_metric && (
                  <div>
                    <span className="font-medium text-foreground">Nyckeltal:</span> {thesis.key_metric}
                  </div>
                )}
              </div>
            )}
            {!canVote && (
              <p className="text-xs text-muted-foreground">Logga in för att rösta på caset.</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Inget case tillgängligt ännu. Prova att uppdatera senare.</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={voteDisabled}
            onClick={() => handleVote('up')}
            className="gap-2"
          >
            {voting && onVote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
            <span>{data?.upvotes ?? 0}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={voteDisabled}
            onClick={() => handleVote('down')}
            className="gap-2"
          >
            {voting && onVote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
            <span>{data?.downvotes ?? 0}</span>
          </Button>
        </div>
        {data?.updated_at && (
          <span className="text-xs text-muted-foreground">Senast uppdaterad {formatTime(data.updated_at)}</span>
        )}
      </CardFooter>
    </Card>
  );
};

export default DailyCaseCard;
