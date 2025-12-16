// Service för att hämta aktiedata via Yahoo Finance (gratis endpoint)

export type StockData = {
  symbol: string;
  price: number;
  currency: string;
  peRatio?: number;
  marketCap?: number;
  changePercent?: number;
  shortName?: string;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
};

export const fetchStockData = async (ticker: string): Promise<StockData | null> => {
  // Rensa tickern men lita på att AI:n sätter suffix (steg 1)
  const symbol = ticker.trim().toUpperCase();
  
  // Lista med olika versioner av API:et att testa om en misslyckas
  const endpoints = [
    `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${symbol}`,
    `https://query2.finance.yahoo.com/v8/finance/quote?symbols=${symbol}`,
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}` // V7 fallback
  ];

  for (const url of endpoints) {
    try {
      console.log(`Försöker hämta data från: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const result = data?.quoteResponse?.result?.[0];

        if (result) {
          return {
            symbol: result.symbol,
            price: result.regularMarketPrice,
            currency: result.currency,
            peRatio: result.trailingPE,
            marketCap: result.marketCap,
            changePercent: result.regularMarketChangePercent,
            shortName: result.shortName || result.longName,
            fiftyDayAverage: result.fiftyDayAverage,
            twoHundredDayAverage: result.twoHundredDayAverage,
          };
        }
      } else {
        console.warn(`Yahoo svarade med status ${response.status} för URL ${url}`);
      }
    } catch (error) {
      console.error(`Undantag vid anrop till Yahoo (${url}):`, error);
    }
    // Vänta lite innan nästa försök om det behövs (frivilligt)
  }

  return null;
};

export const formatStockDataForContext = (data: StockData): string => {
  const formatNum = (num?: number) => num ? num.toFixed(2) : 'N/A';
  const formatLarge = (num?: number) => {
    if (!num) return 'N/A';
    if (num > 1e9) return (num / 1e9).toFixed(2) + ' Mrd';
    if (num > 1e6) return (num / 1e6).toFixed(2) + ' M';
    return num.toString();
  };
  
  return `
--- Finansiell Data (Yahoo) för ${data.shortName || data.symbol} ---
Pris: ${formatNum(data.price)} ${data.currency} (${formatNum(data.changePercent)}%)
P/E-tal: ${formatNum(data.peRatio)}
Börsvärde: ${formatLarge(data.marketCap)} ${data.currency}
MA50: ${formatNum(data.fiftyDayAverage)}
MA200: ${formatNum(data.twoHundredDayAverage)}
-------------------------------------
`.trim();
};

