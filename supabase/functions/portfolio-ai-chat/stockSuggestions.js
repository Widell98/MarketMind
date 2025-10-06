/**
 * @typedef {{name?: string, symbol: string, reason?: string}} StockSuggestion
 */

const SYMBOL_KEYS = ['symbol', 'ticker'];
const NAME_KEYS = ['name'];
const REASON_KEYS = ['reason'];
const INLINE_REASON_PATTERN = /^[\s]*[-–—:]\s*(.+)$/;
const FUND_NAME_PATTERN = /([A-Za-zÅÄÖåäö0-9&'’\-]+(?:\s+[A-Za-zÅÄÖåäö0-9&'’\-]+)+\s+(?:ETF|fonden))\b/gu;

function extractFundMentionsWithoutTicker(text) {
  const paragraphs = text.split(/\n{2,}/);
  const mentions = [];
  const seen = new Set();

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) {
      continue;
    }

    let match;
    while ((match = FUND_NAME_PATTERN.exec(trimmedParagraph)) !== null) {
      const rawName = match[1].trim().replace(/[,:;\-–—]+$/, '').trim();
      if (!rawName) {
        continue;
      }

      const afterMatch = trimmedParagraph.slice(
        match.index + match[1].length
      );

      if (afterMatch.trim().startsWith('(')) {
        continue;
      }

      const words = rawName.split(/\s+/).filter(Boolean);
      if (words.length < 3) {
        continue;
      }

      const suffix = words[words.length - 1];
      if (!suffix) {
        continue;
      }

      const coreWords = words.slice(0, -1);
      const trimmedCoreWords = coreWords.slice();
      while (
        trimmedCoreWords.length > 0 &&
        trimmedCoreWords[0] === trimmedCoreWords[0].toLowerCase()
      ) {
        trimmedCoreWords.shift();
      }

      if (trimmedCoreWords.length < 2) {
        continue;
      }

      const hasUppercaseWord = trimmedCoreWords.some((word) =>
        /[A-ZÅÄÖ]/.test(word)
      );
      if (!hasUppercaseWord) {
        continue;
      }

      const normalisedName = `${trimmedCoreWords.join(' ')} ${suffix}`.trim();

      const key = normalisedName.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      let reason = '';
      const reasonMatch = afterMatch.match(INLINE_REASON_PATTERN);
      if (reasonMatch && reasonMatch[1]) {
        reason = reasonMatch[1].trim();
      } else {
        const fallback = afterMatch
          .trim()
          .replace(/^[\s]*[.,;:–—-]+\s*/, '');
        if (fallback) {
          const sentenceMatch = fallback.match(
            /^(.+?)(?:(?<=[.!?])\s+|$)/u
          );
          reason = (sentenceMatch ? sentenceMatch[1] : fallback).trim();
        }
      }

      mentions.push({ name: normalisedName, reason });
    }
  }

  return mentions;
}

const escapeForILike = (value) => value.replace(/[%_\\]/g, (match) => `\\${match}`);

async function resolveFundMentionsWithoutTickers(supabase, text) {
  const mentions = extractFundMentionsWithoutTicker(text);
  const resolved = [];

  for (const mention of mentions) {
    const pattern = `%${escapeForILike(mention.name)}%`;
    const { data } = await supabase
      .from('stock_symbols')
      .select('symbol,name')
      .ilike('name', pattern);

    if (data && data.length === 1) {
      const symbol = data[0].symbol.toUpperCase();
      const inline = {};
      if (mention.name) {
        inline.name = mention.name;
      }
      if (mention.reason) {
        inline.reason = mention.reason;
      }

      resolved.push({
        symbol,
        supabaseName: data[0].name,
        inline,
      });
    }
  }

  return resolved;
}

function extractInlineSuggestions(text) {
  const result = new Map();
  const lines = text.split(/\r?\n/);
  const regex = /([\p{L}0-9][^()\n]{0,120}?)[ \t]*\(([A-Z0-9]{1,5}(?:[.-][A-Z0-9]{1,2})?)\)/gu;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      continue;
    }

    const line = trimmed.replace(/^[-*•]\s+/, '').trim();

    let match;
    while ((match = regex.exec(line)) !== null) {
      const name = match[1].trim().replace(/[-–—,:;]+$/, '').trim();
      const trailingNameMatch = name.match(/([\p{L}0-9][^,.;:]*?)$/u);
      const refinedName = trailingNameMatch ? trailingNameMatch[1].trim() : name;
      const symbol = match[2].toUpperCase();
      if (!name) {
        continue;
      }

      const remainder = line.slice(match.index + match[0].length);
      let reason = '';
      const reasonMatch = remainder.match(INLINE_REASON_PATTERN);
      if (reasonMatch && reasonMatch[1]) {
        reason = reasonMatch[1].trim();
      } else {
        const fallback = remainder.trim().replace(/^[\s]*[.,;:–—-]+\s*/, '');
        if (fallback) {
          reason = fallback.trim();
        }
      }

      let finalName = refinedName;
      if (finalName) {
        const tokens = finalName.split(/\s+/).filter(Boolean);
        while (tokens.length > 0 && tokens[0] === tokens[0].toLowerCase()) {
          tokens.shift();
        }
        if (tokens.length > 0) {
          finalName = tokens.join(' ');
        }
      }

      const payload = {};
      if (finalName) {
        payload.name = finalName;
      }
      if (reason) {
        payload.reason = reason;
      }

      if (Object.keys(payload).length > 0) {
        result.set(symbol, payload);
      } else {
        result.set(symbol, {});
      }
    }
  }

  return result;
}

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
  const inlineSuggestions = extractInlineSuggestions(messageWithoutSuggestions);
  const resolvedFundSuggestions = await resolveFundMentionsWithoutTickers(
    supabase,
    messageWithoutSuggestions
  );

  for (const { symbol, inline } of resolvedFundSuggestions) {
    if (inlineSuggestions.has(symbol)) {
      const existing = inlineSuggestions.get(symbol);
      const merged = { ...existing };
      if (
        inline.name &&
        !Object.prototype.hasOwnProperty.call(existing, 'name')
      ) {
        merged.name = inline.name;
      }
      if (
        inline.reason &&
        !Object.prototype.hasOwnProperty.call(existing, 'reason')
      ) {
        merged.reason = inline.reason;
      }
      inlineSuggestions.set(symbol, merged);
    } else {
      inlineSuggestions.set(symbol, inline);
    }
  }

  suggestions = suggestions.filter(
    (s) => aiTickers.has(s.symbol) || !userTickers.has(s.symbol)
  );

  const candidateTickers = new Set([
    ...aiTickers,
    ...suggestions.map((s) => s.symbol),
    ...resolvedFundSuggestions.map((item) => item.symbol),
  ]);

  for (const symbol of inlineSuggestions.keys()) {
    candidateTickers.add(symbol);
  }

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

  const nameMap = new Map(
    resolvedFundSuggestions.map((item) => [item.symbol, item.supabaseName])
  );
  const validTickers = new Set(
    resolvedFundSuggestions.map((item) => item.symbol)
  );

  if (data) {
    for (const row of data) {
      const symbol = row.symbol.toUpperCase();
      validTickers.add(symbol);
      nameMap.set(symbol, row.name);
    }
  }

  suggestions = suggestions.filter((s) => validTickers.has(s.symbol));

  if (validTickers.size === 0) {
    const inlineFallback = Array.from(inlineSuggestions.entries())
      .filter(([symbol]) => !userTickers.has(symbol))
      .map(([symbol, inline]) => ({
        symbol,
        name:
          inline && Object.prototype.hasOwnProperty.call(inline, 'name')
            ? inline.name
            : symbol,
        reason:
          inline && Object.prototype.hasOwnProperty.call(inline, 'reason')
            ? inline.reason
            : '',
      }));

    if (inlineFallback.length > 0) {
      const line = `Aktieförslag: ${JSON.stringify(inlineFallback)}`;
      return {
        message: applyLine(line),
        suggestions: inlineFallback,
      };
    }

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
    const inline = inlineSuggestions.get(ticker);
    const existingHasName =
      existing && Object.prototype.hasOwnProperty.call(existing, 'name');
    const inlineHasName = inline && Object.prototype.hasOwnProperty.call(inline, 'name');
    const existingHasReason =
      existing && Object.prototype.hasOwnProperty.call(existing, 'reason');
    const inlineHasReason = inline && Object.prototype.hasOwnProperty.call(inline, 'reason');

    const name = existingHasName
      ? existing.name
      : inlineHasName
      ? inline.name
      : nameMap.get(ticker) || ticker;
    const reason = existingHasReason
      ? existing.reason
      : inlineHasReason
      ? inline.reason
      : '';

    finalSuggestions.push({ symbol: ticker, name, reason });
  }

  const line = `Aktieförslag: ${JSON.stringify(finalSuggestions)}`;
  const newMessage = applyLine(line);

  return { message: newMessage, suggestions: finalSuggestions };
};

