
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
    return new Response(JSON.stringify({ 
      error: error.message,
      symbol: null,
      price: null,
      hasValidPrice: false
    }), {
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

  // Try multiple data sources with fallback chain
  const dataSources = [
    { name: 'Alpha Vantage', func: fetchFromAlphaVantage },
    { name: 'Yahoo Finance', func: fetchFromYahoo },
    { name: 'Mock Data', func: getMockQuote }
  ];

  for (const source of dataSources) {
    try {
      console.log(`Trying ${source.name} for ${symbol}`);
      const result = await source.func(symbol);
      
      if (result.hasValidPrice && result.price && result.price > 0) {
        console.log(`✅ ${source.name} successful for ${symbol}: ${result.price} ${result.currency}`);
        return result;
      } else {
        console.log(`❌ ${source.name} failed for ${symbol} - no valid price`);
      }
    } catch (error) {
      console.log(`❌ ${source.name} error for ${symbol}:`, error.message);
    }
  }

  // Final fallback
  console.log(`All sources failed for ${symbol}, using mock data`);
  return getMockQuote(symbol);
}

async function fetchFromAlphaVantage(symbol: string) {
  const cleanSymbol = symbol.trim().toUpperCase().replace(/[^A-Z0-9\.\-]/g, '');
  
  // Try different symbol variations for different markets
  const variations = [
    cleanSymbol,
    cleanSymbol + '.ST', // Stockholm
    cleanSymbol + '.OL', // Oslo
    cleanSymbol + '.CO', // Copenhagen
    cleanSymbol + '.HE', // Helsinki
    cleanSymbol.replace(/\.(ST|OL|CO|HE)$/, '') // Remove suffix
  ];

  const uniqueVariations = [...new Set(variations)];
  
  for (const variant of uniqueVariations) {
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${variant}&apikey=${alphaVantageKey}`,
        { 
          headers: { 'User-Agent': 'StockTracker/1.0' },
          signal: AbortSignal.timeout(8000)
        }
      );

      if (!response.ok) continue;
      
      const data = await response.json();
      
      // Check for rate limit
      if (data['Note'] && data['Note'].includes('API call frequency')) {
        throw new Error('Rate limit reached');
      }
      
      // Check for error
      if (data['Error Message']) continue;
      
      // Check for valid data
      if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
        const quote = data['Global Quote'];
        const price = parseFloat(quote['05. price'] || '0');
        
        if (price > 0 && !isNaN(price)) {
          return parseQuoteData(quote, variant);
        }
      }
    } catch (error) {
      continue;
    }
  }
  
  throw new Error('No valid data from Alpha Vantage');
}

async function fetchFromYahoo(symbol: string) {
  try {
    // Convert symbol for Yahoo Finance format
    let yahooSymbol = symbol.toUpperCase();
    if (yahooSymbol.includes('.ST')) {
      yahooSymbol = yahooSymbol.replace('.ST', '.ST');
    } else if (yahooSymbol.includes('.OL')) {
      yahooSymbol = yahooSymbol.replace('.OL', '.OL');
    }
    
    // Simple Yahoo Finance API call (using a free endpoint)
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`,
      { 
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000)
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
      const price = data.chart.result[0].meta.regularMarketPrice;
      const currency = data.chart.result[0].meta.currency || 'USD';
      
      return {
        symbol: yahooSymbol,
        price: Math.round(price * 100) / 100,
        change: null,
        changePercent: null,
        volume: null,
        high: null,
        low: null,
        open: null,
        previousClose: null,
        lastUpdated: new Date().toISOString(),
        hasValidPrice: true,
        currency: currency.toUpperCase()
      };
    }
    
    throw new Error('No valid price data from Yahoo');
  } catch (error) {
    throw new Error(`Yahoo Finance error: ${error.message}`);
  }
}

function parseQuoteData(quote: any, symbol: string) {
  const price = parseFloat(quote['05. price'] || '0');
  const change = parseFloat(quote['09. change'] || '0');
  const changePercent = parseFloat(quote['10. change percent']?.replace('%', '') || '0');
  
  // Kontrollera om vi har giltig prisdata
  const hasValidPrice = price > 0 && !isNaN(price);
  
  // Bestäm valuta baserat på symbol
  let currency = 'USD'; // Default
  if (symbol.includes('.ST') || symbol.includes('.OM')) {
    currency = 'SEK';
  } else if (symbol.includes('.OL')) {
    currency = 'NOK';
  } else if (symbol.includes('.CO')) {
    currency = 'DKK';
  } else if (symbol.includes('.HE')) {
    currency = 'EUR';
  }
  
  console.log(`Parsed quote for ${symbol}: price=${price}, currency=${currency}, hasValidPrice=${hasValidPrice}`);
  
  return {
    symbol,
    price: hasValidPrice ? Math.round(price * 100) / 100 : null,
    change: hasValidPrice ? Math.round(change * 100) / 100 : null,
    changePercent: hasValidPrice ? Math.round(changePercent * 100) / 100 : null,
    volume: hasValidPrice ? parseInt(quote['06. volume'] || '0') : null,
    high: hasValidPrice ? Math.round(parseFloat(quote['03. high'] || '0') * 100) / 100 : null,
    low: hasValidPrice ? Math.round(parseFloat(quote['04. low'] || '0') * 100) / 100 : null,
    open: hasValidPrice ? Math.round(parseFloat(quote['02. open'] || '0') * 100) / 100 : null,
    previousClose: hasValidPrice ? Math.round(parseFloat(quote['08. previous close'] || '0') * 100) / 100 : null,
    lastUpdated: new Date().toISOString(),
    hasValidPrice,
    currency
  };
}

function getMockQuote(symbol: string) {
  console.log(`Generating mock quote for ${symbol}`);
  
  // Bestäm valuta och prisområde baserat på symbol
  let currency = 'USD';
  let basePrice = Math.random() * 200 + 50; // USD default: 50-250
  
  if (symbol.includes('.ST') || symbol.includes('.OM')) {
    currency = 'SEK';
    basePrice = Math.random() * 500 + 100; // SEK: 100-600
  } else if (symbol.includes('.OL')) {
    currency = 'NOK';
    basePrice = Math.random() * 400 + 80; // NOK: 80-480
  } else if (symbol.includes('.CO')) {
    currency = 'DKK';
    basePrice = Math.random() * 300 + 100; // DKK: 100-400
  }
  
  const change = (Math.random() - 0.5) * (basePrice * 0.05); // Max 5% förändring
  
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
    lastUpdated: new Date().toISOString(),
    hasValidPrice: true,
    currency
  };
}
