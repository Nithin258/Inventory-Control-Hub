import { DollarSign, ShoppingBag, TrendingUp, Percent } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart';
import { ChannelChart } from '@/components/dashboard/ChannelChart';
import { TopProductsList } from '@/components/dashboard/TopProductsList';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { useInventoryData } from '@/hooks/useInventoryData';

export function SalesPage({ data }: { data: ReturnType<typeof useInventoryData> }) {
  const { revenue, trend, channelSales, topProducts, loading } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={revenue ? formatCurrency(revenue.total_revenue) : '—'}
          icon={DollarSign}
          accent="primary"
        />
        <StatCard
          label="Units Sold"
          value={revenue ? formatNumber(revenue.total_units) : '—'}
          icon={ShoppingBag}
          accent="emerald"
        />
        <StatCard
          label="Avg. Order Value"
          value={revenue ? formatCurrency(revenue.avg_order_value) : '—'}
          icon={TrendingUp}
          accent="amber"
        />
        <StatCard
          label="Total Orders"
          value={revenue ? formatNumber(revenue.total_orders) : '—'}
          icon={Percent}
          accent="rose"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesTrendChart data={trend} loading={loading} />
        </div>
        <ChannelChart data={channelSales} loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopProductsList data={topProducts} loading={loading} />

        <Card>
          <CardHeader>
            <CardTitle>Channel Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {channelSales.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm font-medium">{c.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{formatNumber(c.order_count)} orders</span>
                  <Badge variant="outline">{formatCurrency(c.revenue)}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
