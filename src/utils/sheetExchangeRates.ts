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
  
  // 1. Hantera formatet "USD/SEK"
  if (trimmed.endsWith('/SEK')) {
    return trimmed.replace('/SEK', '').trim();
  }

  // 2. Hantera om det bara står "USD", "EUR" etc. (Exakt 3 bokstäver)
  if (trimmed.length === 3 && trimmed !== 'SEK') {
    return trimmed;
  }

  return null;
};

/**
 * Fetch exchange rates from Google Sheets CSV
 */
export const fetchExchangeRatesFromSheet = async (): Promise<ExchangeRates> => {
  const exchangeRates: ExchangeRates = {};
  
  console.log('--- Startar hämtning av valutakurser från Google Sheet ---');

  try {
    const response = await fetch(STANDARD_SHEET_CSV_URL, {
      cache: 'no-store',
    });
    
    // Logga statuskoden för att se om Google svarar 200 OK eller 500 Error
    console.log(`Google Sheets Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`Failed to fetch Google Sheets CSV: ${response.status} ${response.statusText}`);
      // Vid 500-fel kommer vi returnera här och inte se loggarna nedan
      return exchangeRates;
    }
    
    const csvText = await response.text();
    
    if (!csvText || csvText.trim().length === 0) {
      console.error('Google Sheets CSV is empty');
      return exchangeRates;
    }
    
    const rows = parseCsv(csvText);
    console.log(`CSV Parsed. Found ${rows.length} rows.`);
    
    if (rows.length === 0) {
      return exchangeRates;
    }
    
    // Loop through ALL rows to find currencies
    rows.forEach((row, index) => {
      // Vi behöver data åtminstone fram till kolumn F (index 5)
      if (!row || row.length < 2) return;
      
      const currencyCell = row[1]; // Kolumn B
      const rateCell = row[5];     // Kolumn F (kan vara undefined om raden är kort)
      
      const currency = extractCurrencyCode(currencyCell);
      
      // LOGGNING: Endast om vi hittar något som liknar en valuta
      if (currency) {
        const rate = parseExchangeRate(rateCell);
        console.log(`[Rad ${index + 1}] Hittade valuta: "${currency}". Råvärde kurs: "${rateCell}". Parsad kurs: ${rate}`);
        
        if (rate !== null) {
          exchangeRates[currency] = rate;
        } else {
          console.warn(`[Rad ${index + 1}] Kunde inte parsa kursen för ${currency}.`);
        }
      }
    });
    
    // Always include SEK with rate 1
    exchangeRates.SEK = 1;
    
    console.log(`Klart! Totalt antal kurser: ${Object.keys(exchangeRates).length}`);
    console.log('Kurser:', exchangeRates);
    
  } catch (error) {
    console.error('Error fetching exchange rates from Google Sheets:', error);
  }
  
  return exchangeRates;
};
