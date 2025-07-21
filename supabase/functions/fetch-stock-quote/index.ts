
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
    const { symbol } = await req.json();
    
    if (!symbol) {
      throw new Error('Symbol is required');
    }

    console.log(`Fetching quote for symbol: ${symbol}`);
    
    const quote = await fetchStockQuote(symbol);
    
    return new Response(JSON.stringify(quote), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchStockQuote(symbol: string) {
  if (!alphaVantageKey) {
    console.log('No Alpha Vantage key, using mock data');
    return getMockQuote(symbol);
  }

  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageKey}`
    );
    
    const data = await response.json();
    
    if (!data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
      console.log(`No data for ${symbol}, using mock data`);
      return getMockQuote(symbol);
    }
    
    const quote = data['Global Quote'];
    
    return {
      symbol,
      price: parseFloat(quote['05. price'] || '0'),
      change: parseFloat(quote['09. change'] || '0'),
      changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || '0'),
      volume: parseInt(quote['06. volume'] || '0'),
      high: parseFloat(quote['03. high'] || '0'),
      low: parseFloat(quote['04. low'] || '0'),
      open: parseFloat(quote['02. open'] || '0'),
      previousClose: parseFloat(quote['08. previous close'] || '0'),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return getMockQuote(symbol);
  }
}

function getMockQuote(symbol: string) {
  const basePrice = Math.random() * 200 + 50; // Random price between 50-250
  const change = (Math.random() - 0.5) * 10; // Random change between -5 to +5
  
  return {
    symbol,
    price: Math.round(basePrice * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round((change / basePrice) * 10000) / 100,
    volume: Math.floor(Math.random() * 1000000),
    high: Math.round((basePrice + Math.abs(change)) * 100) / 100,
    low: Math.round((basePrice - Math.abs(change)) * 100) / 100,
    open: Math.round((basePrice - change) * 100) / 100,
    previousClose: Math.round((basePrice - change) * 100) / 100,
    lastUpdated: new Date().toISOString()
  };
}
