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
import type { LegendProps } from 'recharts'
import { formatCurrency } from '@/utils/currencyUtils'
import { Building2 } from 'lucide-react'

interface SectorAllocationChartProps {
  data: { name: string; value: number; percentage: number }[]
}

const COLORS = [
  '#dbeafe',
  '#bfdbfe',
  '#93c5fd',
  '#60a5fa',
  '#3b82f6',
  '#2563eb',
  '#1d4ed8',
  '#1e40af',
]

const SectorAllocationChart: React.FC<SectorAllocationChartProps> = ({ data }) => {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="rounded-3xl shadow-sm border border-border/40 bg-white dark:bg-gray-900">
      <CardHeader className="p-8 pb-0">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-blue-700">
          <Building2 className="w-6 h-6 text-blue-600" />
          Sektorexponering
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Totalt värde: {formatCurrency(totalValue)}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <div className="h-64">
          <ResponsiveContainer>
            <RechartsPieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="65%"
                outerRadius="85%"
                paddingAngle={2}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <LabelList
                  dataKey="percentage"
                  position="inside"
                  style={{ fill: '#fff', fontSize: 12, fontWeight: 600 }}
                  formatter={(value: number) => `${value}%`}
                />
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
              <Legend
                verticalAlign="bottom"
                content={(props: LegendProps) => {
                  const payload = props.payload || []
                  return (
                    <ul className="flex flex-wrap justify-center gap-4 pt-6 text-sm">
                      {payload.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span
                            className="block w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-muted-foreground">{item.value}</span>
                          <span className="font-medium text-blue-600">
                            {item.payload?.percentage}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  )
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default SectorAllocationChart
