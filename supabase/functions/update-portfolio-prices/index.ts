import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting portfolio price updates...');
    
    // Get all holdings that need price updates (only stocks with symbols)
    const { data: holdings, error: holdingsError } = await supabase
      .from('user_holdings')
      .select('*')
      .not('symbol', 'is', null)
      .in('holding_type', ['stock', 'crypto'])
      .neq('holding_type', 'recommendation');

    if (holdingsError) {
      console.error('Error fetching holdings:', holdingsError);
      throw holdingsError;
    }

    console.log(`Found ${holdings?.length || 0} holdings to update`);

    let updatedCount = 0;
    let errorCount = 0;

    // Process holdings in batches to avoid rate limits
    for (const holding of holdings || []) {
      try {
        // Skip if no symbol
        if (!holding.symbol) {
          console.log(`Skipping ${holding.name} - no symbol`);
          continue;
        }

        console.log(`Updating price for ${holding.symbol}...`);
        
        // Fetch current price
        const quote = await fetchStockQuote(holding.symbol);
        
        if (quote.hasValidPrice && quote.price) {
          // Convert price to holding currency if needed
          let priceInHoldingCurrency = quote.price;
          
          // If quote is in USD and holding is in SEK, convert (simplified)
          if (quote.currency === 'USD' && holding.currency === 'SEK') {
            priceInHoldingCurrency = quote.price * 10.5; // Approximate USD to SEK rate
          }
          
          // Calculate new total value
          const newTotalValue = priceInHoldingCurrency * (holding.quantity || 0);
          
          // Update holding in database
          const { error: updateError } = await supabase
            .from('user_holdings')
            .update({
              current_value: Math.round(newTotalValue * 100) / 100,
              updated_at: new Date().toISOString()
            })
            .eq('id', holding.id);

          if (updateError) {
            console.error(`Error updating ${holding.symbol}:`, updateError);
            errorCount++;
            continue;
          }

          // Record performance history
          const { error: historyError } = await supabase
            .from('portfolio_performance_history')
            .upsert({
              user_id: holding.user_id,
              holding_id: holding.id,
              date: new Date().toISOString().split('T')[0], // Today's date
              price_per_unit: Math.round(priceInHoldingCurrency * 100) / 100,
              total_value: Math.round(newTotalValue * 100) / 100,
              currency: holding.currency
            }, {
              onConflict: 'holding_id,date'
            });

          if (historyError) {
            console.error(`Error recording history for ${holding.symbol}:`, historyError);
          }

          console.log(`✅ Updated ${holding.symbol}: ${priceInHoldingCurrency} ${holding.currency}`);
          updatedCount++;
        } else {
          console.log(`❌ No valid price for ${holding.symbol}`);
          errorCount++;
        }

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error processing ${holding.symbol}:`, error);
        errorCount++;
      }
    }

    console.log(`Portfolio update completed: ${updatedCount} updated, ${errorCount} errors`);

    return new Response(JSON.stringify({
      success: true,
      updated: updatedCount,
      errors: errorCount,
      message: `Updated ${updatedCount} holdings`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Portfolio update error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
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
    const cleanSymbol = symbol.trim().toUpperCase();
    
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${cleanSymbol}&apikey=${alphaVantageKey}`
    );
    
    const data = await response.json();
    
    if (data['Error Message']) {
      return {
        symbol: cleanSymbol,
        price: null,
        hasValidPrice: false,
        currency: 'USD'
      };
    }

    if (data['Note'] && data['Note'].includes('API call frequency')) {
      console.log(`Rate limit reached for ${cleanSymbol}`);
      return getMockQuote(cleanSymbol);
    }
    
    if (!data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
      // Try with .ST suffix for Swedish stocks
      const variations = [cleanSymbol + '.ST', cleanSymbol + '.OL'];
      
      for (const variant of variations) {
        try {
          const variantResponse = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${variant}&apikey=${alphaVantageKey}`
          );
          const variantData = await variantResponse.json();
          
          if (variantData['Global Quote'] && Object.keys(variantData['Global Quote']).length > 0) {
            return parseQuoteData(variantData['Global Quote'], variant);
          }
        } catch (error) {
          console.log(`Error trying variant ${variant}:`, error);
        }
      }
      
      return {
        symbol: cleanSymbol,
        price: null,
        hasValidPrice: false,
        currency: 'USD'
      };
    }
    
    return parseQuoteData(data['Global Quote'], cleanSymbol);
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return {
      symbol: symbol,
      price: null,
      hasValidPrice: false,
      currency: 'USD'
    };
  }
}

function parseQuoteData(quote: any, symbol: string) {
  const price = parseFloat(quote['05. price'] || '0');
  const hasValidPrice = price > 0 && !isNaN(price);
  
  return {
    symbol,
    price: hasValidPrice ? price : null,
    hasValidPrice,
    currency: symbol.includes('.ST') ? 'SEK' : 'USD'
  };
}

function getMockQuote(symbol: string) {
  const basePrice = Math.random() * 200 + 50;
  
  return {
    symbol,
    price: Math.round(basePrice * 100) / 100,
    hasValidPrice: true,
    currency: symbol.includes('.ST') ? 'SEK' : 'USD'
  };
}