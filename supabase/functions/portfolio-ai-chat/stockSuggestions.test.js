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

test('handles tickers with dots, dashes, and numbers and filters invalid ones', async () => {
  const mockSupabase = {
    from: () => ({
      select: () => ({
        in: () =>
          Promise.resolve({
            data: [
              { symbol: 'BRK.B', name: 'Berkshire Hathaway' },
              { symbol: 'RDS-A', name: 'Shell' },
              { symbol: 'A1', name: 'A1 Corp' }
            ]
          })
      })
    })
  };

  const userMessage = '';
  const aiMessage =
    'BRK.B och RDS-A kan slå A1. Aktieförslag: ' +
    '[{"name":"Berkshire","ticker":"BRK.B"},' +
    '{"name":"Shell","ticker":"RDS-A"},' +
    '{"name":"Fake","ticker":"FAKE1"}]';

  const { suggestions } = await ensureStockSuggestions(
    mockSupabase,
    userMessage,
    aiMessage
  );

  assert.deepEqual(
    suggestions.map((s) => s.ticker).sort(),
    ['A1', 'BRK.B', 'RDS-A'].sort()
  );
});

