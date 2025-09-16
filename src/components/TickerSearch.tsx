import React, { useEffect, useMemo, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTickerSearch } from '@/hooks/useTickerSearch';
import type { TickerSearchResult } from '@/types/ticker';
import { cn } from '@/lib/utils';

interface TickerSearchProps {
  onSelect: (result: TickerSearchResult) => void;
  children?: React.ReactNode;
  initialQuery?: string;
  className?: string;
}

const TickerSearch: React.FC<TickerSearchProps> = ({
  onSelect,
  children,
  initialQuery,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { results, loading, error, searchTickers, clearResults } = useTickerSearch();

  const trimmedTerm = useMemo(() => searchTerm.trim(), [searchTerm]);

  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      clearResults();
      return;
    }

    if (initialQuery && initialQuery.trim().length >= 2) {
      setSearchTerm(initialQuery);
      searchTickers(initialQuery);
    } else if (initialQuery) {
      setSearchTerm(initialQuery);
    }
  }, [open, initialQuery, searchTickers, clearResults]);

  useEffect(() => {
    if (!open) return;

    const handler = window.setTimeout(() => {
      if (trimmedTerm.length >= 2) {
        searchTickers(trimmedTerm);
      }
    }, 400);

    return () => window.clearTimeout(handler);
  }, [trimmedTerm, searchTickers, open]);

  const handleSelect = (result: TickerSearchResult) => {
    onSelect(result);
    setOpen(false);
    setSearchTerm('');
    clearResults();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ?? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn('flex items-center gap-2', className)}
          >
            <Search className="w-4 h-4" />
            <span>Sök ticker</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput
            value={searchTerm}
            onValueChange={setSearchTerm}
            autoFocus
            placeholder="Sök efter företagsnamn eller ticker..."
          />
          <CommandList>
            {trimmedTerm.length >= 2 && !loading && (
              <CommandEmpty>Inga träffar för "{searchTerm}"</CommandEmpty>
            )}
            {trimmedTerm.length < 2 ? (
              <div className="py-6 px-4 text-sm text-muted-foreground text-center">
                Skriv minst två tecken för att söka efter aktier och fonder.
              </div>
            ) : loading ? (
              <div className="py-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Söker tickers...
              </div>
            ) : results.length > 0 ? (
              <CommandGroup heading="Förslag">
                {results.map((result) => (
                  <CommandItem
                    key={result.symbol}
                    value={result.symbol}
                    onSelect={() => handleSelect(result)}
                    className="flex flex-col items-start gap-1"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="font-medium text-sm text-foreground">{result.symbol}</span>
                      <span className="text-[11px] uppercase text-muted-foreground">
                        {[result.exchange, result.region, result.currency]
                          .filter(Boolean)
                          .join(' • ')}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {result.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <div className="py-6 px-4 text-sm text-muted-foreground text-center">
                Inga resultat hittades för "{searchTerm}". Testa ett annat namn eller ticker.
              </div>
            )}
          </CommandList>
        </Command>
        {error && (
          <div className="border-t border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default TickerSearch;
