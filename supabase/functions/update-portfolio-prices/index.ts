import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { google } from 'https://esm.sh/googleapis@118.0.0';

// Static exchange rates for currency conversion (relative to SEK)
const EXCHANGE_RATES: Record<string, number> = {
  SEK: 1.0,
  USD: 10.5,
  EUR: 11.4,
  GBP: 13.2,
  NOK: 0.95,
  DKK: 1.53,
  JPY: 0.07,
  CHF: 11.8,
  CAD: 7.8,
  AUD: 7.0,
};

const convertToSEK = (amount: number, fromCurrency: string): number => {
  if (!amount) return 0;
  const rate = EXCHANGE_RATES[fromCurrency?.toUpperCase()] || 1;
  return amount * rate;
};

const convertFromSEK = (amountInSEK: number, toCurrency: string): number => {
  if (!amountInSEK) return 0;
  const rate = EXCHANGE_RATES[toCurrency?.toUpperCase()] || 1;
  return amountInSEK / rate;
};

const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (!amount) return 0;
  const amountInSEK = convertToSEK(amount, fromCurrency);
  return convertFromSEK(amountInSEK, toCurrency);
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const googleServiceAccount = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
const googleSheetId = Deno.env.get('GOOGLE_SHEET_ID');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!googleServiceAccount || !googleSheetId) {
      throw new Error('Missing Google Sheets configuration');
    }

    const credentials = JSON.parse(googleServiceAccount);
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId: googleSheetId,
      range: 'Top 1000!B2:E',
    });

    const rows = sheetRes.data.values || [];
    let updated = 0;
    let errors = 0;

    for (const row of rows) {
      const [symbol, , currency, priceStr] = row;
      const price = parseFloat(priceStr);

      if (!symbol || isNaN(price)) {
        continue;
      }

      // Store latest price per symbol
      const { error: priceError } = await supabase
        .from('symbol_prices')
        .upsert({
          symbol,
          price,
          currency: currency || 'USD',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'symbol' });

      if (priceError) {
        console.error(`Error storing price for ${symbol}:`, priceError);
        errors++;
        continue;
      }

      // Fetch all holdings for this symbol
      const { data: holdings, error: holdingsError } = await supabase
        .from('user_holdings')
        .select('id, user_id, quantity, currency')
        .eq('symbol', symbol);

      if (holdingsError) {
        console.error(`Error fetching holdings for ${symbol}:`, holdingsError);
        errors++;
        continue;
      }

      for (const holding of holdings || []) {
        const quantity = Number(holding.quantity) || 0;
        const holdingCurrency = holding.currency || currency || 'USD';
        const valueInHoldingCurrency = convertCurrency(price * quantity, currency || 'USD', holdingCurrency);

        const { error: updateError } = await supabase
          .from('user_holdings')
          .upsert({
            id: holding.id,
            user_id: holding.user_id,
            symbol,
            current_price_per_unit: price,
            price_currency: currency || 'USD',
            current_value: valueInHoldingCurrency,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,symbol' });

        if (updateError) {
          console.error(`Error updating holding ${holding.id} for ${symbol}:`, updateError);
          errors++;
        } else {
          updated++;
        }
      }
    }

    return new Response(
      JSON.stringify({ updated, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Portfolio update error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

