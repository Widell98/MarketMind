/**
 * Utility for fetching exchange rates from Google Sheets CSV
 */

import type { ExchangeRates } from './currencyUtils';

const STANDARD_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJZtyoepzQZSQw-LXTp0vmnpPVMqluTiPZJkPp61g5KsfEp08CA6LZ7CNoTfIgYe-E7lvCZ_ToMuF4/pub?output=csv";

/**
 * Parse CSV text handling quoted values and commas in cells
 */
const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === '"') {
      if (insideQuotes && text[index + 1] === '"') {
        currentValue += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && text[index + 1] === '\n') {
        index += 1;
      }
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  if (insideQuotes) {
    throw new Error('CSV parse error: unmatched quote');
  }

  currentRow.push(currentValue);
  rows.push(currentRow);

  return rows.filter((row) => row.some((cell) => (cell ?? '').trim().length > 0));
};

/**
 * Parse exchange rate value from CSV
 * Handles Swedish decimal format (comma as decimal separator)
 */
const parseExchangeRate = (value: string | null | undefined): number | null => {
  if (!value) return null;
  
  const trimmed = value.trim();
  if (!trimmed || trimmed === '#N/A' || trimmed === '') return null;
  
  // Remove quotes if present
  const unquoted = trimmed.replace(/^["']|["']$/g, '');
  
  // Replace Swedish decimal comma with dot
  const normalized = unquoted.replace(/,/g, '.').replace(/\s/g, '');
  
  const parsed = parseFloat(normalized);
  
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/**
 * Extract currency code from pair format "X/SEK"
 * Returns the currency code (X) or null if format is invalid
 */
const extractCurrencyFromPair = (pair: string | null | undefined): string | null => {
  if (!pair) return null;
  
  const trimmed = pair.trim().toUpperCase();
  if (!trimmed) return null;
  
  // Only process X/SEK format (not SEK/X)
  if (!trimmed.endsWith('/SEK')) return null;
  
  const currency = trimmed.replace('/SEK', '').trim();
  return currency && currency.length > 0 ? currency : null;
};

/**
 * Fetch exchange rates from Google Sheets CSV
 * Returns ExchangeRates object with rates to SEK
 * 
 * Expects currency pairs in rows 954-963 (0-indexed: 953-962 after header)
 * Column A (index 0) = currency pair (e.g., "USD/SEK")
 * Column F (index 5) = exchange rate value
 */
export const fetchExchangeRatesFromSheet = async (): Promise<ExchangeRates> => {
  const exchangeRates: ExchangeRates = {};
  
  try {
    const response = await fetch(STANDARD_SHEET_CSV_URL, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch Google Sheets CSV: ${response.status} ${response.statusText}`);
      return exchangeRates;
    }
    
    const csvText = await response.text();
    
    if (!csvText || csvText.trim().length === 0) {
      console.error('Google Sheets CSV is empty');
      return exchangeRates;
    }
    
    const rows = parseCsv(csvText);
    
    if (rows.length === 0) {
      console.error('No rows found in Google Sheets CSV');
      return exchangeRates;
    }
    
    // Rows 954-963 in spreadsheet (0-indexed: 953-962 after header row)
    // Since first row is header, data starts at index 1
    // So we need rows at index 953-962 (which is rows 954-963 in spreadsheet)
    const startRowIndex = 953; // Row 954 in spreadsheet (0-indexed: 953 after header)
    const endRowIndex = 962;   // Row 963 in spreadsheet (0-indexed: 962 after header)
    
    // Ensure we don't go beyond available rows
    const actualEndIndex = Math.min(endRowIndex, rows.length - 1);
    
    // Process currency rows
    for (let i = startRowIndex; i <= actualEndIndex; i++) {
      if (i >= rows.length) break;
      
      const row = rows[i];
      
      if (!row || row.length < 6) {
        continue;
      }
      
      // Column A (index 0) = currency pair
      const currencyPair = row[0]?.trim();
      // Column F (index 5) = exchange rate
      const rateValue = row[5]?.trim();
      
      const currency = extractCurrencyFromPair(currencyPair);
      const rate = parseExchangeRate(rateValue);
      
      if (currency && rate !== null) {
        exchangeRates[currency] = rate;
      }
    }
    
    // Always include SEK with rate 1
    exchangeRates.SEK = 1;
    
  } catch (error) {
    console.error('Error fetching exchange rates from Google Sheets:', error);
  }
  
  return exchangeRates;
};

