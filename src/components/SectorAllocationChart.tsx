import React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { formatCurrency } from '@/utils/currencyUtils'

interface SectorAllocationChartProps {
  data: { name: string; value: number; percentage: number }[]
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#AF19FF',
  '#FF4567',
  '#8DD1E1',
  '#A4DE6C',
]

const SectorAllocationChart: React.FC<SectorAllocationChartProps> = ({ data }) => {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sektorexponering</CardTitle>
        <CardDescription>Totalt värde: {formatCurrency(totalValue)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer>
            <RechartsPieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={2}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <LabelList
                  dataKey="percentage"
                  position="inside"
                  formatter={(value: number) => `${value}%`}
                />
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default SectorAllocationChart
