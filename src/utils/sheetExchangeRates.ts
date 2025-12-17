/**
 * Utility for fetching exchange rates from Google Sheets CSV
 */

import type { ExchangeRates } from './currencyUtils';

const STANDARD_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRJZtyoepzQZSQw-LXTp0vmnpPVMqluTiPZJkPp61g5KsfEp08CA6LZ7CNoTfIgYe-E7lvCZ_ToMuF4/pub?output=csv";

// Lista på valutor vi vill importera (för att slippa få med aktier som "ABB" från samma kolumn)
const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'NOK', 'DKK', 'JPY', 'CHF', 'CAD', 'AUD'];

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
    // Tyst hantering av parse-fel
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
  const normalized = unquoted.replace(/\s/g, '').replace(/,/g, '.');
  
  const parsed = parseFloat(normalized);
  
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/**
 * Extract currency code from various formats
 */
const extractCurrencyCode = (cellValue: string | null | undefined): string | null => {
  if (!cellValue) return null;
  
  let trimmed = cellValue.trim().toUpperCase();
  if (!trimmed) return null;
  
  // Hantera formatet "USD/SEK"
  if (trimmed.endsWith('/SEK')) {
    trimmed = trimmed.replace('/SEK', '').trim();
  }

  // Filtrera så vi bara tar riktiga valutor och inte aktier
  if (ALLOWED_CURRENCIES.includes(trimmed)) {
    return trimmed;
  }

  return null;
};

/**
 * Fetch exchange rates from Google Sheets CSV
 */
export const fetchExchangeRatesFromSheet = async (): Promise<ExchangeRates> => {
  const exchangeRates: ExchangeRates = {};
  
  try {
    const response = await fetch(STANDARD_SHEET_CSV_URL, {
      cache: 'no-store',
    });
    
    if (!response.ok) return exchangeRates;
    
    const csvText = await response.text();
    
    if (!csvText || csvText.trim().length === 0) return exchangeRates;
    
    const rows = parseCsv(csvText);
    
    // Loop through ALL rows to find currencies
    rows.forEach((row) => {
      // Vi behöver data åtminstone fram till kolumn F (index 5)
      if (!row || row.length < 6) return;
      
      const currencyCell = row[1]; // Kolumn B
      const rateCell = row[5];     // Kolumn F
      
      const currency = extractCurrencyCode(currencyCell);
      
      if (currency) {
        const rate = parseExchangeRate(rateCell);
        if (rate !== null) {
          exchangeRates[currency] = rate;
        }
      }
    });
    
    // Always include SEK with rate 1
    exchangeRates.SEK = 1;
    
  } catch (error) {
    // Tyst felhantering eller minimal loggning vid behov
    console.error('Error fetching exchange rates:', error);
  }
  
  return exchangeRates;
};
