
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

interface InteractiveChartProps {
  data: any[];
  title: string;
  type?: 'pie' | 'bar';
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({ 
  data, 
  title, 
  type = 'pie' 
}) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>(type);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const onPieEnter = (index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name || label}</p>
          <p className="text-sm text-muted-foreground">
            Värde: {data.value?.toLocaleString('sv-SE')} SEK
          </p>
          <p className="text-sm text-muted-foreground">
            Andel: {((data.value / data.payload.total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-md shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('pie')}
              className="h-8"
            >
              <PieChartIcon className="w-4 h-4 mr-1" />
              Cirkel
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
              className="h-8"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Stapel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={(_, index) => onPieEnter(index)}
                  onMouseLeave={onPieLeave}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={colors[index % colors.length]}
                      stroke={activeIndex === index ? '#fff' : 'none'}
                      strokeWidth={activeIndex === index ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Data Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.slice(0, 4).map((item, index) => (
            <div key={index} className="text-center">
              <Badge 
                variant="secondary" 
                className="mb-1"
                style={{ backgroundColor: `${colors[index % colors.length]}20` }}
              >
                {item.name}
              </Badge>
              <div className="text-sm font-medium">{item.value.toLocaleString('sv-SE')} SEK</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveChart;
