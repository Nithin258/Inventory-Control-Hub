import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LowStockItem } from '@/types';
import { AlertTriangle, PackageX } from 'lucide-react';

interface Props {
  data: LowStockItem[];
  loading?: boolean;
}

export function LowStockAlerts({ data, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          Low Stock Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <PackageX className="h-6 w-6" />
            All products are well-stocked
          </div>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground">{item.sku} · {item.category}</p>
                </div>
                <Badge variant={item.total_stock === 0 ? 'destructive' : 'warning'}>
                  {item.total_stock} / {item.reorder_threshold}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
