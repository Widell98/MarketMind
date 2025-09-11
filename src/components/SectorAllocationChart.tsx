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
import { Building2 } from 'lucide-react'

interface SectorAllocationChartProps {
  data: { name: string; value: number; percentage: number }[]
}

const COLORS = [
  '#93C5FD',
  '#6EE7B7',
  '#FCD34D',
  '#FDBA74',
  '#FCA5A5',
  '#C4B5FD',
  '#67E8F9',
  '#A3E635',
]

const SectorAllocationChart: React.FC<SectorAllocationChartProps> = ({ data }) => {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="bg-card/30 backdrop-blur-xl border-border/20 shadow-lg rounded-2xl">
      <CardHeader className="p-3 sm:p-4 md:p-6 pb-0">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Building2 className="w-5 h-5 text-primary" />
          Sektorexponering
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Totalt värde: {formatCurrency(totalValue)}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
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
                  offset={0}
                  style={{ fill: '#fff', fontSize: 12, fontWeight: 500 }}
                  formatter={(value: number) => `${value}%`}
                />
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend
                verticalAlign="bottom"
                content={({ payload }) => (
                  <ul className="flex flex-wrap justify-center gap-4 text-sm">
                    {payload?.map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span
                          className="block w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-muted-foreground">{item.value}</span>
                        <span className="font-medium">
                          {item.payload.percentage}%
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export default SectorAllocationChart
