
import { RiskProfile } from '@/hooks/useRiskProfile';

interface PortfolioAllocation {
  stocks: number;
  bonds: number;
  real_estate: number;
  cash: number;
}

interface StockRecommendation {
  symbol: string;
  name: string;
  sector: string;
  allocation: number;
}

interface GeneratedPortfolio {
  asset_allocation: PortfolioAllocation;
  recommended_stocks: StockRecommendation[];
  expected_return: number;
  risk_score: number;
  reasoning: string;
}

export const generateLocalPortfolio = (riskProfile: RiskProfile): GeneratedPortfolio => {
  // Determine base allocation based on risk tolerance
  let baseAllocation: PortfolioAllocation;
  let expectedReturn: number;
  let riskScore: number;

  switch (riskProfile.risk_tolerance) {
    case 'conservative':
      baseAllocation = { stocks: 30, bonds: 50, real_estate: 10, cash: 10 };
      expectedReturn = 4.5;
      riskScore = 3;
      break;
    case 'aggressive':
      baseAllocation = { stocks: 80, bonds: 10, real_estate: 5, cash: 5 };
      expectedReturn = 9.2;
      riskScore = 8;
      break;
    default: // moderate
      baseAllocation = { stocks: 60, bonds: 25, real_estate: 10, cash: 5 };
      expectedReturn = 6.8;
      riskScore = 5;
      break;
  }

  // Adjust for age (younger = more aggressive)
  if (riskProfile.age && riskProfile.age < 35) {
    baseAllocation.stocks += 10;
    baseAllocation.bonds -= 5;
    baseAllocation.cash -= 5;
    expectedReturn += 0.8;
    riskScore += 1;
  } else if (riskProfile.age && riskProfile.age > 50) {
    baseAllocation.stocks -= 10;
    baseAllocation.bonds += 8;
    baseAllocation.cash += 2;
    expectedReturn -= 0.6;
    riskScore -= 1;
  }

  // Adjust for investment horizon
  if (riskProfile.investment_horizon === 'short') {
    baseAllocation.stocks -= 15;
    baseAllocation.bonds += 10;
    baseAllocation.cash += 5;
    expectedReturn -= 1.2;
    riskScore -= 2;
  } else if (riskProfile.investment_horizon === 'long') {
    baseAllocation.stocks += 10;
    baseAllocation.bonds -= 8;
    baseAllocation.real_estate += 3;
    baseAllocation.cash -= 5;
    expectedReturn += 1.0;
    riskScore += 1;
  }

  // Ensure allocations are within reasonable bounds and sum to 100
  baseAllocation.stocks = Math.max(20, Math.min(85, baseAllocation.stocks));
  baseAllocation.bonds = Math.max(5, Math.min(60, baseAllocation.bonds));
  baseAllocation.real_estate = Math.max(0, Math.min(20, baseAllocation.real_estate));
  baseAllocation.cash = Math.max(2, Math.min(20, baseAllocation.cash));

  // Normalize to 100%
  const total = Object.values(baseAllocation).reduce((sum, val) => sum + val, 0);
  Object.keys(baseAllocation).forEach(key => {
    baseAllocation[key as keyof PortfolioAllocation] = Math.round(
      (baseAllocation[key as keyof PortfolioAllocation] / total) * 100
    );
  });

  // Generate stock recommendations based on sector interests
  const availableStocks = {
    Technology: [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' }
    ],
    Healthcare: [
      { symbol: 'JNJ', name: 'Johnson & Johnson' },
      { symbol: 'PFE', name: 'Pfizer Inc.' },
      { symbol: 'UNH', name: 'UnitedHealth Group' }
    ],
    Financial: [
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
      { symbol: 'BAC', name: 'Bank of America Corp.' },
      { symbol: 'WFC', name: 'Wells Fargo & Company' }
    ],
    Consumer: [
      { symbol: 'AMZN', name: 'Amazon.com Inc.' },
      { symbol: 'TSLA', name: 'Tesla Inc.' },
      { symbol: 'NFLX', name: 'Netflix Inc.' }
    ]
  };

  const recommendedStocks: StockRecommendation[] = [];
  const sectorInterests = riskProfile.sector_interests || [];
  
  // If user has sector preferences, prioritize those
  if (sectorInterests.length > 0) {
    sectorInterests.forEach((sector, index) => {
      const stocks = availableStocks[sector as keyof typeof availableStocks];
      if (stocks && stocks.length > 0) {
        const stock = stocks[0];
        recommendedStocks.push({
          symbol: stock.symbol,
          name: stock.name,
          sector: sector,
          allocation: Math.round((baseAllocation.stocks / sectorInterests.length) * 0.6)
        });
      }
    });
  }

  // Fill remaining with diversified picks
  const remainingAllocation = baseAllocation.stocks - recommendedStocks.reduce((sum, stock) => sum + stock.allocation, 0);
  if (remainingAllocation > 0) {
    const diversifiedPicks = [
      { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', sector: 'ETF' },
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', sector: 'ETF' }
    ];
    
    diversifiedPicks.forEach((stock, index) => {
      if (recommendedStocks.length < 6) {
        recommendedStocks.push({
          ...stock,
          allocation: Math.round(remainingAllocation / (diversifiedPicks.length - index))
        });
      }
    });
  }

  // Generate reasoning
  const reasoning = `Based on your risk profile, I've created a ${riskProfile.risk_tolerance} portfolio with ${baseAllocation.stocks}% stocks, ${baseAllocation.bonds}% bonds, ${baseAllocation.real_estate}% real estate, and ${baseAllocation.cash}% cash. 

Key considerations:
- Age ${riskProfile.age}: ${riskProfile.age && riskProfile.age < 35 ? 'Young age allows for higher risk tolerance' : riskProfile.age && riskProfile.age > 50 ? 'Mature age suggests more conservative approach' : 'Balanced approach for your age group'}
- Investment horizon: ${riskProfile.investment_horizon} term ${riskProfile.investment_horizon === 'short' ? 'requires more conservative allocation' : riskProfile.investment_horizon === 'long' ? 'allows for growth-focused strategy' : 'suggests balanced growth approach'}
- Risk tolerance: ${riskProfile.risk_tolerance} approach
- Monthly investment: ${riskProfile.monthly_investment_amount} SEK suggests ${riskProfile.monthly_investment_amount && riskProfile.monthly_investment_amount > 2000 ? 'strong savings capacity' : 'steady building approach'}

This portfolio aims for approximately ${expectedReturn.toFixed(1)}% annual returns with a risk score of ${riskScore}/10.`;

  return {
    asset_allocation: baseAllocation,
    recommended_stocks: recommendedStocks,
    expected_return: expectedReturn,
    risk_score: riskScore,
    reasoning: reasoning
  };
};
