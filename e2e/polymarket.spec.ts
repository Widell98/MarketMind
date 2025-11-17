import { test, expect } from '@playwright/test';

const mockMarkets = [
  {
    id: 'demo-market',
    question: 'Kommer KPI sjunka under 2% innan året är slut?',
    description: 'Hypotetisk marknad för att verifiera UI-flöden.',
    categories: ['Makro', 'Inflation'],
    liquidity: 15000,
    volume24h: 2500,
    closeTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    outcomes: [
      { id: 'yes', name: 'Ja', price: 0.42, probability: 0.42 },
      { id: 'no', name: 'Nej', price: 0.58, probability: 0.58 },
    ],
    url: 'https://polymarket.com',
  },
];

test.describe('Polymarket portfolio simulation', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/functions/v1/polymarket-markets', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ markets: mockMarkets, fetchedAt: new Date().toISOString(), cacheHit: false }),
      });
    });
  });

  test('user can save a market and review it in the simulated portfolio', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Upptäck heta marknader' })).toBeVisible();
    await expect(page.getByText(mockMarkets[0].question)).toBeVisible();

    const saveButton = page.getByRole('button', { name: /Spara till portfölj/i }).first();
    await saveButton.click();

    await page.getByRole('button', { name: /Polymarket-portfölj/i }).click();
    await expect(page).toHaveURL(/portfolio/i);

    await expect(page.getByText('Min Polymarket-portfölj')).toBeVisible();
    await expect(page.getByText(mockMarkets[0].question)).toBeVisible();
    await expect(page.getByText('Teoretisk PnL')).toBeVisible();
  });
});
