# Testing Guide

Detta dokument beskriver teststrukturen och hur du kör testerna.

## Test Setup

Projektet använder:
- **Vitest** - Test runner
- **React Testing Library** - För att testa React komponenter
- **@testing-library/jest-dom** - För DOM assertions

## Installation

För att installera test dependencies:

```bash
npm install
```

## Köra Tester

```bash
# Kör alla tester
npm test

# Köra tester i watch mode (för utveckling)
npm test -- --watch

# Köra tester med UI
npm run test:ui

# Generera coverage report
npm run test:coverage
```

## Test Struktur

Tester ligger i `__tests__` mappar bredvid de filer de testar:

```
src/
├── utils/
│   ├── logger.ts
│   └── __tests__/
│       └── logger.test.ts
├── components/
│   ├── ErrorBoundary.tsx
│   └── __tests__/
│       └── ErrorBoundary.test.tsx
└── config/
    ├── env.ts
    └── __tests__/
        └── env.test.ts
```

## Test Utilities

Använd `src/utils/test-utils.tsx` för gemensam test setup:

```typescript
import { render } from '@testing-library/react';
import { TestWrapper } from '@/utils/test-utils';

test('my component', () => {
  render(
    <TestWrapper>
      <MyComponent />
    </TestWrapper>
  );
});
```

## Skrivna Tester

### Logger Tests (`src/utils/__tests__/logger.test.ts`)
- Testar att logger fungerar korrekt i dev/prod mode
- Verifierar att log levels fungerar som förväntat
- Kontrollerar att errors alltid loggas (även i prod)

### ErrorBoundary Tests (`src/components/__tests__/ErrorBoundary.test.tsx`)
- Testar att ErrorBoundary fångar fel korrekt
- Verifierar error UI rendering
- Kontrollerar reset funktionalitet
- Verifierar logger integration

### Env Config Tests (`src/config/__tests__/env.test.ts`)
- Verifierar env object struktur
- Kontrollerar att required fields finns

### Test Utils Tests (`src/utils/__tests__/test-utils.test.tsx`)
- Testar test utilities funktionalitet
- Verifierar TestWrapper fungerar

## Best Practices

1. **Isolera tester** - Varje test ska vara oberoende
2. **Mock externa dependencies** - Använd vi.mock() för att mocka moduler
3. **Testa beteende, inte implementation** - Fokusera på vad komponenten gör, inte hur
4. **Använd beskrivande test namn** - "should do X when Y"
5. **Cleanup** - Använd afterEach för att rensa upp

## Exempel

### Testa en React Komponent

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Testa en Hook

```typescript
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('should return expected value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current).toBeDefined();
  });
});
```

### Mocka en Modul

```typescript
import { vi } from 'vitest';

vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    log: vi.fn(),
  },
}));
```

## Coverage

För att se test coverage, kör:

```bash
npm run test:coverage
```

Detta genererar en HTML rapport i `coverage/` mappen.

## Ytterligare Resurser

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

