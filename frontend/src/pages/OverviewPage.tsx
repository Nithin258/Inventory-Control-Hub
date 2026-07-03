import { DollarSign, Package, ShoppingCart, AlertTriangle } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart';
import { ChannelChart } from '@/components/dashboard/ChannelChart';
import { TopProductsList } from '@/components/dashboard/TopProductsList';
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts';
import { LiveActivityFeed } from '@/components/dashboard/LiveActivityFeed';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { useInventoryData } from '@/hooks/useInventoryData';

export function OverviewPage({ data }: { data: ReturnType<typeof useInventoryData> }) {
  const { revenue, trend, channelSales, topProducts, lowStock, activity, products, loading } = data;

  const totalStock = products.reduce((sum, p) => sum + p.total_stock, 0);

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
          label="Total Orders"
          value={revenue ? formatNumber(revenue.total_orders) : '—'}
          icon={ShoppingCart}
          accent="emerald"
        />
        <StatCard
          label="Units in Stock"
          value={formatNumber(totalStock)}
          icon={Package}
          accent="amber"
        />
        <StatCard
          label="Low Stock Items"
          value={formatNumber(lowStock.length)}
          icon={AlertTriangle}
          accent="rose"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesTrendChart data={trend} loading={loading} />
        </div>
        <ChannelChart data={channelSales} loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TopProductsList data={topProducts} loading={loading} />
        <LowStockAlerts data={lowStock} loading={loading} />
        <LiveActivityFeed events={activity} />
      </div>
    </div>
  );
}
