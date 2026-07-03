import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { SalesTrendPoint } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Props {
  data: SalesTrendPoint[];
  loading?: boolean;
}

export function SalesTrendChart({ data, loading }: Props) {
  const chartData = data.map((d) => ({ ...d, label: formatDate(d.period) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend (Last 60 Days)</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(250 84% 64%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(250 84% 64%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'hsl(240 5% 65%)' }}
                axisLine={false}
                tickLine={false}
                minTickGap={30}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(240 5% 65%)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(240 8% 10%)',
                  border: '1px solid hsl(240 6% 20%)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                labelStyle={{ color: 'hsl(0 0% 96%)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(250 84% 64%)" fill="url(#revenueGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
