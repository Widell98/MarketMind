
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, period = '1mo' } = await req.json();
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    console.log(`Fetching historical data for symbol: ${symbol}, period: ${period}`);
    
    const historicalData = await fetchHistoricalData(symbol, period);
    
    return new Response(JSON.stringify(historicalData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchHistoricalData(symbol: string, period: string) {
  if (!alphaVantageKey) {
    console.log('No Alpha Vantage key, using mock data');
    return generateMockHistoricalData();
  }

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${alphaVantageKey}`
    );
    
    const data = await response.json();
    
    if (!data['Time Series (Daily)']) {
      console.log(`No historical data for ${symbol}, using mock data`);
      return generateMockHistoricalData();
    }
    
    const timeSeries = data['Time Series (Daily)'];
    const historicalData = [];
    
    // Get the last 30 days of data
    const sortedDates = Object.keys(timeSeries).sort().reverse().slice(0, 30);
    
    for (const date of sortedDates) {
      const dayData = timeSeries[date];
      historicalData.push({
        date,
        open: parseFloat(dayData['1. open']),
        high: parseFloat(dayData['2. high']),
        low: parseFloat(dayData['3. low']),
        close: parseFloat(dayData['4. close']),
        volume: parseInt(dayData['5. volume'])
      });
    }
    
    return historicalData.reverse(); // Return chronological order
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return generateMockHistoricalData();
  }
}

function generateMockHistoricalData() {
  const data = [];
  const basePrice = Math.random() * 200 + 50;
  let currentPrice = basePrice;
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const dailyChange = (Math.random() - 0.5) * 10; // Random change
    const open = currentPrice;
    const close = currentPrice + dailyChange;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.floor(Math.random() * 1000000)
    });
    
    currentPrice = close;
  }
  
  return data;
}
