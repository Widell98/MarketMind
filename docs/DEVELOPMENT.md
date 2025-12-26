# Development Guidelines

Detta dokument innehåller guidelines och best practices för utveckling av MarketMind.

## Code Style

### TypeScript

- Använd strikta TypeScript inställningar (`strictNullChecks`, `noImplicitAny`, etc.)
- Undvik `any` - skapa korrekta typer istället
- Använd interfaces för objekt-strukturer
- Använd type aliases för unions och komplexa typer

### React

- Använd funktionella komponenter
- Använd hooks för state management
- Memoize tunga komponenter med `React.memo` där det ger värde
- Använd `useMemo` och `useCallback` för dyra beräkningar och callbacks

### Naming Conventions

- Komponenter: PascalCase (`StockCaseCard.tsx`)
- Hooks: camelCase med `use` prefix (`usePortfolio.ts`)
- Utilities: camelCase (`currencyUtils.ts`)
- Types/Interfaces: PascalCase (`StockCase`, `UserHolding`)

## Git Workflow

### Commit Messages

Använd konventionella commit messages:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

### Branches

- `main` - Production ready code
- `develop` - Development branch
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring

## Testing Guidelines

### Test Structure

- Unit tests för utilities och pure functions
- Integration tests för hooks och komplexa komponenter
- Snapshot tests för UI komponenter (sparsamt)

### Test Utilities

Använd `src/utils/test-utils.tsx` för gemensam test setup.

```typescript
import { render } from '@testing-library/react';
import { TestWrapper } from '@/utils/test-utils';

test('my component', () => {
  render(<MyComponent />, { wrapper: TestWrapper });
});
```

## Performance Best Practices

### Code Splitting

- Använd lazy loading för routes
- Dynamiska imports för stora bibliotek

### Memoization

- `React.memo` för komponenter som renderas ofta med samma props
- `useMemo` för dyra beräkningar
- `useCallback` för callbacks som skickas som props

### React Query

- Använd `staleTime` och `cacheTime` för att optimera requests
- Använd `refetchOnWindowFocus: false` där det är lämpligt

## Error Handling

### Error Logging

Använd logger utility istället för console statements:

```typescript
import { logger } from '@/utils/logger';

try {
  // code
} catch (error) {
  logger.error('Operation failed', error);
}
```

### Error Boundaries

Komponenter som kan krascha ska wrappas i ErrorBoundary. Se `src/components/ErrorBoundary.tsx`.

## Environment Variables

- Alla miljövariabler måste prefixas med `VITE_` för att exponeras i klienten
- Använd `src/config/env.ts` för typ-säker access till env-variabler
- Lägg aldrig till `.env` filen i git

## Documentation

### Code Comments

- JSDoc comments för publika funktioner och komponenter
- Inline comments för komplex logik
- Kommentera "varför", inte "vad"

```typescript
/**
 * Calculates portfolio performance metrics
 * @param holdings - Array of user holdings
 * @returns Performance data including total value and return
 */
function calculatePerformance(holdings: UserHolding[]): PerformanceData {
  // Implementation
}
```

## Security

- Använd aldrig hårdkodade API-nycklar i koden
- Validera all user input
- Använd parameterized queries för database operations
- Implementera proper authentication och authorization

## Performance Monitoring

- Använd React DevTools Profiler för att identifiera performance issues
- Monitor bundle size med `npm run build`
- Använd Lighthouse för performance audits

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Supabase Documentation](https://supabase.com/docs)

