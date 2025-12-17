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
    // Graceful fallback for malformed CSV quotes
    console.warn('CSV parse warning: unmatched quote detected, attempting to recover');
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
  
  // Replace Swedish decimal comma with dot and remove spaces
  // Example: "10,50" -> "10.50", "1 200,00" -> "1200.00"
  const normalized = unquoted.replace(/\s/g, '').replace(/,/g, '.');
  
  const parsed = parseFloat(normalized);
  
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/**
 * Extract currency code from various formats
 * Handles: "USD/SEK", "USD", "SEK/USD" (ignored), "Amerikansk Dollar" (ignored unless mapped)
 */
const extractCurrencyCode = (cellValue: string | null | undefined): string | null => {
  if (!cellValue) return null;
  
  let trimmed = cellValue.trim().toUpperCase();
  if (!trimmed) return null;
  
  // 1. Hantera formatet "USD/SEK"
  if (trimmed.endsWith('/SEK')) {
    return trimmed.replace('/SEK', '').trim();
  }

  // 2. Hantera om det bara står "USD", "EUR" etc. (Exakt 3 bokstäver)
  // Vi undviker "SEK" eftersom vi alltid sätter den till 1 manuellt
  if (trimmed.length === 3 && trimmed !== 'SEK') {
    return trimmed;
  }

  return null;
};

/**
 * Fetch exchange rates from Google Sheets CSV
 * Returns ExchangeRates object with rates to SEK
 * * Scans the entire sheet for valid currency codes in Column B and rates in Column F.
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
    
    // Loop through ALL rows to find currencies
    for (const row of rows) {
      // Vi behöver data åtminstone fram till kolumn F (index 5)
      if (!row || row.length < 6) {
        continue;
      }
      
      // Column B (index 1) = Currency Name/Code (t.ex. "USD" eller "USD/SEK")
      const currencyCell = row[1];
      
      // Column F (index 5) = Exchange Rate Value
      const rateCell = row[5];
      
      const currency = extractCurrencyCode(currencyCell);
      const rate = parseExchangeRate(rateCell);
      
      if (currency && rate !== null) {
        exchangeRates[currency] = rate;
      }
    }
    
    // Always include SEK with rate 1
    exchangeRates.SEK = 1;
    
    console.log(`Successfully fetched ${Object.keys(exchangeRates).length} rates from sheet.`);
    
  } catch (error) {
    console.error('Error fetching exchange rates from Google Sheets:', error);
  }
  
  return exchangeRates;
};
