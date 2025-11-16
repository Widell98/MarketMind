import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { featureFlags } from '@/config/features';
import type { PolymarketMarket, PolymarketPosition, PolymarketPositionInput } from '@/types/polymarket';

const DEFAULT_STAKE = 100;
const GUEST_STORAGE_KEY = 'polymarket_guest_positions';

const readGuestPositions = (): PolymarketPosition[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistGuestPositions = (positions: PolymarketPosition[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(positions));
};

type AddOptions = {
  showToast?: boolean;
};

type UpdateOptions = {
  showToast?: boolean;
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `temp-${Math.random().toString(36).slice(2, 10)}`;
};

export const usePolymarketPortfolio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const allowGuestPortfolio = featureFlags.polymarket.allowGuestPortfolio;
  const isGuestMode = allowGuestPortfolio && !user;
  const [positions, setPositions] = useState<PolymarketPosition[]>(() => {
    if (allowGuestPortfolio) {
      return readGuestPositions();
    }
    return [];
  });
  const [loading, setLoading] = useState(false);

  const fetchPositions = useCallback(async () => {
    if (!user) {
      if (allowGuestPortfolio) {
        setPositions(readGuestPositions());
      } else {
        setPositions([]);
      }
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('polymarket_positions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch polymarket positions', error);
      toast({
        title: 'Kunde inte hämta portföljen',
        description: error.message,
        variant: 'destructive',
      });
    }

    setPositions(data ?? []);
    setLoading(false);
  }, [allowGuestPortfolio, toast, user]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  useEffect(() => {
    if (isGuestMode) {
      setPositions(readGuestPositions());
    }
  }, [isGuestMode]);

  const addPosition = useCallback(
    async (input: PolymarketPositionInput, options?: AddOptions): Promise<PolymarketPosition | null> => {
      if (!user && !allowGuestPortfolio) {
        toast({
          title: 'Logga in för att spara',
          description: 'Du behöver vara inloggad för att spara en Polymarket-position.',
          variant: 'destructive',
        });
        return null;
      }

    const optimisticPosition: PolymarketPosition = {
      id: generateId(),
      user_id: user?.id ?? 'guest',
      market_id: input.marketId,
      market_question: input.marketQuestion ?? null,
      market_url: input.marketUrl ?? null,
      outcome_id: input.outcomeId ?? null,
      outcome_name: input.outcomeName ?? null,
      entry_odds: input.entryOdds,
      stake: input.stake ?? DEFAULT_STAKE,
      status: input.status ?? 'open',
      close_time: input.closeTime ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isGuestMode) {
      setPositions((prev) => {
        const next = [optimisticPosition, ...prev];
        persistGuestPositions(next);
        return next;
      });

      if (options?.showToast ?? true) {
        toast({
          title: 'Sparad i demoportfölj',
          description: 'Vi sparade din simulering lokalt för denna session.',
        });
      }
      return optimisticPosition;
    }

    setPositions((prev) => [optimisticPosition, ...prev]);

    const { data, error } = await supabase
      .from('polymarket_positions')
      .insert({
        user_id: user.id,
        market_id: input.marketId,
        market_question: input.marketQuestion,
        market_url: input.marketUrl,
        outcome_id: input.outcomeId,
        outcome_name: input.outcomeName,
        entry_odds: input.entryOdds,
        stake: input.stake ?? DEFAULT_STAKE,
        status: input.status ?? 'open',
        close_time: input.closeTime,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Failed to insert polymarket position', error);
      setPositions((prev) => prev.filter((position) => position.id !== optimisticPosition.id));
      toast({
        title: 'Kunde inte spara positionen',
        description: error?.message ?? 'Försök igen om en stund.',
        variant: 'destructive',
      });
      return null;
    }

    setPositions((prev) =>
      prev.map((position) => (position.id === optimisticPosition.id ? (data as PolymarketPosition) : position)),
    );

    if (options?.showToast ?? true) {
      toast({
        title: 'Sparad till portfölj',
        description: 'Polymarket-positionen lades till i din portfölj.',
      });
    }

    return data as PolymarketPosition;
  }, [isGuestMode, toast, user, allowGuestPortfolio]);

  const updatePosition = useCallback(
    async (
      id: string,
      updates: Partial<PolymarketPositionInput & { status: PolymarketPosition['status'] }>,
      options?: UpdateOptions,
    ): Promise<PolymarketPosition | null> => {
      if (!user && !allowGuestPortfolio) {
        return null;
      }

    const previous = positions;
    const nextPositions = positions.map((position) =>
      position.id === id
        ? {
            ...position,
            ...updates,
            entry_odds: updates.entryOdds ?? position.entry_odds,
            stake: updates.stake ?? position.stake,
            status: (updates.status as PolymarketPosition['status']) ?? position.status,
            updated_at: new Date().toISOString(),
          }
        : position,
    );

    setPositions(nextPositions);

    if (isGuestMode) {
      persistGuestPositions(nextPositions);
      if (options?.showToast ?? true) {
        toast({
          title: 'Uppdaterad',
          description: 'Demoportföljen uppdaterades.',
        });
      }
      return nextPositions.find((position) => position.id === id) ?? null;
    }

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.marketQuestion !== undefined) payload.market_question = updates.marketQuestion;
    if (updates.marketUrl !== undefined) payload.market_url = updates.marketUrl;
    if (updates.outcomeId !== undefined) payload.outcome_id = updates.outcomeId;
    if (updates.outcomeName !== undefined) payload.outcome_name = updates.outcomeName;
    if (updates.entryOdds !== undefined) payload.entry_odds = updates.entryOdds;
    if (updates.stake !== undefined) payload.stake = updates.stake;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.closeTime !== undefined) payload.close_time = updates.closeTime;

    const { data, error } = await supabase
      .from('polymarket_positions')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Failed to update polymarket position', error);
      setPositions(previous);
      toast({
        title: 'Uppdateringen misslyckades',
        description: error?.message ?? 'Försök igen om en stund.',
        variant: 'destructive',
      });
      return null;
    }

    setPositions((prev) => prev.map((position) => (position.id === id ? (data as PolymarketPosition) : position)));

    if (options?.showToast ?? true) {
      toast({
        title: 'Uppdaterad',
        description: 'Positionen uppdaterades.',
      });
    }
    return data as PolymarketPosition;
  }, [allowGuestPortfolio, isGuestMode, positions, toast, user]);

  const removePosition = useCallback(
    async (id: string, showToast = true): Promise<boolean> => {
      if (!user && !allowGuestPortfolio) return false;

    const previous = positions;
    const nextPositions = positions.filter((position) => position.id !== id);
    setPositions(nextPositions);

    if (isGuestMode) {
      persistGuestPositions(nextPositions);
      if (showToast) {
        toast({
          title: 'Borttagen',
          description: 'Positionen togs bort från din demoportfölj.',
        });
      }
      return true;
    }

    const { error } = await supabase
      .from('polymarket_positions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete polymarket position', error);
      setPositions(previous);
      toast({
        title: 'Kunde inte ta bort',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    if (showToast) {
      toast({
        title: 'Borttagen',
        description: 'Positionen togs bort från din portfölj.',
      });
    }

    return true;
  }, [allowGuestPortfolio, isGuestMode, positions, toast, user]);

  const removeByMarketId = useCallback(
    async (marketId: string, showToast = true): Promise<boolean> => {
      const target = positions.find((position) => position.market_id === marketId);
      if (!target) return true;
      return removePosition(target.id, showToast);
    },
    [positions, removePosition],
  );

  const saveMarketPosition = useCallback(
    (market: PolymarketMarket, preferredOutcomeIndex = 0, stake = DEFAULT_STAKE) => {
      const outcome = market.outcomes?.[preferredOutcomeIndex];
      return addPosition(
        {
          marketId: market.id,
          marketQuestion: market.question,
          marketUrl: market.url,
          outcomeId: outcome?.id,
          outcomeName: outcome?.name,
          entryOdds: outcome?.probability ?? outcome?.price ?? 0,
          stake,
          closeTime: market.closeTime,
        },
        { showToast: true },
      );
    },
    [addPosition],
  );

  const isMarketSaved = useMemo(() => {
    return (marketId: string) => positions.some((position) => position.market_id === marketId);
  }, [positions]);

  return {
    positions,
    loading,
    refresh: fetchPositions,
    addPosition,
    updatePosition,
    removePosition,
    removeByMarketId,
    saveMarketPosition,
    isMarketSaved,
  };
};

export type PolymarketPortfolioHook = ReturnType<typeof usePolymarketPortfolio>;
