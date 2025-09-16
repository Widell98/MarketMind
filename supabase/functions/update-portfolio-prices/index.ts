import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { google } from 'https://esm.sh/googleapis@118.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

let supabaseClient: ReturnType<typeof createClient> | null = null;

const getSupabaseClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  return supabaseClient;
};
const googleServiceAccount = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
const googleSheetId = Deno.env.get('GOOGLE_SHEET_ID');

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

const EXCHANGE_RATES: Record<string, number> = {
  SEK: 1,
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

const convertToSEK = (amount: number, currency?: string | null) => {
  if (!Number.isFinite(amount)) {
    return null;
  }

  const normalizedCurrency = currency?.toUpperCase();

  if (!normalizedCurrency || normalizedCurrency === 'SEK') {
    return amount;
  }

  const rate = EXCHANGE_RATES[normalizedCurrency];

  if (typeof rate !== 'number') {
    console.warn(`Missing exchange rate for currency: ${normalizedCurrency}`);
    return null;
  }

  return amount * rate;
};

const parseChangePercent = (value?: string | null) => {
  if (!value) return null;

  const normalized = value
    .replace(/\s/g, '')
    .replace('%', '')
    .replace(',', '.');

  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!googleServiceAccount || !googleSheetId) {
      throw new Error('Missing Google Sheets configuration');
    }

    const supabase = getSupabaseClient();

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
      range: 'Top 1000!B2:H',
    });

    const rows = sheetRes.data.values || [];
    const timestamp = new Date().toISOString();
    let updated = 0;
    let errors = 0;
    const unmatched: Array<{ symbol?: string; name?: string }> = [];

    for (const row of rows) {
      const [company, rawSymbol, , rawCurrency, rawPrice, , rawChange] = row;
      const rawSymbolValue = normalizeValue(rawSymbol);
      const rawNameValue = normalizeValue(company);
      const normalizedSymbol = normalizeSymbol(rawSymbolValue);
      const normalizedName = normalizeName(rawNameValue);
      const namePattern = normalizedName ? `${normalizedName}%` : null;
      const price = parsePrice(rawPrice);
      const originalCurrency = normalizeValue(rawCurrency)?.toUpperCase() || null;
      const dailyChangePct = parseChangePercent(rawChange);

      let resolvedPrice = price;
      let priceCurrency = originalCurrency ?? 'SEK';

      if (price !== null) {
        const convertedPrice = convertToSEK(price, originalCurrency ?? 'SEK');

        if (convertedPrice !== null) {
          resolvedPrice = convertedPrice;
          priceCurrency = 'SEK';
        } else {
          resolvedPrice = price;
          priceCurrency = originalCurrency ?? 'SEK';
        }
      }

      if ((!normalizedSymbol && !normalizedName) || resolvedPrice === null || resolvedPrice <= 0) {
        continue;
      }

      const symbolVariants = getSymbolVariants(normalizedSymbol);

      const selectQuery = supabase
        .from('user_holdings')
        .select('id, quantity', { count: 'exact' })
        .neq('holding_type', 'cash');

      if (symbolVariants.length > 0 && namePattern) {
        selectQuery.or([
          ...symbolVariants.map((variant) => `symbol.ilike.${variant}`),
          `name.ilike.${namePattern}`,
        ].join(','));
      } else if (symbolVariants.length > 1) {
        selectQuery.or(symbolVariants.map((variant) => `symbol.ilike.${variant}`).join(','));
      } else if (symbolVariants.length === 1) {
        selectQuery.ilike('symbol', symbolVariants[0]);
      } else if (namePattern) {
        selectQuery.ilike('name', namePattern);
      } else {
        continue;
      }

      const { data: matchingHoldings, error: selectError } = await selectQuery;

      if (selectError) {
        console.error(
          `Error selecting holdings for ${normalizedSymbol ?? normalizedName ?? 'unknown'}:`,
          selectError,
        );
        errors++;
        continue;
      }

      if (!matchingHoldings || matchingHoldings.length === 0) {
        unmatched.push({
          symbol: rawSymbolValue ?? undefined,
          name: rawNameValue ?? undefined,
        });
        console.warn(
          `No holdings matched for symbol ${rawSymbolValue ?? normalizedSymbol ?? 'N/A'} or name ${rawNameValue ?? normalizedName ?? 'N/A'}`,
        );
        continue;
      }

      for (const holding of matchingHoldings) {
        const quantityValue = typeof holding.quantity === 'number'
          ? holding.quantity
          : parseFloat(String(holding.quantity ?? '').replace(',', '.'));

        const resolvedQuantity = Number.isFinite(quantityValue) ? quantityValue : 0;
        const computedValue = resolvedQuantity * (resolvedPrice ?? 0);

        const updatePayload: Record<string, unknown> = {
          current_price_per_unit: resolvedPrice,
          price_currency: priceCurrency,
          current_value: computedValue,
          updated_at: timestamp,
        };

        if (dailyChangePct !== null) {
          updatePayload.daily_change_pct = dailyChangePct;
        }

        const { error: updateError } = await supabase
          .from('user_holdings')
          .update(updatePayload)
          .eq('id', holding.id);

        if (updateError) {
          console.error(
            `Error updating holding ${holding.id} for ${normalizedSymbol ?? normalizedName ?? 'unknown'}:`,
            updateError,
          );
          errors++;
          continue;
        }

        updated += 1;
      }
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

