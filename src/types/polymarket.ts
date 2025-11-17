export interface PolymarketOutcome {
  id: string;
  name: string;
  price: number;
  probability: number;
  volume24h?: number;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  categories: string[];
  liquidity: number;
  volume24h: number;
  closeTime?: string;
  createdTime?: string;
  outcomes: PolymarketOutcome[];
  url?: string;
  isResolved?: boolean;
}

export interface PolymarketMarketFilters {
  categories?: string[];
  minLiquidity?: number;
  minVolume24h?: number;
  closingAfter?: string;
  closingBefore?: string;
  limit?: number;
  marketIds?: string[];
}

export interface PolymarketMarketsResponse {
  markets: PolymarketMarket[];
  fetchedAt: string;
  cacheHit?: boolean;
}

export type PolymarketPositionStatus = 'open' | 'won' | 'lost' | 'cancelled' | 'resolved';

export interface PolymarketPosition {
  id: string;
  user_id: string;
  market_id: string;
  market_question: string | null;
  market_url: string | null;
  outcome_id: string | null;
  outcome_name: string | null;
  entry_odds: number;
  stake: number;
  status: PolymarketPositionStatus;
  close_time: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PolymarketPositionInput {
  marketId: string;
  marketQuestion?: string | null;
  marketUrl?: string | null;
  outcomeId?: string | null;
  outcomeName?: string | null;
  entryOdds: number;
  stake?: number;
  status?: PolymarketPositionStatus;
  closeTime?: string | null;
}
