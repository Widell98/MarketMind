
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Grid, List, SortAsc, SortDesc } from 'lucide-react';

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
}

const StockCasesFilters: React.FC<StockCasesFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  performanceFilter,
  onPerformanceFilterChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewModeChange,
  categories
}) => {
  return (
    <div className="space-y-3 mb-3 sm:mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Sök bolag eller titel..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-3 py-2 text-sm rounded-md sm:pl-10 sm:py-2"
        />
      </div>

      {/* Filters Row */}
      <div className="flex gap-2 sm:gap-4 items-start sm:items-center justify-between flex-nowrap overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <div className="flex gap-2 sm:gap-3 flex-nowrap whitespace-nowrap">
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="min-w-28 max-w-[115px] sm:w-48 text-xs sm:text-sm h-8 sm:h-10 px-2">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla kategorier</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="truncate">{category.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Performance Filter */}
          <Select value={performanceFilter} onValueChange={onPerformanceFilterChange}>
            <SelectTrigger className="min-w-28 max-w-[115px] sm:w-48 text-xs sm:text-sm h-8 sm:h-10 px-2">
              <SelectValue placeholder="Utveckling" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All utveckling</SelectItem>
              <SelectItem value="positive">Positiv (+)</SelectItem>
              <SelectItem value="negative">Negativ (-)</SelectItem>
              <SelectItem value="neutral">Ingen data</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="min-w-28 max-w-[115px] sm:w-48 text-xs sm:text-sm h-8 sm:h-10 px-2">
              <SelectValue placeholder="Sortera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Skapad</SelectItem>
              <SelectItem value="performance_percentage">Utveckling</SelectItem>
              <SelectItem value="company_name">Bolagsnamn</SelectItem>
              <SelectItem value="title">Titel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 w-8 h-8 sm:p-2 sm:w-9 sm:h-9"
            aria-label="Sortera"
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onViewModeChange('grid')}
              className="rounded-none w-8 h-8 sm:w-9 sm:h-9"
              aria-label="Rutnätsvy"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onViewModeChange('list')}
              className="rounded-none w-8 h-8 sm:w-9 sm:h-9 border-l"
              aria-label="Listvy"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockCasesFilters;
