export type ListedCompany = {
  name: string;
  symbols: string[];
  aliases?: string[];
};

// Curated subset of well-traded, publicly listed companies to validate AI output.
// Combines Swedish large/mid caps with a few global mega caps to keep the
// recommendations grounded in real, investable tickers.
export const LISTED_COMPANIES: ListedCompany[] = [
  { name: 'Volvo', symbols: ['VOLV-A', 'VOLV-B'], aliases: ['Volvo Cars', 'Volvo Car'] },
  { name: 'Atlas Copco', symbols: ['ATCO-A', 'ATCO-B'] },
  { name: 'Investor', symbols: ['INVE-A', 'INVE-B'] },
  { name: 'Sandvik', symbols: ['SAND'] },
  { name: 'Ericsson', symbols: ['ERIC-B'], aliases: ['Telefonaktiebolaget LM Ericsson'] },
  { name: 'H&M', symbols: ['HM-B'], aliases: ['Hennes & Mauritz'] },
  { name: 'Telia', symbols: ['TELIA'] },
  { name: 'Swedbank', symbols: ['SWED-A'] },
  { name: 'SEB', symbols: ['SEB-A', 'SEB-C'], aliases: ['Skandinaviska Enskilda Banken'] },
  { name: 'Nordea', symbols: ['NDA-SE'], aliases: ['Nordea Bank Abp', 'Nordea Bank'] },
  { name: 'Handelsbanken', symbols: ['SHB-A', 'SHB-B'], aliases: ['Svenska Handelsbanken'] },
  { name: 'Kinnevik', symbols: ['KINV-A', 'KINV-B'] },
  { name: 'Autoliv', symbols: ['ALIV-SDB'] },
  { name: 'Saab', symbols: ['SAAB-B'] },
  { name: 'Boliden', symbols: ['BOL'] },
  { name: 'SKF', symbols: ['SKF-A', 'SKF-B'] },
  { name: 'Getinge', symbols: ['GETI-B'] },
  { name: 'Elekta', symbols: ['EKTA-B'] },
  { name: 'SSAB', symbols: ['SSAB-A', 'SSAB-B'] },
  { name: 'Evolution Gaming', symbols: ['EVO'] },
  { name: 'ICA Gruppen', symbols: ['ICA'] },
  { name: 'Hexagon', symbols: ['HEXA-B'] },
  { name: 'ABB', symbols: ['ABB'] },
  { name: 'Securitas', symbols: ['SECU-B'] },
  { name: 'Spotify', symbols: ['SPOT'], aliases: ['Spotify Technology S.A.'] },
  { name: 'Apple', symbols: ['AAPL'] },
  { name: 'Microsoft', symbols: ['MSFT'] },
  { name: 'Alphabet', symbols: ['GOOGL', 'GOOG'] },
  { name: 'Amazon', symbols: ['AMZN'] },
  { name: 'Nvidia', symbols: ['NVDA'] },
  { name: 'Meta Platforms', symbols: ['META'], aliases: ['Meta', 'Facebook'] },
];

export const normalizeTicker = (symbol?: string) =>
  symbol?.trim().toUpperCase().replace(/\s+/g, '') ?? '';

export const hasLikelyTicker = (symbol?: string) => {
  const normalized = normalizeTicker(symbol);
  // Accept common Nordic/US ticker formats, including SDB and dual share classes
  return /^[A-Z]{1,6}(?:[-\.][A-Z0-9]{1,3})?$/.test(normalized);
};

export const isListedCompany = (name?: string, symbol?: string) => {
  const normalizedName = name?.trim().toLowerCase();
  const normalizedSymbol = normalizeTicker(symbol);

  if (!normalizedName && !normalizedSymbol) {
    return false;
  }

  for (const company of LISTED_COMPANIES) {
    const nameMatch = company.name.toLowerCase() === normalizedName;
    const aliasMatch = company.aliases?.some(alias => alias.toLowerCase() === normalizedName);
    const symbolMatch = company.symbols.some(ticker => normalizeTicker(ticker) === normalizedSymbol);

    if (nameMatch || aliasMatch || (normalizedSymbol && symbolMatch)) {
      return true;
    }
  }

  // If the AI supplies a valid-looking ticker we keep it, otherwise treat as unlisted
  return hasLikelyTicker(normalizedSymbol) && Boolean(normalizedSymbol);
};
