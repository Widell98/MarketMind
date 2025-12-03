import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import Index from '../Index';
import '@testing-library/jest-dom';

vi.mock('@/utils/marketHours', () => ({
  isMarketOpen: () => false,
}));

vi.mock('@/components/Layout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/PortfolioOverviewCard', () => ({
  __esModule: true,
  default: ({ summaryCards }: { summaryCards: Array<{ label: string; value: string; helper: string }> }) => (
    <div>
      {summaryCards.map((card) => (
        <div key={card.label}>
          <div>{card.label}</div>
          <div>{card.value}</div>
          <div>{card.helper}</div>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/AllocationCard', () => ({
  __esModule: true,
  default: () => <div>Allocation</div>,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'user@example.com',
      user_metadata: { first_name: 'Test' },
    },
    loading: false,
  }),
}));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/hooks/usePortfolio', () => ({
  usePortfolio: () => ({
    activePortfolio: {},
    loading: false,
  }),
}));

vi.mock('@/hooks/usePortfolioPerformance', () => ({
  usePortfolioPerformance: () => ({
    performance: {
      totalPortfolioValue: 100000,
      totalReturn: 0,
      totalReturnPercentage: 0,
      dayChangePercentage: 1,
      investedPercentage: 80,
      cashPercentage: 20,
    },
  }),
}));

vi.mock('@/hooks/useCashHoldings', () => ({
  useCashHoldings: () => ({ totalCash: 20000 }),
}));

vi.mock('@/hooks/useUserHoldings', () => ({
  useUserHoldings: () => ({
    actualHoldings: [
      {
        id: '1',
        name: 'Test Holding',
        symbol: 'TEST',
        holding_type: 'stock',
        quantity: 10,
        current_price_per_unit: 100,
        price_currency: 'SEK',
        dailyChangePercent: 2,
        dailyChangeValueSEK: 200,
      },
    ],
  }),
}));

vi.mock('@/hooks/useAIInsights', () => ({
  useAIInsights: () => ({
    insights: [],
    isLoading: false,
    lastUpdated: null,
    refreshInsights: vi.fn(),
  }),
}));

vi.mock('@/hooks/useLikedStockCases', () => ({
  useLikedStockCases: () => ({ likedStockCases: [], loading: false }),
}));

vi.mock('@/hooks/useNewsData', () => ({
  useNewsData: () => ({ morningBrief: null, newsData: [] }),
}));

vi.mock('@/hooks/useDailyChangeData', () => ({
  useDailyChangeData: () => ({
    data: new Map(),
    loading: false,
    getChangeForTicker: vi.fn().mockReturnValue(1),
  }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

describe('Index market hours handling', () => {
  it('shows zero development and no highlights when markets are closed', async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );

    expect(await screen.findByText('0.00%')).toBeInTheDocument();
    expect(screen.getByText('Marknaden stängd – 0,00 kr')).toBeInTheDocument();
    expect(screen.getAllByText('Ingen data ännu')).toHaveLength(2);
  });
});
