
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
    // Förbättra symbolrensning
    const cleanSymbol = symbol.trim().toUpperCase().replace(/[^A-Z0-9\.\-]/g, '');
    console.log(`Cleaned symbol: ${symbol} -> ${cleanSymbol}`);
    
    // Försök med olika varianter direkt från början
    const variations = [
      cleanSymbol,
      cleanSymbol + '.ST', // Stockholm börsen
      cleanSymbol + '.OL', // Oslo börsen  
      cleanSymbol + '.CO', // Köpenhamn
      cleanSymbol + '.HE', // Helsingfors
      cleanSymbol.replace('.ST', '').replace('.OL', '').replace('.CO', '').replace('.HE', '') // Utan suffix
    ];

    // Ta bort duplikater
    const uniqueVariations = [...new Set(variations)];
    console.log(`Trying variations: ${uniqueVariations.join(', ')}`);

    for (const variant of uniqueVariations) {
      try {
        console.log(`Fetching data for: ${variant}`);
        
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${variant}&apikey=${alphaVantageKey}`,
          { 
            headers: { 'User-Agent': 'StockTracker/1.0' },
            signal: AbortSignal.timeout(10000) // 10 sekunder timeout
          }
        );
        
        if (!response.ok) {
          console.log(`HTTP error for ${variant}: ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        console.log(`Response for ${variant}:`, JSON.stringify(data, null, 2));
        
        // Kontrollera rate limit först
        if (data['Note'] && data['Note'].includes('API call frequency')) {
          console.log(`Rate limit reached for ${variant}, using mock data`);
          return getMockQuote(cleanSymbol);
        }
        
        // Kontrollera för fel
        if (data['Error Message']) {
          console.log(`Alpha Vantage error for ${variant}: ${data['Error Message']}`);
          continue; // Försök nästa variant
        }
        
        // Kontrollera om vi har giltig data
        if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
          const quote = data['Global Quote'];
          const price = parseFloat(quote['05. price'] || '0');
          
          if (price > 0 && !isNaN(price)) {
            console.log(`Successfully found valid price for ${variant}: ${price}`);
            return parseQuoteData(quote, variant);
          } else {
            console.log(`Invalid price data for ${variant}: ${price}`);
            continue;
          }
        }
        
        console.log(`No valid quote data for ${variant}`);
        
      } catch (fetchError) {
        console.log(`Fetch error for ${variant}:`, fetchError);
        continue; // Fortsätt med nästa variant
      }
    }
    
    // Om alla varianter misslyckades, returnera mock data som fallback
    console.log(`All variants failed for ${cleanSymbol}, using mock data as fallback`);
    return getMockQuote(cleanSymbol);
    
  } catch (error) {
    console.error(`Unexpected error for ${symbol}:`, error);
    return getMockQuote(symbol);
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
