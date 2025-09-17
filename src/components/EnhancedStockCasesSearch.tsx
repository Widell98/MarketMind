import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, SortAsc, SortDesc, Grid3X3, List, X } from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface EnhancedStockCasesSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedSector?: string;
  onSectorChange: (value: string) => void;
  performanceFilter?: string;
  onPerformanceFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
  viewMode: string;
  onViewModeChange: (value: string) => void;
  availableSectors: string[];
  resultsCount: number;
  totalCount: number;
}

const getPerformanceLabel = (value: string) => {
  switch (value) {
    case 'positive':
      return 'Positiva (+)';
    case 'negative':
      return 'Negativa (-)';
    case 'high':
      return 'Höga (>10%)';
    case 'low':
      return 'Låga (<5%)';
    default:
      return value;
  }
};

const EnhancedStockCasesSearch: React.FC<EnhancedStockCasesSearchProps> = ({
  searchTerm,
  onSearchChange,
  selectedSector,
  onSectorChange,
  performanceFilter,
  onPerformanceFilterChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewModeChange,
  availableSectors,
  resultsCount,
  totalCount,
}) => {
  const normalizedSector = selectedSector && selectedSector !== 'all-sectors' ? selectedSector : '';
  const normalizedPerformance =
    performanceFilter && performanceFilter !== 'all-results' ? performanceFilter : '';
  const hasActiveFilters = Boolean(searchTerm || normalizedSector || normalizedPerformance);
  const filtersCount = [searchTerm, normalizedSector, normalizedPerformance].filter(Boolean).length;

  const clearAllFilters = () => {
    onSearchChange('');
    onSectorChange('');
    onPerformanceFilterChange('');
  };

  const ViewModeToggle = ({ className }: { className?: string }) => (
    <div
      className={cn(
        'flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-1 shadow-sm',
        className,
      )}
    >
      <Button
        type="button"
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        aria-pressed={viewMode === 'grid'}
        onClick={() => onViewModeChange('grid')}
        className="px-3"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        aria-pressed={viewMode === 'list'}
        onClick={() => onViewModeChange('list')}
        className="px-3"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Sök aktiefall, företag eller användare..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="flex flex-1 items-center justify-between gap-2 rounded-xl border-border/70 bg-card/80 py-2 pl-3 pr-3 text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </span>
                {filtersCount > 0 && (
                  <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary/90 px-2 text-xs font-semibold text-primary-foreground">
                    {filtersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="h-auto max-h-[85vh] rounded-t-3xl border-t border-border/60 bg-background px-6 pb-6"
            >
              <SheetHeader>
                <SheetTitle>Filtrera aktiefall</SheetTitle>
                <SheetDescription>Finjustera listan för att hitta rätt inspiration.</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sektor</p>
                    <Select value={selectedSector || ''} onValueChange={onSectorChange}>
                      <SelectTrigger className="mt-2 w-full">
                        <SelectValue placeholder="Välj sektor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-sectors">Alla sektorer</SelectItem>
                        {availableSectors.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Prestanda</p>
                    <Select value={performanceFilter || ''} onValueChange={onPerformanceFilterChange}>
                      <SelectTrigger className="mt-2 w-full">
                        <SelectValue placeholder="Prestanda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-results">Alla resultat</SelectItem>
                        <SelectItem value="positive">Positiva (+)</SelectItem>
                        <SelectItem value="negative">Negativa (-)</SelectItem>
                        <SelectItem value="high">Höga (&gt;10%)</SelectItem>
                        <SelectItem value="low">Låga (&lt;5%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sortera efter</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Select value={sortBy} onValueChange={onSortChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sortera" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_at">Senaste</SelectItem>
                          <SelectItem value="performance">Prestanda</SelectItem>
                          <SelectItem value="likes">Gillningar</SelectItem>
                          <SelectItem value="title">Titel</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="h-10 w-10 flex-shrink-0"
                        aria-label={sortOrder === 'asc' ? 'Sortera fallande' : 'Sortera stigande'}
                      >
                        {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Visa som</p>
                    <ViewModeToggle className="mt-2 w-full justify-between" />
                  </div>
                </div>
              </div>

              <SheetFooter className="mt-6 gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="justify-start px-0 text-muted-foreground hover:text-foreground"
                  onClick={clearAllFilters}
                >
                  Rensa filter
                </Button>
                <SheetClose asChild>
                  <Button type="button" className="w-full">
                    Visa resultat
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <ViewModeToggle className="ml-auto" />
        </div>
      </div>

      <div className="hidden items-start justify-between gap-3 sm:flex">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <Select value={selectedSector || ''} onValueChange={onSectorChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Välj sektor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-sectors">Alla sektorer</SelectItem>
              {availableSectors.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={performanceFilter || ''} onValueChange={onPerformanceFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Prestanda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-results">Alla resultat</SelectItem>
              <SelectItem value="positive">Positiva (+)</SelectItem>
              <SelectItem value="negative">Negativa (-)</SelectItem>
              <SelectItem value="high">Höga (&gt;10%)</SelectItem>
              <SelectItem value="low">Låga (&lt;5%)</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Sortera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Senaste</SelectItem>
                <SelectItem value="performance">Prestanda</SelectItem>
                <SelectItem value="likes">Gillningar</SelectItem>
                <SelectItem value="title">Titel</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3"
              aria-label={sortOrder === 'asc' ? 'Sortera fallande' : 'Sortera stigande'}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <ViewModeToggle />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters ? (
            <>
              <span className="text-sm text-muted-foreground">Aktiva filter:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Sök: {searchTerm}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onSearchChange('')}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {normalizedSector && (
                <Badge variant="secondary" className="gap-1">
                  {normalizedSector}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onSectorChange('')}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {normalizedPerformance && (
                <Badge variant="secondary" className="gap-1">
                  {getPerformanceLabel(normalizedPerformance)}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onPerformanceFilterChange('')}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Rensa alla
              </Button>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              Använd filtren för att hitta rätt aktiefall.
            </span>
          )}
        </div>

        <div className="text-sm text-muted-foreground sm:text-right">
          Visar {resultsCount} av {totalCount} aktiefall
        </div>
      </div>
    </div>
  );
};

export default EnhancedStockCasesSearch;
