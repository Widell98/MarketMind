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

const normalizeValue = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeSymbol = (value?: string | null) => {
  const normalized = normalizeValue(value);
  return normalized ? normalized.toUpperCase() : null;
};

const normalizeName = (value?: string | null) => {
  const normalized = normalizeValue(value);
  return normalized ? normalized.toUpperCase() : null;
};

const parsePrice = (value?: string | null) => {
  if (!value) return null;
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  const price = parseFloat(normalized);
  return Number.isFinite(price) ? price : null;
};

const getSymbolVariants = (symbol: string | null) => {
  if (!symbol) return [];
  const variants = new Set<string>();
  variants.add(symbol);

  if (symbol.endsWith('.ST')) {
    variants.add(symbol.replace(/\.ST$/, ''));
  } else {
    variants.add(`${symbol}.ST`);
  }

  return Array.from(variants);
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
      range: 'Top 1000!A2:E',
    });

    const rows = sheetRes.data.values || [];
    const timestamp = new Date().toISOString();
    let updated = 0;
    let errors = 0;
    const unmatched: Array<{ symbol?: string; name?: string }> = [];

    for (const row of rows) {
      const [company, rawSymbol, , rawCurrency, rawPrice] = row;
      const rawSymbolValue = normalizeValue(rawSymbol);
      const rawNameValue = normalizeValue(company);
      const normalizedSymbol = normalizeSymbol(rawSymbolValue);
      const normalizedName = normalizeName(rawNameValue);
      const namePattern = normalizedName ? `${normalizedName}%` : null;
      const price = parsePrice(rawPrice);
      const priceCurrency = normalizeValue(rawCurrency)?.toUpperCase() || 'SEK';

      if ((!normalizedSymbol && !normalizedName) || price === null || price <= 0) {
        continue;
      }

      const symbolVariants = getSymbolVariants(normalizedSymbol);

      const updateQuery = supabase
        .from('user_holdings')
        .update({
          current_price_per_unit: price,
          price_currency: priceCurrency,
          updated_at: timestamp,
        })
        .neq('holding_type', 'cash')
        .select('id', { count: 'exact' });

      if (symbolVariants.length > 0 && namePattern) {
        updateQuery.or([
          ...symbolVariants.map((variant) => `symbol.ilike.${variant}`),
          `name.ilike.${namePattern}`,
        ].join(','));
      } else if (symbolVariants.length > 1) {
        updateQuery.or(symbolVariants.map((variant) => `symbol.ilike.${variant}`).join(','));
      } else if (symbolVariants.length === 1) {
        updateQuery.ilike('symbol', symbolVariants[0]);
      } else if (namePattern) {
        updateQuery.ilike('name', namePattern);
      } else {
        continue;
      }

      const { data: updatedRows, error: updateError, count } = await updateQuery;

      if (updateError) {
        console.error(
          `Error updating holdings for ${normalizedSymbol ?? normalizedName ?? 'unknown'}:`,
          updateError,
        );
        errors++;
        continue;
      }

      const affected = typeof count === 'number'
        ? count
        : (updatedRows?.length ?? 0);

      if (affected === 0) {
        unmatched.push({
          symbol: rawSymbolValue ?? undefined,
          name: rawNameValue ?? undefined,
        });
        console.warn(
          `No holdings matched for symbol ${rawSymbolValue ?? normalizedSymbol ?? 'N/A'} or name ${rawNameValue ?? normalizedName ?? 'N/A'}`,
        );
        continue;
      }

      updated += affected;
    }

    return new Response(
      JSON.stringify({ success: true, updated, errors, unmatched }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Portfolio update error:', error);
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

