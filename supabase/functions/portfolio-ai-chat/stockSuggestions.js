/**
 * @typedef {{name: string, ticker: string, reason?: string}} StockSuggestion
 */

/**
 * Ensure Aktieförslag line contains only tickers mentioned by AI
 * @param {any} supabase
 * @param {string} userMessage
 * @param {string} aiMessage
 * @returns {Promise<{message: string, suggestions: StockSuggestion[]}>}
 */
export const ensureStockSuggestions = async (supabase, userMessage, aiMessage) => {
  const tickerRegex = /\b([A-Z0-9]{1,5}(?:[.-][A-Z0-9]{1,2})?)\b(?![^\[]*\])/g;

  const extractTickers = (text) => {
    const tickers = new Set();
    let match;
    while ((match = tickerRegex.exec(text)) !== null) {
      tickers.add(match[1]);
    }
    return tickers;
  };

  const userTickers = extractTickers(userMessage);
  const suggestionsMatch = aiMessage.match(/Aktieförslag:\s*(\[[^\]]*\])/);
  const parseSuggestion = (raw) => {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const symbolCandidate = typeof raw.ticker === 'string' && raw.ticker.trim().length > 0
      ? raw.ticker
      : typeof raw.symbol === 'string' && raw.symbol.trim().length > 0
        ? raw.symbol
        : null;

    if (!symbolCandidate) {
      return null;
    }

    const symbol = symbolCandidate.trim().toUpperCase();
    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    const reason = typeof raw.reason === 'string' ? raw.reason.trim() : '';

    return { symbol, name, reason };
  };

  let parsedSuggestions = [];
  if (suggestionsMatch) {
    try {
      const parsed = JSON.parse(suggestionsMatch[1]);
      if (Array.isArray(parsed)) {
        parsedSuggestions = parsed
          .map(parseSuggestion)
          .filter((value) => value !== null);
      }
    } catch {
      parsedSuggestions = [];
    }
  }

  const messageWithoutSuggestions = suggestionsMatch
    ? aiMessage.replace(suggestionsMatch[0], '')
    : aiMessage;
  const aiTickers = extractTickers(messageWithoutSuggestions);

  const filteredSuggestions = parsedSuggestions.filter(
    (suggestion) => aiTickers.has(suggestion.symbol) || !userTickers.has(suggestion.symbol)
  );

  const candidateTickers = new Set([
    ...aiTickers,
    ...filteredSuggestions.map((suggestion) => suggestion.symbol),
  ]);

  if (candidateTickers.size === 0) {
    const line = 'Aktieförslag: []';
    return {
      message: suggestionsMatch
        ? aiMessage.replace(suggestionsMatch[0], line)
        : `${aiMessage.trim()}\n\n${line}`,
      suggestions: [],
    };
  }

  const { data } = await supabase
    .from('stock_symbols')
    .select('symbol,name')
    .in('symbol', Array.from(candidateTickers));

  const nameMap = new Map();
  const validTickers = new Set();
  if (data) {
    for (const row of data) {
      const symbol = row.symbol.toUpperCase();
      validTickers.add(symbol);
      nameMap.set(symbol, row.name);
    }
  }

  if (validTickers.size === 0) {
    const line = 'Aktieförslag: []';
    return {
      message: suggestionsMatch
        ? aiMessage.replace(suggestionsMatch[0], line)
        : `${aiMessage.trim()}\n\n${line}`,
      suggestions: [],
    };
  }

  const suggestionsMap = new Map();

  for (const suggestion of filteredSuggestions) {
    if (!validTickers.has(suggestion.symbol)) continue;

    const resolvedName = suggestion.name.length > 0
      ? suggestion.name
      : nameMap.get(suggestion.symbol) || suggestion.symbol;

    const reason = suggestion.reason.length > 0 ? suggestion.reason : 'AI-rekommendation';

    suggestionsMap.set(suggestion.symbol, {
      name: resolvedName,
      symbol: suggestion.symbol,
      ticker: suggestion.symbol,
      reason,
    });
  }

  for (const ticker of validTickers) {
    if (suggestionsMap.has(ticker)) continue;

    const name = nameMap.get(ticker) || ticker;

    suggestionsMap.set(ticker, {
      name,
      symbol: ticker,
      ticker,
      reason: 'AI-rekommendation',
    });
  }

  const finalSuggestions = Array.from(suggestionsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'sv', { sensitivity: 'base' })
  );

  const line = `Aktieförslag: ${JSON.stringify(finalSuggestions)}`;
  const newMessage = suggestionsMatch
    ? aiMessage.replace(suggestionsMatch[0], line)
    : `${aiMessage.trim()}\n\n${line}`;

  return { message: newMessage, suggestions: finalSuggestions };
};

