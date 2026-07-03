import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { TopProduct } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Flame } from 'lucide-react';

interface Props {
  data: TopProduct[];
  loading?: boolean;
}

export function TopProductsList({ data, loading }: Props) {
  const maxUnits = Math.max(...data.map((d) => d.units_sold), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-amber-400" />
          Top Selling Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No sales data yet</div>
        ) : (
          <div className="space-y-4">
            {data.slice(0, 8).map((p, idx) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-xs font-semibold text-muted-foreground">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(p.revenue)}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(p.units_sold / maxUnits) * 100}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatNumber(p.units_sold)} sold
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
