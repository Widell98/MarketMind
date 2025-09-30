import React, {
  forwardRef,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChevronsUpDown, Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import useSheetTickers, { SheetTicker } from '@/hooks/useSheetTickers';
import { cn } from '@/lib/utils';

export type SheetTickersState = {
  tickers: SheetTicker[];
  isLoading: boolean;
  error: string | null;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

const DEFAULT_MAX_RESULTS = 100;

export interface TickerComboboxProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Input>, 'value' | 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
  loadingPlaceholder?: string;
  helperMessage?: string | null;
  errorMessage?: string | null;
  maxResults?: number;
  wrapperClassName?: string;
  onSheetTickersStateChange?: (state: SheetTickersState) => void;
}

const TickerCombobox = forwardRef<HTMLInputElement, TickerComboboxProps>(
  (
    {
      value,
      onValueChange,
      placeholder,
      loadingPlaceholder,
      helperMessage,
      errorMessage,
      maxResults = DEFAULT_MAX_RESULTS,
      className,
      wrapperClassName,
      onFocus,
      onBlur,
      onKeyDown,
      onSheetTickersStateChange,
      ...inputProps
    },
    ref,
  ) => {
    const { tickers, isLoading, error } = useSheetTickers();
    const deferredTickers = useDeferredValue(tickers);
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value ?? '');
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const inputRef = useRef<HTMLInputElement>(null);
    const mergedRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node ?? undefined;

        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [ref],
    );

    const [triggerWidth, setTriggerWidth] = useState<number>();

    useEffect(() => {
      const element = inputRef.current;
      if (!element || typeof ResizeObserver === 'undefined') {
        return;
      }

      setTriggerWidth(element.offsetWidth);

      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }

        const width = Math.round(entry.contentRect.width);
        setTriggerWidth(width);
      });

      observer.observe(element);

      return () => {
        observer.disconnect();
      };
    }, []);

    useEffect(() => {
      if (!onSheetTickersStateChange) {
        return;
      }

      const state: SheetTickersState = {
        tickers,
        isLoading,
        error,
      };

      onSheetTickersStateChange(state);
    }, [tickers, isLoading, error, onSheetTickersStateChange]);

    useEffect(() => {
      setSearchTerm(value ?? '');
    }, [value]);

    const filteredTickers = useMemo(() => {
      const normalizedQuery = deferredSearchTerm.trim().toLowerCase();
      if (!normalizedQuery) {
        return deferredTickers.slice(0, maxResults);
      }

      const ranked: Array<{ ticker: SheetTicker; score: number }> = [];

      deferredTickers.forEach((ticker) => {
        const symbol = ticker.symbol.toLowerCase();
        const name = ticker.name?.toLowerCase() ?? '';

        if (!symbol && !name) {
          return;
        }

        let score: number | null = null;
        if (symbol.startsWith(normalizedQuery)) {
          score = 0;
        } else if (symbol.includes(normalizedQuery)) {
          score = 1;
        } else if (name.startsWith(normalizedQuery)) {
          score = 2;
        } else if (name.includes(normalizedQuery)) {
          score = 3;
        }

        if (score !== null) {
          ranked.push({ ticker, score });
        }
      });

      ranked.sort((a, b) => {
        if (a.score !== b.score) {
          return a.score - b.score;
        }

        return a.ticker.symbol.localeCompare(b.ticker.symbol);
      });

      return ranked.slice(0, maxResults).map((entry) => entry.ticker);
    }, [deferredTickers, deferredSearchTerm, maxResults]);

    const handleInputChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.value;
        setSearchTerm(nextValue);
        onValueChange(nextValue);
        if (!open) {
          setOpen(true);
        }
      },
      [onValueChange, open],
    );

    const handleSelect = useCallback(
      (nextSymbol: string) => {
        onValueChange(nextSymbol);
        setSearchTerm(nextSymbol);
        setOpen(false);
      },
      [onValueChange],
    );

    const handleFocus = useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        setOpen(true);
        onFocus?.(event);
      },
      [onFocus],
    );

    const handleBlur = useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        onBlur?.(event);
      },
      [onBlur],
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setOpen(true);
          return;
        }

        if (event.key === 'Escape') {
          setOpen(false);
        }

        onKeyDown?.(event);
      },
      [onKeyDown],
    );

    const effectivePlaceholder = isLoading && loadingPlaceholder ? loadingPlaceholder : placeholder;

    return (
      <div className={cn('space-y-1.5', wrapperClassName)}>
        <Popover open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Input
                {...inputProps}
                ref={mergedRef}
                value={value}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={effectivePlaceholder}
                className={cn('pr-10', className)}
                autoComplete={inputProps.autoComplete ?? 'off'}
              />
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-foreground">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronsUpDown className="h-4 w-4" />
                )}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="p-0"
            style={triggerWidth ? { width: `${triggerWidth}px` } : undefined}
          >
            <Command shouldFilter={false} className="w-full">
              <CommandList>
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Laddar tickers...
                  </div>
                ) : filteredTickers.length > 0 ? (
                  <CommandGroup className="max-h-72 overflow-y-auto">
                    {filteredTickers.map((ticker) => {
                      const hasName = ticker.name && ticker.name !== ticker.symbol;
                      const hasPrice = typeof ticker.price === 'number' && Number.isFinite(ticker.price) && ticker.price > 0;
                      const priceLabel = hasPrice
                        ? `${formatPrice(ticker.price)}${ticker.currency ? ` ${ticker.currency}` : ''}`
                        : null;

                      return (
                        <CommandItem
                          key={ticker.symbol}
                          value={ticker.symbol}
                          onSelect={handleSelect}
                          className="flex items-start gap-2 py-2"
                        >
                          <div className="flex flex-col text-left">
                            <span className="font-medium text-sm">{ticker.symbol}</span>
                            {hasName && (
                              <span className="text-xs text-muted-foreground">{ticker.name}</span>
                            )}
                            {priceLabel && (
                              <span className="text-xs text-muted-foreground">{priceLabel}</span>
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Inga tickers matchar din sökning.
                  </div>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        {helperMessage && <p className="text-xs text-muted-foreground">{helperMessage}</p>}
      </div>
    );
  },
);

TickerCombobox.displayName = 'TickerCombobox';

export default TickerCombobox;

