import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { google } from 'https://esm.sh/googleapis@118.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const googleServiceAccount = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
const googleSheetId = Deno.env.get('GOOGLE_SHEET_ID');

const normalizeValue = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

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
      range: 'Top 1000!A2:B',
    });

    const rows = sheetRes.data.values || [];
    const tickerMap = new Map<string, { name: string | null; symbol: string }>();

    for (const row of rows) {
      const [rawName, rawSymbol] = row;
      const normalizedSymbol = normalizeValue(rawSymbol)?.toUpperCase();
      if (!normalizedSymbol) {
        continue;
      }

      const normalizedName = normalizeValue(rawName);
      tickerMap.set(normalizedSymbol, {
        symbol: normalizedSymbol,
        name: normalizedName ?? null,
      });
    }

    const tickers = Array.from(tickerMap.values()).map(({ symbol, name }) => ({
      symbol,
      name: name ?? symbol,
    }));

    return new Response(
      JSON.stringify({ success: true, tickers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Sheet ticker listing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
