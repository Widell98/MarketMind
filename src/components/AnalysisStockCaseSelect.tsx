
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useStockCases } from '@/hooks/useStockCases';

interface AnalysisStockCaseSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const AnalysisStockCaseSelect = ({ value, onValueChange, disabled }: AnalysisStockCaseSelectProps) => {
  const { stockCases, loading } = useStockCases();

  return (
    <div>
      <Label htmlFor="stockCase">Koppla till aktiecase (valfritt)</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Laddar aktiecases..." : "Välj ett aktiecase att koppla till"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="no-case">Ingen koppling</SelectItem>
          {stockCases.map((stockCase) => (
            <SelectItem key={stockCase.id} value={stockCase.id}>
              {stockCase.title} - {stockCase.company_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AnalysisStockCaseSelect;
