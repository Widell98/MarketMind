import { useEffect, useMemo, useState } from 'react';
import type { PolymarketMarket } from '@/types/polymarket';

export interface SavedPolymarketBet {
  marketId: string;
  question: string;
  outcomeName?: string;
  savedAt: string;
  closeTime?: string;
  odds?: number;
}

const STORAGE_KEY = 'polymarket_saved_bets';

const parseSavedBets = (): SavedPolymarketBet[] => {
  if (typeof window === 'undefined') return [];

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const usePolymarketSavedBets = () => {
  const [savedBets, setSavedBets] = useState<SavedPolymarketBet[]>([]);

  useEffect(() => {
    setSavedBets(parseSavedBets());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedBets));
  }, [savedBets]);

  const isSaved = (marketId: string) => savedBets.some((bet) => bet.marketId === marketId);

  const toggleSave = (market: PolymarketMarket, preferredOutcomeIndex = 0) => {
    setSavedBets((current) => {
      if (current.some((bet) => bet.marketId === market.id)) {
        return current.filter((bet) => bet.marketId !== market.id);
      }

      const outcome = market.outcomes?.[preferredOutcomeIndex];

      const savedBet: SavedPolymarketBet = {
        marketId: market.id,
        question: market.question,
        outcomeName: outcome?.name,
        odds: outcome?.probability ?? outcome?.price,
        closeTime: market.closeTime,
        savedAt: new Date().toISOString(),
      };

      return [...current, savedBet];
    });
  };

  const savedMarketsLookup = useMemo(() => {
    return new Map(savedBets.map((bet) => [bet.marketId, bet] as const));
  }, [savedBets]);

  return {
    savedBets,
    savedMarketsLookup,
    isSaved,
    toggleSave,
  };
};
