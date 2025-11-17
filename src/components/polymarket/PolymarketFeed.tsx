import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { featureFlags } from '@/config/features';
import { usePolymarketMarkets } from '@/hooks/usePolymarketMarkets';
import { usePolymarketEligibility } from '@/hooks/usePolymarketEligibility';
import { usePolymarketPortfolio } from '@/hooks/usePolymarketPortfolio';
import type { PolymarketMarketFilters } from '@/types/polymarket';
import { AlertCircle, AlertTriangle, RefreshCw, ShieldAlert, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackPolymarketMetric } from '@/lib/analytics/polymarket';
import MarketCard, { MarketCardSkeleton } from './MarketCard';

const LIQUIDITY_STEP = 5000;
const LIQUIDITY_MAX = 50000;

const timeframes = [
  { value: 'all', label: 'Alla datum' },
  { value: '7d', label: 'Stänger inom 7 dagar' },
  { value: '30d', label: 'Stänger inom 30 dagar' },
];

export const PolymarketFeed: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [timeframe, setTimeframe] = useState('all');
  const [minLiquidity, setMinLiquidity] = useState(10000);
  const [minVolume24h, setMinVolume24h] = useState(1000);
  const navigate = useNavigate();
  const fetchStartedAtRef = useRef<number | null>(null);
  const activeFilterSignature = useRef<string>('');
  const { saveMarketPosition, isMarketSaved, removeByMarketId } = usePolymarketPortfolio();
  const eligibility = usePolymarketEligibility();

  const filters = useMemo<PolymarketMarketFilters>(() => {
    const filter: PolymarketMarketFilters = {
      minLiquidity,
      minVolume24h,
    };

    if (selectedCategory) {
      filter.categories = [selectedCategory];
    }

    if (timeframe !== 'all') {
      const now = new Date();
      const closingBefore = new Date(now);

      if (timeframe === '7d') {
        closingBefore.setDate(now.getDate() + 7);
      }

      if (timeframe === '30d') {
        closingBefore.setDate(now.getDate() + 30);
      }

      filter.closingAfter = now.toISOString();
      filter.closingBefore = closingBefore.toISOString();
    }

    return filter;
  }, [minLiquidity, minVolume24h, selectedCategory, timeframe]);

  const { data, isLoading, isFetching, error, refetch } = usePolymarketMarkets(filters, {
    enabled: eligibility.isEligible,
  });

  useEffect(() => {
    if (!eligibility.isEligible) return;
    if (isFetching) {
      fetchStartedAtRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
      activeFilterSignature.current = JSON.stringify(filters);
      return;
    }

    if (!isFetching && !isLoading && fetchStartedAtRef.current !== null) {
      const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - fetchStartedAtRef.current;
      trackPolymarketMetric({
        event: 'feed-load',
        durationMs: Math.round(duration),
        resultCount: data?.length ?? 0,
        filters: activeFilterSignature.current,
      });
      fetchStartedAtRef.current = null;
    }
  }, [data, eligibility.isEligible, filters, isFetching, isLoading]);

  useEffect(() => {
    if (!error || fetchStartedAtRef.current === null) return;

    const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - fetchStartedAtRef.current;
    trackPolymarketMetric({
      event: 'feed-error',
      durationMs: Math.round(duration),
      message: error.message,
      filters: activeFilterSignature.current,
    });
    fetchStartedAtRef.current = null;
  }, [error]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((market) => {
      market.categories.forEach((category) => set.add(category));
    });
    return Array.from(set).sort();
  }, [data]);

  const handleDiscuss = (market: Parameters<typeof saveMarketPosition>[0]) => {
    const outcomeSummary = market.outcomes
      .slice(0, 2)
      .map((outcome) => `${outcome.name}: ${Math.round(outcome.probability * 100)}%`)
      .join(', ');

    navigate('/ai-chatt', {
      state: {
        createNewSession: true,
        sessionName: `Polymarket: ${market.question.substring(0, 40)}`,
        initialMessage: `Analysera Polymarket-frågan "${market.question}". Utfall: ${outcomeSummary}. Hur ser risk/reward ut?`,
        polymarketMarket: market,
      },
    });
  };

  const handleSave = async (market: Parameters<typeof saveMarketPosition>[0]) => {
    if (isMarketSaved(market.id)) {
      await removeByMarketId(market.id);
      return;
    }

    await saveMarketPosition(market);
  };

  if (!featureFlags.polymarket.enabled) {
    return null;
  }

  return (
    <div className="space-y-4">
      {!eligibility.isEligible && (
        <Alert variant="default" className="border-amber-300/60 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Ålders- eller regionbegränsning</AlertTitle>
          <AlertDescription className="space-y-2 text-sm">
            <p>{eligibility.blockingReason}</p>
            {eligibility.ageBlocked && (
              <Button size="sm" variant="outline" className="mt-1" onClick={eligibility.confirmAge}>
                Jag bekräftar att jag är minst {eligibility.minimumAge} år
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-border/70 bg-card/70 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-primary/80">Polymarket</p>
            <h2 className="text-xl font-semibold text-foreground">Upptäck heta marknader</h2>
            <p className="text-sm text-muted-foreground">Filtrera på kategori, stängningstid och likviditet.</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Endast simulering och analys – inga faktiska bets placeras från MarketMind.
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select value={selectedCategory || 'all'} onValueChange={(value) => setSelectedCategory(value === 'all' ? '' : value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeframe">Tidsperiod</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Välj tidsperiod" />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="liquidity">Minsta likviditet</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="liquidity"
                  type="number"
                  min={0}
                  max={LIQUIDITY_MAX}
                  step={LIQUIDITY_STEP}
                  value={minLiquidity}
                  onChange={(event) => setMinLiquidity(Number(event.target.value))}
                  className="w-[140px]"
                />
                <Badge variant="secondary" className="rounded-full">
                  ≥ {minLiquidity.toLocaleString('sv-SE')} $
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume">Minsta volym 24h</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="volume"
                  type="number"
                  min={0}
                  step={500}
                  value={minVolume24h}
                  onChange={(event) => setMinVolume24h(Number(event.target.value))}
                  className="w-[140px]"
                />
                <Badge variant="secondary" className="rounded-full">
                  ≥ {minVolume24h.toLocaleString('sv-SE')} $
                </Badge>
              </div>
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="gap-2" onClick={() => refetch()} disabled={isFetching || !eligibility.isEligible}>
                <RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                Uppdatera
              </Button>
            </div>

            <div className="flex items-end">
              <Button className="gap-2" variant="secondary" onClick={() => navigate('/portfolio')}>
                <Wallet className="h-4 w-4" />
                Polymarket-portfölj
              </Button>
            </div>
          </div>
        </div>

        <Alert variant="default" className="mt-4 border-border/70 bg-muted/30 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertTitle className="text-sm font-semibold text-foreground">Ansvarsfriskrivning</AlertTitle>
          <AlertDescription>
            Data kommer från Polymarket och är endast för informations- och analysändamål. Kontrollera lokala regler och gör egna
            bedömningar innan du placerar riktiga bets utanför MarketMind.
          </AlertDescription>
        </Alert>
      </Card>

      {error && eligibility.isEligible && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Kunde inte hämta marknader</AlertTitle>
          <AlertDescription>
            {(error as Error & { displayMessage?: string }).displayMessage || (error as Error).message ||
              'Ett oväntat fel uppstod. Försök igen om en stund.'}
          </AlertDescription>
        </Alert>
      )}

      {eligibility.isEligible ? (
        isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((key) => (
              <MarketCardSkeleton key={key} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(data ?? []).map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                isSaved={isMarketSaved(market.id)}
                onDiscuss={eligibility.isEligible ? handleDiscuss : undefined}
                onSave={eligibility.isEligible ? handleSave : undefined}
                disabledReason={eligibility.isEligible ? undefined : eligibility.blockingReason ?? 'Begränsad åtkomst'}
              />
            ))}

            {!data?.length && !isLoading && (
              <Card className="flex flex-col items-center justify-center gap-2 border-border/60 bg-muted/20 p-6 text-center">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Inga marknader matchade dina filter.</p>
                <p className="text-xs text-muted-foreground">Prova att sänka filtren för att se fler alternativ.</p>
              </Card>
            )}
          </div>
        )
      ) : (
        <Card className="border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Polymarket-marknader kan inte visas på grund av ålders- eller regionbegränsningar.
        </Card>
      )}

      {isFetching && !isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Skeleton className="h-4 w-4 rounded-full" />
          Uppdaterar marknader...
        </div>
      )}
    </div>
  );
};

export default PolymarketFeed;
