/**
 * @typedef {{name?: string, symbol: string, reason?: string}} StockSuggestion
 */

const SYMBOL_KEYS = ['symbol', 'ticker'];
const NAME_KEYS = ['name'];
const REASON_KEYS = ['reason'];

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

  const extractSuggestionsSection = (text) => {
    const marker = 'Aktieförslag:';
    const start = text.indexOf(marker);
    if (start === -1) {
      return null;
    }

    let index = start + marker.length;
    while (index < text.length && /\s/.test(text[index])) {
      index += 1;
    }

    if (index >= text.length || text[index] !== '[') {
      return null;
    }

    const jsonStart = index;
    let depth = 0;
    let inString = false;
    let escaping = false;

    for (; index < text.length; index += 1) {
      const char = text[index];

      if (inString) {
        if (escaping) {
          escaping = false;
          continue;
        }

        if (char === '\\') {
          escaping = true;
          continue;
        }

        if (char === '"') {
          inString = false;
        }

        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === '[') {
        depth += 1;
      } else if (char === ']') {
        depth -= 1;
        if (depth === 0) {
          return {
            start,
            end: index + 1,
            jsonText: text.slice(jsonStart, index + 1),
          };
        }
      }
    }

    return null;
  };

  const userTickers = extractTickers(userMessage);
  const suggestionsSection = extractSuggestionsSection(aiMessage);
  const applyLine = (line) =>
    suggestionsSection
      ? `${aiMessage.slice(0, suggestionsSection.start)}${line}${aiMessage.slice(
          suggestionsSection.end
        )}`
      : `${aiMessage.trim()}\n\n${line}`;
  let suggestions = [];
  if (suggestionsSection) {
    try {
      suggestions = JSON.parse(suggestionsSection.jsonText);
    } catch {
      suggestions = [];
    }
  }

  const normaliseSuggestion = (value) => {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const findField = (targets) => {
      for (const key of Object.keys(value)) {
        if (targets.includes(key.toLowerCase())) {
          const fieldValue = value[key];
          if (typeof fieldValue === 'string') {
            const trimmed = fieldValue.trim();
            if (trimmed) {
              return trimmed;
            }
          }
        }
      }

      return null;
    };

    const symbol = findField(SYMBOL_KEYS);

    if (!symbol) {
      return null;
    }

    const name = findField(NAME_KEYS);
    const reason = findField(REASON_KEYS);

    return {
      symbol: symbol.toUpperCase(),
      ...(name ? { name } : {}),
      ...(reason ? { reason } : {}),
    };
  };

  suggestions = suggestions
    .map(normaliseSuggestion)
    .filter((suggestion) => suggestion !== null);

  const messageWithoutSuggestions = suggestionsSection
    ? `${aiMessage.slice(0, suggestionsSection.start)}${aiMessage.slice(
        suggestionsSection.end
      )}`
    : aiMessage;
  const aiTickers = extractTickers(messageWithoutSuggestions);

  suggestions = suggestions.filter(
    (s) => aiTickers.has(s.symbol) || !userTickers.has(s.symbol)
  );

  const candidateTickers = new Set([
    ...aiTickers,
    ...suggestions.map((s) => s.symbol),
  ]);

  if (candidateTickers.size === 0) {
    const line = 'Aktieförslag: []';
    return {
      message: applyLine(line),
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

  suggestions = suggestions.filter((s) => validTickers.has(s.symbol));

  if (validTickers.size === 0) {
    const line = 'Aktieförslag: []';
    return {
      message: applyLine(line),
      suggestions: [],
    };
  }

  const suggestionMap = new Map(
    suggestions.map((suggestion) => [suggestion.symbol, suggestion])
  );

  const finalSuggestions = [];

  for (const ticker of candidateTickers) {
    if (!validTickers.has(ticker)) {
      continue;
    }

    const existing = suggestionMap.get(ticker);
    const name =
      existing && Object.prototype.hasOwnProperty.call(existing, 'name')
        ? existing.name
        : nameMap.get(ticker) || ticker;
    const reason =
      existing && Object.prototype.hasOwnProperty.call(existing, 'reason')
        ? existing.reason
        : '';

    finalSuggestions.push({ symbol: ticker, name, reason });
  }

  const line = `Aktieförslag: ${JSON.stringify(finalSuggestions)}`;
  const newMessage = applyLine(line);

  return { message: newMessage, suggestions: finalSuggestions };
};

