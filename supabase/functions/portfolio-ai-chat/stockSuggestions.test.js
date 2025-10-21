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
  assert.ok(!/Aktieförslag/i.test(message));
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
  const aiMessage = [
    'BRK.B och RDS-A kan slå A1.',
    '',
    '**Aktieförslag:**',
    '- **Berkshire Hathaway (BRK.B)** - Stark balansräkning',
    '- **Shell (RDS-A)** - Stabil utdelare',
    '- **Fake Corp (FAKE1)** - Ogiltig'
  ].join('\n');

  const { suggestions, message } = await ensureStockSuggestions(
    mockSupabase,
    userMessage,
    aiMessage
  );

  assert.deepEqual(
    suggestions.map((s) => s.ticker).sort(),
    ['A1', 'BRK.B', 'RDS-A'].sort()
  );

  assert.match(message, /\*\*Aktieförslag:\*\*/);
  assert.match(message, /\*\*Berkshire Hathaway \(BRK\.B\)\*\*/);
});

