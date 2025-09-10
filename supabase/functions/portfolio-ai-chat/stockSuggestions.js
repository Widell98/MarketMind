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
  const tickerRegex = /(\b[A-Z]{2,5}\b)(?![^\[]*\])/g;

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

  const tickers = new Set();
  aiTickers.forEach((t) => tickers.add(t));
  suggestions.forEach((s) => tickers.add(s.ticker));

  if (tickers.size === 0) {
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
    .in('symbol', Array.from(tickers));

  const nameMap = new Map();
  if (data) {
    for (const row of data) {
      nameMap.set(row.symbol.toUpperCase(), row.name);
    }
  }

  const finalSuggestions = Array.from(tickers).map((t) => {
    const existing = suggestions.find((s) => s.ticker === t);
    return existing || { name: nameMap.get(t) || t, ticker: t, reason: existing?.reason || '' };
  });

  const line = `Aktieförslag: ${JSON.stringify(finalSuggestions)}`;
  const newMessage = suggestionsMatch
    ? aiMessage.replace(suggestionsMatch[0], line)
    : `${aiMessage.trim()}\n\n${line}`;

  return { message: newMessage, suggestions: finalSuggestions };
};

