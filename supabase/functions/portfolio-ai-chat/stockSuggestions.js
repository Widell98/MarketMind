/**
 * @typedef {{name: string, ticker: string, reason?: string}} StockSuggestion
 */

const TICKER_REGEX = /\b([A-Z0-9]{1,6}(?:[.-][A-Z0-9]{1,3})?)\b/g;
const SUGGESTION_LINE_REGEX = /^(?:[-*•]\s*)?\*\*([^*()]+?)\s*\(([A-Z0-9]{1,6}(?:[.-][A-Z0-9]{1,3})?)\)\*\*(?:\s*[-–—:]\s*(.*))?$/i;
const ALT_SUGGESTION_LINE_REGEX = /^(?:[-*•]\s*)?\*\*([^*]+?)\*\*\s*\(([A-Z0-9]{1,6}(?:[.-][A-Z0-9]{1,3})?)\)(?:\s*[-–—:]\s*(.*))?$/i;
const GENERIC_SUGGESTION_LINE_REGEX = /^(?:[-*•]\s*)?([^*()]+?)\s*\(([A-Z0-9]{1,6}(?:[.-][A-Z0-9]{1,3})?)\)(?:\s*[-–—:]\s*(.*))?$/i;

const SUGGESTION_SECTION_REGEX = /(?:\n{0,2}\*\*?Aktieförslag\*\*?:?[\s\S]*?(?=\n{2,}|$))/gi;
const LEGACY_JSON_REGEX = /Aktieförslag:\s*\[[^\]]*\]/gi;

const BANNED_SYMBOLS = new Set(['ISK', 'KF', 'PPM', 'AP7']);
const BANNED_NAME_REGEX = /(Investeringssparkonto|Kapitalförsäkring|Fond(er)?|Index(nära)?|ETF(er)?|Sparkonto)/i;

const sanitizeReason = (reason) => {
  if (!reason) return 'AI-rekommendation';
  const trimmed = reason.trim();
  return trimmed.length > 0 ? trimmed : 'AI-rekommendation';
};

const sanitizeName = (name) => {
  if (!name) return '';
  return name
    .replace(/\*\*/g, '')
    .replace(/^(Aktie|Bolag|AB|Inc|Corp|Ltd)[\s:]/i, '')
    .replace(/[\s:](AB|Inc|Corp|Ltd)$/i, '')
    .trim();
};

const extractTickers = (text) => {
  TICKER_REGEX.lastIndex = 0;
  const tickers = new Set();
  let match;
  while ((match = TICKER_REGEX.exec(text)) !== null) {
    tickers.add(match[1].toUpperCase());
  }
  return tickers;
};

const isValidSuggestion = (name, ticker) => {
  if (!name || !ticker) return false;
  if (!/^[A-Z0-9]{1,6}(?:[.-][A-Z0-9]{1,3})?$/.test(ticker)) return false;
  if (BANNED_SYMBOLS.has(ticker.toUpperCase())) return false;
  if (name.length < 2 || name.length > 100) return false;
  if (!name.match(/[a-öA-Ö]/)) return false;
  if (BANNED_NAME_REGEX.test(name)) return false;
  return true;
};

const extractSuggestionCandidates = (message) => {
  const lines = message.split('\n');
  const suggestions = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    let match = line.match(SUGGESTION_LINE_REGEX) || line.match(ALT_SUGGESTION_LINE_REGEX);
    if (!match) {
      match = line.match(GENERIC_SUGGESTION_LINE_REGEX);
    }

    if (match) {
      const [, rawName, rawTicker, rawReason] = match;
      const name = sanitizeName(rawName);
      const ticker = rawTicker.toUpperCase();
      const reason = sanitizeReason(rawReason);
      const reasonTickers = rawReason ? Array.from(extractTickers(rawReason)) : [];

      if (isValidSuggestion(name, ticker) && !suggestions.find((s) => s.ticker === ticker)) {
        suggestions.push({ name, ticker, reason, reasonTickers });
      }
    }
  }

  return suggestions;
};

const removeExistingSuggestionBlocks = (message) => {
  return message
    .replace(LEGACY_JSON_REGEX, '')
    .replace(SUGGESTION_SECTION_REGEX, '')
    .trim();
};

const buildSuggestionBlock = (suggestions) => {
  if (suggestions.length === 0) {
    return '';
  }

  const lines = suggestions.map((suggestion) => {
    const reason = sanitizeReason(suggestion.reason);
    return `- **${suggestion.name} (${suggestion.ticker})** - ${reason}`;
  });

  return `\n\n**Aktieförslag:**\n${lines.join('\n')}`;
};

/**
 * Ensure the AI response contains a normalized Aktieförslag section.
 * @param {any} supabase
 * @param {string} userMessage
 * @param {string} aiMessage
 * @returns {Promise<{message: string, suggestions: StockSuggestion[]}>}
 */
export const ensureStockSuggestions = async (supabase, userMessage, aiMessage) => {
  const userTickers = extractTickers(userMessage);

  const suggestionCandidates = extractSuggestionCandidates(aiMessage);
  const suggestionTickers = new Set(suggestionCandidates.map((s) => s.ticker));
  const reasonTickers = new Set();

  for (const candidate of suggestionCandidates) {
    if (Array.isArray(candidate.reasonTickers)) {
      for (const ticker of candidate.reasonTickers) {
        reasonTickers.add(ticker.toUpperCase());
      }
    }
  }

  const lines = aiMessage.split('\n');
  const filteredLines = lines.filter((line) => {
    return !suggestionCandidates.some((candidate) => line.includes(candidate.ticker) && line.includes(candidate.name));
  });
  const messageWithoutSuggestionLines = filteredLines.join('\n');

  const aiTickers = extractTickers(messageWithoutSuggestionLines);

  const candidateTickers = new Set([
    ...aiTickers,
    ...suggestionTickers,
    ...reasonTickers,
  ]);

  if (candidateTickers.size === 0) {
    const cleanedMessage = removeExistingSuggestionBlocks(aiMessage);
    return { message: cleanedMessage, suggestions: [] };
  }

  const { data } = await supabase
    .from('stock_symbols')
    .select('symbol,name')
    .in('symbol', Array.from(candidateTickers));

  const nameMap = new Map();
  const validTickers = new Set();

  if (Array.isArray(data)) {
    for (const row of data) {
      if (!row?.symbol) continue;
      const symbol = row.symbol.toUpperCase();
      validTickers.add(symbol);
      if (row.name) {
        nameMap.set(symbol, row.name);
      }
    }
  }

  if (validTickers.size === 0) {
    const cleanedMessage = removeExistingSuggestionBlocks(aiMessage);
    return { message: cleanedMessage, suggestions: [] };
  }

  const prioritizedSuggestions = suggestionCandidates
    .filter((suggestion) => validTickers.has(suggestion.ticker))
    .map((suggestion) => ({
      name: suggestion.name,
      ticker: suggestion.ticker,
      reason: suggestion.reason,
    }));

  const finalSuggestions = Array.from(validTickers)
    .filter((ticker) => {
      if (suggestionTickers.has(ticker)) return true;
      if (aiTickers.has(ticker) && !userTickers.has(ticker)) return true;
      if (aiTickers.has(ticker) && suggestionTickers.has(ticker)) return true;
      return false;
    })
    .map((ticker) => {
      const existing = prioritizedSuggestions.find((s) => s.ticker === ticker);
      return existing || {
        name: nameMap.get(ticker) || ticker,
        ticker,
        reason: 'AI-rekommendation',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'sv'));

  const cleanedMessage = removeExistingSuggestionBlocks(aiMessage);
  const suggestionBlock = buildSuggestionBlock(finalSuggestions);
  const finalMessage = `${cleanedMessage}${suggestionBlock}`.trim();

  return { message: finalMessage, suggestions: finalSuggestions };
};

