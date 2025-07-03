
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

  try {
    // Rensa symbol från onödiga tecken
    const cleanSymbol = symbol.trim().toUpperCase();
    
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${cleanSymbol}&apikey=${alphaVantageKey}`
    );
    
    const data = await response.json();
    
    // Kontrollera om vi fick ett felmeddelande från Alpha Vantage
    if (data['Error Message']) {
      console.log(`Alpha Vantage error for ${cleanSymbol}: ${data['Error Message']}`);
      return {
        symbol: cleanSymbol,
        price: null,
        change: null,
        changePercent: null,
        volume: null,
        high: null,
        low: null,
        open: null,
        previousClose: null,
        lastUpdated: new Date().toISOString(),
        hasValidPrice: false,
        error: 'Symbol not found'
      };
    }

    // Kontrollera om vi fick rate limit eller API-fel
    if (data['Note'] && data['Note'].includes('API call frequency')) {
      console.log(`Rate limit reached for ${cleanSymbol}`);
      return getMockQuote(cleanSymbol);
    }
    
    if (!data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
      console.log(`No data for ${cleanSymbol}, checking if it's a valid symbol`);
      
      // Försök med olika varianter av symbolen
      const variations = [
        cleanSymbol,
        cleanSymbol + '.ST', // Stockholm börsen
        cleanSymbol + '.OL', // Oslo börsen
        cleanSymbol + '.CO', // Köpenhamn
      ];
      
      for (const variant of variations) {
        if (variant === cleanSymbol) continue; // Skip original
        
        try {
          const variantResponse = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${variant}&apikey=${alphaVantageKey}`
          );
          const variantData = await variantResponse.json();
          
          if (variantData['Global Quote'] && Object.keys(variantData['Global Quote']).length > 0) {
            console.log(`Found data for variant: ${variant}`);
            return parseQuoteData(variantData['Global Quote'], variant);
          }
        } catch (error) {
          console.log(`Error trying variant ${variant}:`, error);
        }
      }
      
      return {
        symbol: cleanSymbol,
        price: null,
        change: null,
        changePercent: null,
        volume: null,
        high: null,
        low: null,
        open: null,
        previousClose: null,
        lastUpdated: new Date().toISOString(),
        hasValidPrice: false,
        error: 'No price data available'
      };
    }
    
    return parseQuoteData(data['Global Quote'], cleanSymbol);
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return {
      symbol: symbol,
      price: null,
      change: null,
      changePercent: null,
      volume: null,
      high: null,
      low: null,
      open: null,
      previousClose: null,
      lastUpdated: new Date().toISOString(),
      hasValidPrice: false,
      error: 'API error'
    };
  }
}

function parseQuoteData(quote: any, symbol: string) {
  const price = parseFloat(quote['05. price'] || '0');
  const change = parseFloat(quote['09. change'] || '0');
  const changePercent = parseFloat(quote['10. change percent']?.replace('%', '') || '0');
  
  // Kontrollera om vi har giltig prisdata
  const hasValidPrice = price > 0 && !isNaN(price);
  
  return {
    symbol,
    price: hasValidPrice ? price : null,
    change: hasValidPrice ? change : null,
    changePercent: hasValidPrice ? changePercent : null,
    volume: hasValidPrice ? parseInt(quote['06. volume'] || '0') : null,
    high: hasValidPrice ? parseFloat(quote['03. high'] || '0') : null,
    low: hasValidPrice ? parseFloat(quote['04. low'] || '0') : null,
    open: hasValidPrice ? parseFloat(quote['02. open'] || '0') : null,
    previousClose: hasValidPrice ? parseFloat(quote['08. previous close'] || '0') : null,
    lastUpdated: new Date().toISOString(),
    hasValidPrice,
    currency: 'USD' // Alpha Vantage returnerar oftast USD
  };
}

function getMockQuote(symbol: string) {
  const basePrice = Math.random() * 200 + 50;
  const change = (Math.random() - 0.5) * 10;
  
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
    currency: 'USD'
  };
}
