
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";

const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');

serve(async (req) => {
  const { headers: corsHeaders, originAllowed } = buildCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    if (!originAllowed) {
      return new Response('Origin not allowed', { status: 403, headers: corsHeaders });
    }

    return new Response(null, { headers: corsHeaders });
  }

  if (!originAllowed) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Fetching live market data...');
    
    const marketData = await fetchLiveMarketData();
    
    return new Response(JSON.stringify(marketData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchLiveMarketData() {
  if (!alphaVantageKey) {
    console.log('No Alpha Vantage key, using mock data');
    return getMockMarketData();
  }

  try {
    // Fetch market indices and top stocks
    const symbols = ['SPY', 'QQQ', 'DIA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META'];
    const batchRequests = symbols.map(symbol => 
      fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageKey}`)
        .then(r => r.json())
        .then(data => ({ symbol, data }))
        .catch(error => {
          console.error(`Error fetching ${symbol}:`, error);
          return { symbol, data: null };
        })
    );

    const responses = await Promise.all(batchRequests);
    
    const marketIndices = [];
    const topStocks = [];
    const bottomStocks = [];

    responses.forEach(({ symbol, data }) => {
      if (!data || !data['Global Quote'] || !data['Global Quote']['05. price']) {
        console.log(`Invalid data for ${symbol}, skipping`);
        return;
      }
      
      const quote = data['Global Quote'];
      const price = parseFloat(quote['05. price'] || '0');
      const change = parseFloat(quote['09. change'] || '0');
      const changePercent = parseFloat(quote['10. change percent']?.replace('%', '') || '0');
      
      // Skip if we don't have valid price data
      if (price === 0) {
        console.log(`No valid price for ${symbol}, skipping`);
        return;
      }
      
      const stockData = {
        symbol,
        name: getCompanyName(symbol),
        price,
        change,
        changePercent,
        sparklineData: generateSparklineData()
      };

      // Categorize data
      if (['SPY', 'QQQ', 'DIA'].includes(symbol)) {
        marketIndices.push(stockData);
      } else if (changePercent > 0) {
        topStocks.push(stockData);
      } else {
        bottomStocks.push(stockData);
      }
    });

    // Sort stocks by performance
    topStocks.sort((a, b) => b.changePercent - a.changePercent);
    bottomStocks.sort((a, b) => a.changePercent - b.changePercent);

    // If we don't have enough data from the API, supplement with mock data
    const result = {
      marketIndices: marketIndices.length > 0 ? marketIndices.slice(0, 3) : getMockMarketData().marketIndices,
      topStocks: topStocks.length > 0 ? topStocks.slice(0, 5) : getMockMarketData().topStocks,
      bottomStocks: bottomStocks.length > 0 ? bottomStocks.slice(0, 5) : getMockMarketData().bottomStocks,
      lastUpdated: new Date().toISOString()
    };

    console.log('Market data fetched successfully:', {
      marketIndices: result.marketIndices.length,
      topStocks: result.topStocks.length,
      bottomStocks: result.bottomStocks.length
    });

    return result;
  } catch (error) {
    console.error('Error fetching live market data:', error);
    return getMockMarketData();
  }
}

function getCompanyName(symbol: string): string {
  const companies: { [key: string]: string } = {
    'SPY': 'SPDR S&P 500 ETF',
    'QQQ': 'Invesco QQQ ETF',
    'DIA': 'SPDR Dow Jones ETF',
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corp.',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'NVDA': 'NVIDIA Corp.',
    'META': 'Meta Platforms Inc.'
  };
  return companies[symbol] || symbol;
}

function generateSparklineData(): number[] {
  return Array.from({ length: 20 }, () => Math.random() * 100 + 50);
}

function getMockMarketData() {
  return {
    marketIndices: [
      {
        symbol: 'SPY',
        name: 'SPDR S&P 500 ETF',
        price: 415.23,
        change: 1.23,
        changePercent: 0.30,
        sparklineData: generateSparklineData()
      },
      {
        symbol: 'QQQ',
        name: 'Invesco QQQ ETF',
        price: 367.45,
        change: -2.15,
        changePercent: -0.58,
        sparklineData: generateSparklineData()
      },
      {
        symbol: 'DIA',
        name: 'SPDR Dow Jones ETF',
        price: 339.87,
        change: 0.95,
        changePercent: 0.28,
        sparklineData: generateSparklineData()
      }
    ],
    topStocks: [
      {
        symbol: 'NVDA',
        name: 'NVIDIA Corp.',
        price: 875.28,
        change: 15.44,
        changePercent: 1.80,
        sparklineData: generateSparklineData()
      },
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 185.64,
        change: 2.11,
        changePercent: 1.15,
        sparklineData: generateSparklineData()
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corp.',
        price: 411.22,
        change: 5.78,
        changePercent: 1.43,
        sparklineData: generateSparklineData()
      }
    ],
    bottomStocks: [
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: 248.50,
        change: -8.22,
        changePercent: -3.20,
        sparklineData: generateSparklineData()
      },
      {
        symbol: 'META',
        name: 'Meta Platforms Inc.',
        price: 485.20,
        change: -12.40,
        changePercent: -2.49,
        sparklineData: generateSparklineData()
      }
    ],
    lastUpdated: new Date().toISOString()
  };
}
