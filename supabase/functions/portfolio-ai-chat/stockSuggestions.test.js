import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureStockSuggestions } from './stockSuggestions.js';

test('excludes user-mentioned tickers not repeated by AI', async () => {
  const mockSupabase = {
    from: () => ({
      select: () => ({
        in: () => Promise.resolve({ data: [] })
      })
    })
  };

  const userMessage = 'Vad tycker du om AAPL?';
  const aiMessage = 'Jag har inget att säga om det.';

  const { message, suggestions } = await ensureStockSuggestions(
    mockSupabase,
    userMessage,
    aiMessage
  );

  assert.equal(suggestions.length, 0);
  assert.ok(message.trim().endsWith('Aktieförslag: []'));
});

