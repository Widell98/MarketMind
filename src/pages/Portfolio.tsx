import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { featureFlags } from '@/config/features';
import { cn } from '@/lib/utils';
import { usePolymarketEligibility } from '@/hooks/usePolymarketEligibility';
import { usePolymarketMarkets } from '@/hooks/usePolymarketMarkets';
import { usePolymarketPortfolio } from '@/hooks/usePolymarketPortfolio';
import type { PolymarketPositionStatus } from '@/types/polymarket';
import {
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Trophy,
  Wallet,
} from 'lucide-react';

const statusLabels: Record<PolymarketPositionStatus, string> = {
  open: 'Öppen',
  won: 'Vunnen',
  lost: 'Förlorad',
  cancelled: 'Inställd',
  resolved: 'Avräknad',
};

const statusTone: Record<PolymarketPositionStatus, string> = {
  open: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-100',
  won: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-100',
  lost: 'bg-destructive/10 text-destructive border-destructive/40',
  cancelled: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-100',
  resolved: 'bg-slate-500/10 text-slate-700 border-slate-200 dark:text-slate-100',
};

const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  const { positions, loading, updatePosition, removePosition, refresh } = usePolymarketPortfolio();
  const eligibility = usePolymarketEligibility();
  const marketIds = useMemo(() => Array.from(new Set(positions.map((position) => position.market_id))), [positions]);
  const { data: markets = [], isFetching: marketsFetching, refetch } = usePolymarketMarkets(
    { marketIds },
    { enabled: featureFlags.polymarket.enabled && eligibility.isEligible && marketIds.length > 0 },
  );
  const marketsById = useMemo(() => new Map(markets.map((market) => [market.id, market])), [markets]);
  const [stakeDrafts, setStakeDrafts] = useState<Record<string, string>>({});

  const positionsWithMarket = useMemo(() => {
    return positions.map((position) => {
      const market = marketsById.get(position.market_id);
      const outcome = market?.outcomes.find(
        (item) => item.id === position.outcome_id || item.name === position.outcome_name,
      );
      const currentProbability = outcome?.probability ?? null;
      const pnl = currentProbability !== null ? (currentProbability - position.entry_odds) * position.stake : null;
      const expectedValue = currentProbability !== null ? currentProbability * position.stake : null;
      const closeTime = market?.closeTime ?? position.close_time ?? null;

      return { position, market, outcome, pnl, expectedValue, currentProbability, closeTime };
    });
  }, [marketsById, positions]);

  const stats = useMemo(() => {
    const openCount = positions.filter((position) => position.status === 'open').length;
    const totalStake = positions.reduce((sum, position) => sum + (position.stake ?? 0), 0);
    const totalPnl = positionsWithMarket.reduce((sum, item) => sum + (item.pnl ?? 0), 0);

    return { openCount, totalStake, totalPnl };
  }, [positions, positionsWithMarket]);

  const handleStakeChange = (id: string, value: string) => {
    setStakeDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const handleStakeBlur = (id: string, currentStake: number) => {
    const draftValue = stakeDrafts[id];
    if (draftValue === undefined) return;

    const parsed = Number(draftValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setStakeDrafts((prev) => ({ ...prev, [id]: String(currentStake) }));
      return;
    }

    if (parsed !== currentStake) {
      updatePosition(id, { stake: parsed });
    }
  };

  const handleStatusChange = (id: string, status: PolymarketPositionStatus) => {
    updatePosition(id, { status });
  };

  const handleRefresh = () => {
    refresh();
    if (marketIds.length) {
      refetch();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-primary/80">Polymarket</p>
            <h1 className="text-2xl font-semibold text-foreground">Min Polymarket-portfölj</h1>
            <p className="text-sm text-muted-foreground">
              Spara bevakade marknader, följ live-odds och se teoretisk risk/avkastning.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/')}>Tillbaka till startsidan</Button>
            <Button className="gap-2" variant="secondary" onClick={handleRefresh} disabled={loading || marketsFetching}>
              <RefreshCw className={cn('h-4 w-4', marketsFetching ? 'animate-spin' : '')} />
              Uppdatera data
            </Button>
          </div>
        </div>

        {!eligibility.isEligible && (
          <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Begränsad åtkomst</AlertTitle>
            <AlertDescription>
              {eligibility.blockingReason ?? 'Polymarket är inte tillgängligt i din miljö just nu.'}
            </AlertDescription>
          </Alert>
        )}

        <Alert variant="default" className="border-amber-300/60 bg-amber-50 text-amber-900">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-sm font-semibold">Ansvarsfriskrivning och riskinformation</AlertTitle>
          <AlertDescription className="text-sm">
            Portföljen är en simulering. MarketMind placerar inga riktiga bets och du ansvarar själv för att följa lokala regler.
            Odds och sannolikheter kan ändras snabbt och historisk data är ingen garanti för framtida utfall.
          </AlertDescription>
        </Alert>

        {!featureFlags.polymarket.enabled && (
          <Alert variant="destructive" className="border-destructive/40 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Polymarket är avstängt</AlertTitle>
            <AlertDescription>
              Funktionen är avstängd i denna miljö. Slå på feature-flaggen VITE_ENABLE_POLYMARKET för att använda portföljen.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/70 bg-card/70">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Wallet className="h-4 w-4" /> Öppna positioner
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-foreground">{stats.openCount}</CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <TrendingUp className="h-4 w-4" /> Totalt insatsvärde
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-foreground">
              {stats.totalStake.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} $
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Trophy className="h-4 w-4" /> Teoretisk PnL
              </CardTitle>
            </CardHeader>
            <CardContent
              className={cn(
                'text-2xl font-bold',
                stats.totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
              )}
            >
              {stats.totalPnl.toFixed(2)}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70 bg-card/70">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Bevakade marknader</CardTitle>
                <p className="text-sm text-muted-foreground">Hantera insats, status och se live-odds.</p>
              </div>

              {marketsFetching && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  Hämtar uppdaterade odds...
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map((key) => (
                  <Card key={key} className="border-border/60 bg-muted/20">
                    <CardContent className="space-y-3 p-4">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-2/3" />
                      <div className="grid gap-3 md:grid-cols-3">
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10" />
                        <Skeleton className="h-10" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!loading && positions.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/10 p-8 text-center">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Inga sparade Polymarket-positioner ännu.</p>
                  <p className="text-xs text-muted-foreground">
                    Lägg till från startsidan för att simulera risk och avkastning.
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/')}>Hitta marknader</Button>
              </div>
            )}

            {!loading && positionsWithMarket.map(({ position, market, outcome, pnl, expectedValue, currentProbability, closeTime }) => (
              <div
                key={position.id}
                className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn('border', statusTone[position.status])}>
                        {statusLabels[position.status]}
                      </Badge>
                      {closeTime && (
                        <Badge variant="secondary" className="rounded-full text-xs">
                          Stänger {new Date(closeTime).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {market?.question ?? position.market_question ?? 'Okänd marknad'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {outcome?.name ?? position.outcome_name ?? 'Inget utfall valt'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {market?.url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={market.url} target="_blank" rel="noreferrer" className="gap-2 text-sm font-medium text-primary">
                          Visa på Polymarket
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removePosition(position.id)}>
                      Ta bort
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Insats (simulerad)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={stakeDrafts[position.id] ?? position.stake}
                      onChange={(event) => handleStakeChange(position.id, event.target.value)}
                      onBlur={() => handleStakeBlur(position.id, position.stake)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={position.status} onValueChange={(value) => handleStatusChange(position.id, value as PolymarketPositionStatus)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj status" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(statusLabels) as PolymarketPositionStatus[]).map((key) => (
                          <SelectItem key={key} value={key}>
                            {statusLabels[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Teoretisk PnL</Label>
                    <div className="rounded-lg border border-border/60 bg-card/80 p-3">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          pnl !== null && pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
                        )}
                      >
                        {pnl === null ? 'Live-odds saknas' : `${pnl.toFixed(2)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentProbability !== null
                          ? `Live-odds ${Math.round(currentProbability * 100)}% (entry ${(position.entry_odds * 100).toFixed(0)}%)`
                          : 'Ingen live-data tillgänglig just nu.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-border/60 bg-card/80 p-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground">
                      <ShieldAlert className="h-4 w-4 text-amber-500" /> Risk
                    </div>
                    <p className="mt-2">Insats {position.stake.toLocaleString('sv-SE')} $</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/80 p-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground">
                      <TrendingUp className="h-4 w-4 text-primary" /> Förväntad avkastning
                    </div>
                    <p className="mt-2">
                      {expectedValue === null
                        ? 'Live-odds saknas'
                        : `${expectedValue.toFixed(2)} (vid nuvarande sannolikhet)`}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/80 p-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground">
                      <AlertCircle className="h-4 w-4 text-rose-500" /> Guardrails
                    </div>
                    <p className="mt-2">
                      Endast analys – inga faktiska bets placeras. Uppdatera status när marknaden avräknas.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Portfolio;
