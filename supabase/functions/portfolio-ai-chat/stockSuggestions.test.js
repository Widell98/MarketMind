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
    suggestions.map((s) => s.symbol).sort(),
    ['A1', 'BRK.B', 'RDS-A'].sort()
  );
});

test('parses suggestions containing bracketed text in reason', async () => {
  const mockSupabase = {
    from: () => ({
      select: () => ({
        in: () =>
          Promise.resolve({
            data: [{ symbol: 'MSFT', name: 'Microsoft' }]
          })
      })
    })
  };

  const userMessage = 'Finns det några tankar om MSFT?';
  const aiMessage =
    'Jag gillar utsikterna för MSFT just nu. Aktieförslag: ' +
    '[{"ticker":"MSFT","name":"Microsoft","reason":"Läs [analysen](http://example.com) här."}]';

  const { message, suggestions } = await ensureStockSuggestions(
    mockSupabase,
    userMessage,
    aiMessage
  );

  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].symbol, 'MSFT');
  assert.equal(
    suggestions[0].reason,
    'Läs [analysen](http://example.com) här.'
  );
  assert.ok(message.includes('[analysen](http://example.com)'));
  assert.ok(message.includes('Aktieförslag:'));
});

test('preserves symbol-based suggestions with reasons', async () => {
  const mockSupabase = {
    from: () => ({
      select: () => ({
        in: () =>
          Promise.resolve({
            data: [{ symbol: 'TSLA', name: 'Tesla, Inc.' }]
          })
      })
    })
  };

  const userMessage = 'Har du tankar om TSLA?';
  const aiMessage =
    'TSLA kan vara intressant just nu. Aktieförslag: ' +
    '[{"symbol":"TSLA","name":"Tesla","reason":"Stark efterfrågan"}]';

  const { message, suggestions } = await ensureStockSuggestions(
    mockSupabase,
    userMessage,
    aiMessage
  );

  assert.equal(suggestions.length, 1);
  assert.deepEqual(suggestions[0], {
    symbol: 'TSLA',
    name: 'Tesla',
    reason: 'Stark efterfrågan'
  });
  assert.ok(message.includes('"symbol":"TSLA"'));
  assert.ok(message.includes('"reason":"Stark efterfrågan"'));
});

