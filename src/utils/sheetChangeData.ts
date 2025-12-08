/**
 * Utility for fetching Change % data from Google Sheets CSV
 */

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
 * Normalize ticker symbol for matching
 * Handles formats like: STO:INVE-B, NASDAQ:AAPL, NVDA
 */
const normalizeTicker = (ticker: string | null | undefined): string | null => {
  if (!ticker) return null;
  
  const trimmed = ticker.trim();
  if (!trimmed) return null;
  
  // Remove prefixes like STO:, NASDAQ:, etc.
  const parts = trimmed.split(':');
  const symbol = parts[parts.length - 1]?.trim().toUpperCase();
  
  return symbol && symbol.length > 0 ? symbol : trimmed.toUpperCase();
};

/**
 * Parse Change % value from CSV
 * Handles formats like: "1,18%", "−0,75%", "0,04%" (Swedish format with comma as decimal separator)
 * Also handles minus sign variants (U+2212 vs U+002D)
 */
const parseChangePercent = (value: string | null | undefined): number | null => {
  if (!value) return null;
  
  const trimmed = value.trim();
  if (!trimmed || trimmed === '#N/A') return null;
  
  // Remove quotes if present
  const unquoted = trimmed.replace(/^["']|["']$/g, '');
  
  // Remove % sign
  const withoutPercent = unquoted.replace(/%/g, '').trim();
  
  // Replace Swedish decimal comma with dot
  // Also handle minus sign variants (U+2212 MINUS SIGN vs U+002D HYPHEN-MINUS)
  const normalized = withoutPercent
    .replace(/,/g, '.')
    .replace(/\u2212/g, '-') // Replace MINUS SIGN with HYPHEN-MINUS
    .replace(/\s/g, ''); // Remove whitespace
  
  const parsed = parseFloat(normalized);
  
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Fetch Change % data from Google Sheets CSV
 * Returns a Map where key is normalized ticker symbol and value is change percent
 */
export const fetchSheetChangeData = async (): Promise<Map<string, number>> => {
  const changeDataMap = new Map<string, number>();
  
  try {
    const response = await fetch(STANDARD_SHEET_CSV_URL);
    
    if (!response.ok) {
      console.error(`Failed to fetch Google Sheets CSV: ${response.status} ${response.statusText}`);
      return changeDataMap;
    }
    
    const csvText = await response.text();
    
    if (!csvText || csvText.trim().length === 0) {
      console.error('Google Sheets CSV is empty');
      return changeDataMap;
    }
    
    const rows = parseCsv(csvText);
    
    if (rows.length === 0) {
      console.error('No rows found in Google Sheets CSV');
      return changeDataMap;
    }
    
    // First row contains headers
    const headers = rows[0].map(h => (h ?? '').trim());
    
    // Find column indices
    const tickerIdx = headers.findIndex(h => /^ticker$/i.test(h));
    const changePercentIdx = headers.findIndex(h => /change\s*%/i.test(h));
    
    if (tickerIdx === -1) {
      console.error('Ticker column not found in Google Sheets CSV');
      return changeDataMap;
    }
    
    if (changePercentIdx === -1) {
      console.error('Change % column not found in Google Sheets CSV');
      return changeDataMap;
    }
    
    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      if (!row || row.length <= Math.max(tickerIdx, changePercentIdx)) {
        continue;
      }
      
      const ticker = normalizeTicker(row[tickerIdx]);
      const changePercent = parseChangePercent(row[changePercentIdx]);
      
      if (ticker && changePercent !== null) {
        // Store normalized ticker as key
        changeDataMap.set(ticker, changePercent);
        
        // Also store with STO: prefix if it's a Swedish stock
        // This helps with matching holdings that might have STO: prefix
        if (!ticker.includes(':')) {
          changeDataMap.set(`STO:${ticker}`, changePercent);
        }
      }
    }
    
  } catch (error) {
    console.error('Error fetching Change % data from Google Sheets:', error);
  }
  
  return changeDataMap;
};

