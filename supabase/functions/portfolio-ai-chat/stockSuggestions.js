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
  let suggestions = [];
  if (suggestionsMatch) {
    try {
      suggestions = JSON.parse(suggestionsMatch[1]);
    } catch {
      suggestions = [];
    }
  }

  const messageWithoutSuggestions = suggestionsMatch
    ? aiMessage.replace(suggestionsMatch[0], '')
    : aiMessage;
  const aiTickers = extractTickers(messageWithoutSuggestions);

  suggestions = suggestions.filter(
    (s) => aiTickers.has(s.ticker) || !userTickers.has(s.ticker)
  );

  const candidateTickers = new Set([
    ...aiTickers,
    ...suggestions.map((s) => s.ticker),
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

  suggestions = suggestions.filter((s) => validTickers.has(s.ticker));

  if (validTickers.size === 0) {
    const line = 'Aktieförslag: []';
    return {
      message: suggestionsMatch
        ? aiMessage.replace(suggestionsMatch[0], line)
        : `${aiMessage.trim()}\n\n${line}`,
      suggestions: [],
    };
  }

  const finalSuggestions = Array.from(validTickers).map((t) => {
    const existing = suggestions.find((s) => s.ticker === t);
    return (
      existing || {
        name: nameMap.get(t) || t,
        ticker: t,
        reason: existing?.reason || '',
      }
    );
  });

  const line = `Aktieförslag: ${JSON.stringify(finalSuggestions)}`;
  const newMessage = suggestionsMatch
    ? aiMessage.replace(suggestionsMatch[0], line)
    : `${aiMessage.trim()}\n\n${line}`;

  return { message: newMessage, suggestions: finalSuggestions };
};

