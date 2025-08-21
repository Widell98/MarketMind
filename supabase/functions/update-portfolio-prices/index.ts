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

        let effectivePrice: number | null = null;
        let priceCurrency: string = holding.currency;

        if (quote.hasValidPrice && quote.price) {
          effectivePrice = quote.price;
          priceCurrency = quote.currency || (holding.symbol.includes('.ST') ? 'SEK' : 'USD');
        } else {
          // Fallback: use latest daily close from our history
          const daily = await getLatestDailyPrice(holding.id);
          if (daily?.price) {
            effectivePrice = daily.price;
            priceCurrency = daily.currency || holding.currency;
            console.log(`ℹ️ Using daily fallback for ${holding.symbol}: ${effectivePrice} ${priceCurrency} (date ${daily.date})`);
          }
        }

        if (effectivePrice != null) {
          // Convert price to holding currency if needed
          let priceInHoldingCurrency = effectivePrice;
          
          if (priceCurrency === 'USD' && holding.currency === 'SEK') {
            priceInHoldingCurrency = effectivePrice * 10.5; // Approximate USD to SEK rate
          } else if (priceCurrency === 'SEK' && holding.currency === 'USD') {
            priceInHoldingCurrency = effectivePrice / 10.5; // Approximate SEK to USD rate
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

          console.log(`✅ Updated ${holding.symbol}: ${Math.round(priceInHoldingCurrency * 100) / 100} ${holding.currency}`);
          updatedCount++;
        } else {
          // Last resort: no valid price and no daily fallback, skip to conserve API quota
          console.log(`❌ No valid price or daily fallback for ${holding.symbol} - skipped`);
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
  try {
    const response = await fetch(
      `https://qifolopsdeeyrevbuxfl.supabase.co/functions/v1/fetch-stock-quote`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({ symbol })
      }
    );

    if (!response.ok) {
      console.error(`Error calling fetch-stock-quote for ${symbol}: ${response.status}`);
      return { symbol, price: null, hasValidPrice: false, currency: symbol.includes('.ST') ? 'SEK' : 'USD' };
    }

    const data = await response.json();
    
    if (data.error) {
      console.error(`fetch-stock-quote error for ${symbol}: ${data.error}`);
      return { symbol, price: null, hasValidPrice: false, currency: symbol.includes('.ST') ? 'SEK' : 'USD' };
    }

    return data;
  } catch (err) {
    console.error(`Exception calling fetch-stock-quote for ${symbol}:`, err);
    return { symbol, price: null, hasValidPrice: false, currency: symbol.includes('.ST') ? 'SEK' : 'USD' };
  }
}

async function getLatestDailyPrice(holdingId: string) {
  try {
    const { data, error } = await supabase
      .from('portfolio_performance_history')
      .select('price_per_unit, currency, date')
      .eq('holding_id', holdingId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching daily fallback price:', error);
      return null;
    }

    if (!data) return null;

    return {
      price: Number(data.price_per_unit),
      currency: data.currency as string,
      date: data.date as string,
    };
  } catch (e) {
    console.error('Exception in getLatestDailyPrice:', e);
    return null;
  }
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