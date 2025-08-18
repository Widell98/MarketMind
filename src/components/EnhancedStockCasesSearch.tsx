import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, SortAsc, SortDesc, Grid3X3, List, X } from 'lucide-react';
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
  totalCount
}) => {
  const hasActiveFilters = searchTerm || selectedSector || performanceFilter;
  const clearAllFilters = () => {
    onSearchChange('');
    onSectorChange('');
    onPerformanceFilterChange('');
  };
  return <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input placeholder="Sök aktiefall, företag eller användare..." value={searchTerm} onChange={e => onSearchChange(e.target.value)} className="pl-10 pr-4" />
        {searchTerm && <Button variant="ghost" size="sm" onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Sector Filter */}
          <Select value={selectedSector || ""} onValueChange={onSectorChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Välj sektor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-sectors">Alla sektorer</SelectItem>
              {availableSectors.map(sector => <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>)}
            </SelectContent>
          </Select>

          {/* Performance Filter */}
          <Select value={performanceFilter || ""} onValueChange={onPerformanceFilterChange}>
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

          {/* Sort Options */}
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

            <Button variant="outline" size="sm" onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')} className="px-3">
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 border rounded-lg p-1">
          <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => onViewModeChange('grid')} className="px-3">
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => onViewModeChange('list')} className="px-3">
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters & Results */}
      
    </div>;
};
export default EnhancedStockCasesSearch;