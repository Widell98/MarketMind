
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, TrendingUp, Building2 } from 'lucide-react';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';
import { getNormalizedValue, calculateTotalPortfolioValue } from '@/utils/currencyUtils';

interface SectorExposureSectionProps {
  onQuickChat?: (message: string) => void;
}

const SectorExposureSection: React.FC<SectorExposureSectionProps> = ({ onQuickChat }) => {
  const { actualHoldings, loading } = useUserHoldings();
  const { performance } = usePortfolioPerformance();
  const { totalCash } = useCashHoldings();

  // Filter out recommendations
  const currentHoldings = actualHoldings.filter(holding => 
    holding.holding_type !== 'recommendation'
  );

  // Calculate sector exposure
  const calculateSectorExposure = () => {
    const sectorMap: { [key: string]: number } = {};
    const totalValue = calculateTotalPortfolioValue(currentHoldings);
    
    if (totalValue === 0) return {};
    
    currentHoldings.forEach(holding => {
      const sector = holding.sector || 'Okänd';
      const normalizedValue = getNormalizedValue(holding);
      sectorMap[sector] = (sectorMap[sector] || 0) + normalizedValue;
    });

    // Convert to percentages
    const sectorExposure: { [key: string]: number } = {};
    Object.entries(sectorMap).forEach(([sector, value]) => {
      sectorExposure[sector] = Math.round((value / totalValue) * 100);
    });

    return sectorExposure;
  };

  // Calculate market exposure
  const calculateMarketExposure = () => {
    const marketMap: { [key: string]: number } = {};
    const totalValue = calculateTotalPortfolioValue(currentHoldings);
    
    if (totalValue === 0) return {};
    
    currentHoldings.forEach(holding => {
      const market = holding.market || holding.currency || 'Okänd marknad';
      const normalizedValue = getNormalizedValue(holding);
      marketMap[market] = (marketMap[market] || 0) + normalizedValue;
    });

    // Convert to percentages
    const marketExposure: { [key: string]: number } = {};
    Object.entries(marketMap).forEach(([market, value]) => {
      marketExposure[market] = Math.round((value / totalValue) * 100);
    });

    return marketExposure;
  };

  const sectorExposure = calculateSectorExposure();
  const marketExposure = calculateMarketExposure();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChart className="w-5 h-5" />
            Exponering & Fördelning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">Laddar fördelning...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PieChart className="w-5 h-5 text-primary" />
          Exponering & Fördelning
        </CardTitle>
        <CardDescription className="text-sm">
          Sektorwise och marknadsfördelning av dina innehav
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sector Exposure */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-sm">Sektorexponering</h4>
          </div>
          
          {Object.keys(sectorExposure).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(sectorExposure)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 6)
                .map(([sector, percentage]) => (
                  <div key={sector} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="truncate max-w-[70%]">{sector}</span>
                      <span className="flex-shrink-0 ml-2 font-medium">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">
                Inga innehav att visa sektorexponering för
              </p>
            </div>
          )}
        </div>

        {/* Market Exposure */}
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-green-600" />
            <h4 className="font-medium text-sm">Marknadsexponering</h4>
          </div>
          
          {Object.keys(marketExposure).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(marketExposure)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 4)
                .map(([market, percentage]) => (
                  <div key={market} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="truncate max-w-[70%]">{market}</span>
                      <span className="flex-shrink-0 ml-2 font-medium">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">
                Inga innehav att visa marknadsexponering för
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SectorExposureSection;
