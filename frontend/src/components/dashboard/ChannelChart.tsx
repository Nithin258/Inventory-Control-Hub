import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { ChannelSales } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  data: ChannelSales[];
  loading?: boolean;
}

export function ChannelChart({ data, loading }: Props) {
  const chartData = data.filter((d) => d.revenue > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Channel</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No sales data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(240 8% 10%)',
                  border: '1px solid hsl(240 6% 20%)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: 'hsl(240 5% 65%)', fontSize: 12 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
