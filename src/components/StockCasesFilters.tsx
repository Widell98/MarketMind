
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Search, Filter, TrendingUp, Bookmark } from 'lucide-react';

interface StockCasesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  performanceFilter: string;
  onPerformanceFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  categories: Array<{ id: string; name: string; color: string }>;
  // New props for stock cases filter
  stockCasesViewMode?: 'all' | 'trending' | 'followed';
  onStockCasesViewModeChange?: (mode: 'all' | 'trending' | 'followed') => void;
}

const StockCasesFilters: React.FC<StockCasesFiltersProps> = ({
  searchTerm,
  onSearchChange,
  stockCasesViewMode = 'all',
  onStockCasesViewModeChange,
}) => {
  return (
    <div className="space-y-3 mb-3 sm:mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search companies, titles, or categories..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-3 py-2 text-sm rounded-md sm:pl-10 sm:py-2"
        />
      </div>

      {/* Stock Cases View Mode Filter */}
      {onStockCasesViewModeChange && (
        <div className="flex justify-center">
          <ToggleGroup
            type="single"
            value={stockCasesViewMode}
            onValueChange={(value) => {
              if (value && onStockCasesViewModeChange) {
                onStockCasesViewModeChange(value as 'all' | 'trending' | 'followed');
              }
            }}
            className="inline-flex bg-muted rounded-lg p-1"
          >
            <ToggleGroupItem
              value="all"
              aria-label="All cases"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">All Cases</span>
              <span className="sm:hidden">All</span>
            </ToggleGroupItem>
            
            <ToggleGroupItem
              value="trending"
              aria-label="Trending cases"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trending</span>
              <span className="sm:hidden">Trend</span>
            </ToggleGroupItem>
            
            <ToggleGroupItem
              value="followed"
              aria-label="Followed cases"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Followed</span>
              <span className="sm:hidden">Follow</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
    </div>
  );
};

export default StockCasesFilters;
