import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { google } from 'https://esm.sh/googleapis@118.0.0';

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
      range: 'Top 1000!B2:F',
    });

    const rows = sheetRes.data.values || [];
    let updated = 0;
    let errors = 0;

    for (const row of rows) {
      const [symbol, , currency, priceStr, changeStr] = row;
      const price = parseFloat(priceStr);
      const changePercent = changeStr ? parseFloat(changeStr.replace('%', '')) : NaN;

      if (!symbol || isNaN(price)) {
        continue;
      }

      const { error } = await supabase
        .from('user_holdings')
        .upsert({
          symbol,
          current_price_per_unit: price,
          price_currency: currency || 'USD',
          change_percent: isNaN(changePercent) ? null : changePercent,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'symbol' });

      if (error) {
        console.error(`Error updating ${symbol}:`, error);
        errors++;
      } else {
        updated++;
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

