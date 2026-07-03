import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, PackageX, CheckCircle2, RotateCw, PlusCircle } from 'lucide-react';
import type { useInventoryData } from '@/hooks/useInventoryData';

export function AlertsPage({ data }: { data: ReturnType<typeof useInventoryData> }) {
  const { lowStock, loading, adjustStock } = data;
  const [filter, setFilter] = useState<'all' | 'outOfStock' | 'critical'>('all');
  const [actionId, setActionId] = useState<number | null>(null);

  if (loading) {
    return <div className="py-24 text-center text-sm text-muted-foreground animate-pulse">Loading active alerts…</div>;
  }

  // Filter alerts
  const filteredAlerts = lowStock.filter((item) => {
    if (filter === 'outOfStock') return item.total_stock === 0;
    if (filter === 'critical') return item.total_stock > 0 && item.total_stock <= (item.reorder_threshold / 2);
    return true;
  });

  const handleRestock = async (productId: number) => {
    setActionId(productId);
    try {
      // Add 100 units to warehouse 1 (default hub) to lift it above reorder_threshold
      await adjustStock(productId, 1, 100, 'restock alert clearance');
    } catch (err) {
      console.error('Failed to restock from alerts page', err);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Control bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card/30 text-muted-foreground border-border/40 hover:bg-card/50 hover:text-white'
            }`}
          >
            All Alerts ({lowStock.length})
          </button>
          <button
            onClick={() => setFilter('outOfStock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
              filter === 'outOfStock'
                ? 'bg-rose-500 text-white border-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                : 'bg-card/30 text-muted-foreground border-border/40 hover:bg-card/50 hover:text-white'
            }`}
          >
            Out of Stock ({lowStock.filter((i) => i.total_stock === 0).length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
              filter === 'critical'
                ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-card/30 text-muted-foreground border-border/40 hover:bg-card/50 hover:text-white'
            }`}
          >
            Critical Low ({lowStock.filter((i) => i.total_stock > 0 && i.total_stock <= i.reorder_threshold / 2).length})
          </button>
        </div>

        <button
          onClick={() => data.refresh()}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border/60 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-white transition-colors self-start sm:self-auto"
        >
          <RotateCw className="h-3.5 w-3.5" /> Re-scan
        </button>
      </div>

      {lowStock.length === 0 ? (
        <Card className="bg-card/30 border border-border/40 backdrop-blur-md">
          <CardContent className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-white text-sm">Perfect Stock Levels</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                All catalog products are currently loaded above their warning thresholds. No action is required.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/40 py-20 text-muted-foreground bg-card/10">
          <PackageX className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-xs font-semibold">No alerts matching the selected filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredAlerts.map((item) => {
            const isOutOfStock = item.total_stock === 0;
            const deficiency = item.reorder_threshold - item.total_stock;

            return (
              <Card
                key={item.id}
                className={`overflow-hidden bg-card/30 border transition-all duration-300 hover:border-border/80 ${
                  isOutOfStock ? 'border-rose-500/35 hover:border-rose-500/60 bg-rose-500/[0.01]' : 'border-border/40'
                }`}
              >
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        isOutOfStock
                          ? 'bg-rose-500/15 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                          : 'bg-amber-500/15 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                      }`}
                    >
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{item.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {item.sku} · <span className="text-muted-foreground/75">{item.category}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <div className="text-left sm:text-right space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Status:</span>
                        <Badge variant={isOutOfStock ? 'destructive' : 'warning'} className="text-[10px] py-0.5">
                          {isOutOfStock ? 'CRITICAL OUT' : `${item.total_stock} left`}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Reorder point: {item.reorder_threshold} units (Shortage: {deficiency} units)
                      </p>
                    </div>

                    <button
                      onClick={() => handleRestock(item.id)}
                      disabled={actionId !== null}
                      className="ml-auto sm:ml-2 flex h-9 items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/80 disabled:opacity-50 text-xs font-bold text-primary-foreground px-3.5 transition-colors shadow-lg shadow-primary/20"
                    >
                      <PlusCircle className="h-4 w-4" />
                      {actionId === item.id ? 'Loading...' : 'Restock +100'}
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
