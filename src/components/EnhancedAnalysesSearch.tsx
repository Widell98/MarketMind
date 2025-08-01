import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, SortAsc, SortDesc, Grid3X3, List, X } from 'lucide-react';

interface EnhancedAnalysesSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedType?: string;
  onTypeChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
  viewMode: string;
  onViewModeChange: (value: string) => void;
  resultsCount: number;
  totalCount: number;
}

const EnhancedAnalysesSearch: React.FC<EnhancedAnalysesSearchProps> = ({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewModeChange,
  resultsCount,
  totalCount
}) => {
  const hasActiveFilters = searchTerm || selectedType;

  const clearAllFilters = () => {
    onSearchChange('');
    onTypeChange('');
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'market_insight': 'Marknadsinsikt',
      'technical_analysis': 'Teknisk analys',
      'fundamental_analysis': 'Fundamental analys', 
      'sector_analysis': 'Sektoranalys',
      'portfolio_analysis': 'Portföljanalys',
      'position_analysis': 'Positionsanalys',
      'sector_deep_dive': 'Sektordjupdykning'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Sök analyser, författare eller innehåll..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Analysis Type Filter */}
          <Select value={selectedType || ""} onValueChange={onTypeChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Välj analystyp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-types">Alla typer</SelectItem>
              <SelectItem value="market_insight">Marknadsinsikt</SelectItem>
              <SelectItem value="technical_analysis">Teknisk analys</SelectItem>
              <SelectItem value="fundamental_analysis">Fundamental analys</SelectItem>
              <SelectItem value="sector_analysis">Sektoranalys</SelectItem>
              <SelectItem value="portfolio_analysis">Portföljanalys</SelectItem>
              <SelectItem value="position_analysis">Positionsanalys</SelectItem>
              <SelectItem value="sector_deep_dive">Sektordjupdykning</SelectItem>
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
                <SelectItem value="likes_count">Gillningar</SelectItem>
                <SelectItem value="views_count">Visningar</SelectItem>
                <SelectItem value="title">Titel</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3"
            >
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="px-3"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="px-3"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters & Results */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {hasActiveFilters && (
            <>
              <span className="text-sm text-muted-foreground">Aktiva filter:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Sök: {searchTerm}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSearchChange('')}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              {selectedType && (
                <Badge variant="secondary" className="gap-1">
                  {getTypeLabel(selectedType)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTypeChange('')}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Rensa alla
              </Button>
            </>
          )}
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Visar {resultsCount} av {totalCount} analyser
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalysesSearch;