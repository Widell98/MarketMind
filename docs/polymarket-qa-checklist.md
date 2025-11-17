# Polymarket QA- och compliance-checklista

## Åtkomst och guardrails
- [ ] Bekräfta att bannern för ålder/region visas när `VITE_POLYMARKET_REQUIRE_AGE=true` och region eller ålder blockerar användaren.
- [ ] Testa att åldersknappen uppdaterar localStorage (`polymarket-age-confirmed`) och låser upp flödet.
- [ ] Kontrollera att CTA-knappar i MarketCard och portföljen är inaktiverade när `usePolymarketEligibility.isEligible` är `false`.
- [ ] Säkerställ att disclaimer-texten “Endast simulering…” syns i både feed och portföljvy.

## Chat-integrationen
- [ ] Klicka på “Diskutera i chatten” och verifiera att chatten öppnas med marknadsnamn, sannolikheter och guardrail-text.
- [ ] Skicka ett meddelande och bekräfta att loggning av “analysis-only” context sker i Supabase loggarna.

## Portföljflöde
- [ ] Spara ett bett som inloggad användare och verifiera att posten syns i `polymarket_positions` (stake, odds, outcome).
- [ ] Kontrollera att demo-/gästläget fungerar (aktivera `VITE_POLYMARKET_ALLOW_GUEST_PORTFOLIO=true`) och att data sparas i localStorage.
- [ ] Uppdatera insats/status och säkerställ att toast visas och att optimism/felhantering fungerar.

## API-telemetri och återförsök
- [ ] Inducera ett API-fel (stoppa edge-funktionen) och observera retry/backoff-loggar i konsolen.
- [ ] Verifiera att `polymarket:metric` CustomEvent triggas för `success`, `error` och `cache-hit` i browsern.
- [ ] Kontrollera att analytics (`window.va`) får ett event med `event: feed-load` när feeden laddar klart.

## E2E-scenario (Playwright)
- [ ] Kör `npx playwright install && npm run test:e2e`.
- [ ] Bekräfta att testet `user can save a market and review it in the simulated portfolio` går igenom och att mockade marknader används.
