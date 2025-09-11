import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { formatCurrency } from '@/utils/currencyUtils';
import { Building2 } from 'lucide-react';

interface SectorAllocationChartProps {
  data: { name: string; value: number; percentage: number }[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

const SectorAllocationChart: React.FC<SectorAllocationChartProps> = ({ data }) => {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Building2 className="w-5 h-5 text-orange-600" />
          Sektorexponering
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Totalt värde: {formatCurrency(totalValue)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-64">
          <ResponsiveContainer>
            <RechartsPieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <LabelList dataKey="percentage" position="outside" formatter={(value: number) => `${value}%`} />
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              <Legend formatter={(value, entry: any) => `${value} ${entry.payload.percentage}%`} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SectorAllocationChart;
