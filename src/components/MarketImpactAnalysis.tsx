import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { PolymarketMarket } from "@/types/polymarket";

interface MarketImpactAnalysisProps {
  market: PolymarketMarket;
}

// Rule-based mapping for market impact analysis
const getMarketImpact = (market: PolymarketMarket): {
  positive: { category: string; tickers: string[] }[];
  negative: { category: string; tickers: string[] }[];
} => {
  const questionLower = market.question.toLowerCase();
  const tags = market.tags || [];
  
  // Default/empty impact
  let positive: { category: string; tickers: string[] }[] = [];
  let negative: { category: string; tickers: string[] }[] = [];

  // Fed/Interest Rate decisions
  if (questionLower.includes("fed") || questionLower.includes("interest rate") || questionLower.includes("ränta")) {
    // Rate decrease scenarios
    if (questionLower.includes("decrease") || questionLower.includes("cut") || questionLower.includes("sänk")) {
      positive = [
        { category: "Tech / Growth", tickers: ["MGOOG", "SOL"] },
        { category: "Crypto", tickers: ["BTC", "ETH", "SOL"] },
        { category: "Real Estate", tickers: ["VNQ", "CAST", "AMT"] },
      ];
      negative = [
        { category: "USD", tickers: ["DXY", "UUP"] },
        { category: "Banking", tickers: ["JPM", "SEB", "GS"] },
        { category: "Financials", tickers: ["VISA", "MA", "MS"] },
      ];
    } 
    // Rate increase scenarios
    else if (questionLower.includes("increase") || questionLower.includes("hike") || questionLower.includes("höj")) {
      positive = [
        { category: "USD", tickers: ["DXY", "UUP"] },
        { category: "Banking", tickers: ["JPM", "SEB", "GS"] },
      ];
      negative = [
        { category: "Tech / Growth", tickers: ["MGOOG", "SOL"] },
        { category: "Crypto", tickers: ["BTC", "ETH", "SOL"] },
        { category: "Real Estate", tickers: ["VNQ", "CAST", "AMT"] },
      ];
    }
  }
  
  // Election/Politics
  else if (questionLower.includes("election") || questionLower.includes("president") || questionLower.includes("val")) {
    positive = [
      { category: "Defense", tickers: ["LMT", "RTX", "NOC"] },
      { category: "Energy", tickers: ["XOM", "CVX"] },
    ];
    negative = [
      { category: "Renewable Energy", tickers: ["ENPH", "SEDG"] },
      { category: "Healthcare", tickers: ["UNH", "CI"] },
    ];
  }
  
  // Crypto markets
  else if (questionLower.includes("bitcoin") || questionLower.includes("btc") || questionLower.includes("crypto") || tags.includes("crypto")) {
    positive = [
      { category: "Crypto", tickers: ["BTC", "ETH", "SOL"] },
      { category: "Tech", tickers: ["MSTR", "COIN"] },
    ];
    negative = [
      { category: "Traditional Finance", tickers: ["JPM", "BAC"] },
    ];
  }
  
  // Stock market indices
  else if (questionLower.includes("s&p") || questionLower.includes("sp500") || questionLower.includes("nasdaq") || questionLower.includes("dow")) {
    positive = [
      { category: "Broad Market", tickers: ["SPY", "QQQ", "DIA"] },
      { category: "Growth", tickers: ["MGOOG", "SOL"] },
    ];
    negative = [
      { category: "Bonds", tickers: ["TLT", "IEF"] },
    ];
  }
  
  // Inflation/CPI
  else if (questionLower.includes("inflation") || questionLower.includes("cpi") || questionLower.includes("inflation")) {
    positive = [
      { category: "Commodities", tickers: ["GLD", "SLV", "OIL"] },
      { category: "Real Estate", tickers: ["VNQ", "AMT"] },
    ];
    negative = [
      { category: "Bonds", tickers: ["TLT", "IEF"] },
      { category: "Growth", tickers: ["MGOOG", "SOL"] },
    ];
  }

  return { positive, negative };
};

export const MarketImpactAnalysis: React.FC<MarketImpactAnalysisProps> = ({ market }) => {
  const impact = getMarketImpact(market);

  if (impact.positive.length === 0 && impact.negative.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">Marknadseffekt av detta scenario</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 pt-0">
        {/* Positive Impact */}
        {impact.positive.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-green-600 dark:text-green-400">
                ↑ Positiv påverkan
              </h3>
            </div>
            <div className="space-y-3">
              {impact.positive.map((item, index) => (
                <div key={index}>
                  <p className="text-sm font-medium mb-1">{item.category}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tickers.map((ticker) => (
                      <span
                        key={ticker}
                        className="px-2 py-1 text-xs bg-green-500/10 text-green-700 dark:text-green-400 rounded"
                      >
                        {ticker}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Negative Impact */}
        {impact.negative.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-red-600 dark:text-red-400">
                ↓ Negativ påverkan
              </h3>
            </div>
            <div className="space-y-3">
              {impact.negative.map((item, index) => (
                <div key={index}>
                  <p className="text-sm font-medium mb-1">{item.category}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tickers.map((ticker) => (
                      <span
                        key={ticker}
                        className="px-2 py-1 text-xs bg-red-500/10 text-red-700 dark:text-red-400 rounded"
                      >
                        {ticker}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

