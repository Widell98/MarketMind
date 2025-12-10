// Polymarket Gamma API Types

export interface PolymarketOutcome {
  id: string;
  title: string;
  price: number; // 0.0 to 1.0
  volume?: number;
  description?: string;
}

export interface PolymarketMarket {
  id: string;
  slug: string;
  question: string;
  imageUrl?: string;
  description?: string;
  volume: number;
  volumeNum?: number;
  liquidity: number;
  outcomes: PolymarketOutcome[];
  endDate?: string;
  resolutionDate?: string;
  conditionId?: string;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  tags?: string[];
  groupItemTitle?: string;
  groupItemImageUrl?: string;
  groupItemSlug?: string;
}

export interface PolymarketMarketDetail extends PolymarketMarket {
  eventSlug?: string;
  liquidityNum?: number;
  startDate?: string;
  createdAt?: string;
  updatedAt?: string;
  endDateIso?: string;
  resolution?: string;
  resolutionSource?: string;
  archived?: boolean;
  collateralToken?: string;
  outcomesDetails?: PolymarketOutcome[];
}

export interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  markets?: PolymarketMarket[];
}

export interface PolymarketTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  marketCount?: number;
}

export interface PolymarketMarketsResponse {
  data: PolymarketMarket[];
  count?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface PolymarketHistoryPoint {
  timestamp: string;
  price: number;
  outcomeId: string;
  outcomeTitle: string;
}

export interface PolymarketMarketHistory {
  marketId: string;
  marketSlug: string;
  outcomes: {
    [outcomeId: string]: PolymarketHistoryPoint[];
  };
}

// Helper type for graph data transformation
export interface GraphDataPoint {
  date: string;
  [outcomeTitle: string]: string | number;
}

