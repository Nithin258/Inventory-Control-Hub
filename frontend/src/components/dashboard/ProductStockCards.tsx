import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Package, Plus, ShieldAlert, SlidersHorizontal, Warehouse, X } from 'lucide-react';

interface Props {
  products: Product[];
  loading?: boolean;
  flashIds?: Set<number>;
  onAdjustStock?: (productId: number, warehouseId: number, change: number) => Promise<void>;
}

function stockVariant(stock: number, threshold: number) {
  if (stock === 0) return 'destructive';
  if (stock <= threshold) return 'warning';
  return 'success';
}

export function ProductStockCards({ products, loading, flashIds, onAdjustStock }: Props) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="h-64 animate-pulse bg-card/20 border-border/30" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-24 text-muted-foreground bg-card/10">
        <Package className="h-10 w-10 text-muted-foreground/60" />
        <p className="text-sm font-medium">No products found</p>
      </div>
    );
  }

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !onAdjustStock || adjustQty === 0) return;
    setIsSubmitting(true);
    try {
      await onAdjustStock(selectedProduct.id, selectedWarehouseId, adjustQty);
      setSelectedProduct(null);
      setAdjustQty(0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => {
        const isLowStock = p.total_stock <= p.reorder_threshold;
        const progressPercentage = Math.min((p.total_stock / (p.reorder_threshold * 2.5)) * 100, 100);
        const isExpanded = expandedCardId === p.id;

        return (
          <Card
            key={p.id}
            className={`group flex flex-col justify-between overflow-hidden bg-card/30 border border-border/40 hover:border-border/80 transition-all duration-300 hover:shadow-lg ${
              flashIds?.has(p.id) ? 'ring-2 ring-primary border-primary/80 animate-flash bg-primary/5' : ''
            }`}
          >
            <div>
              {/* Image & Badges Overlay */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/40">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground/40">
                    <Package className="h-12 w-12" />
                  </div>
                )}

                {/* Top overlay badges */}
                <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
                  <Badge variant="outline" className="bg-black/60 backdrop-blur-md text-white border-none text-[10px] font-semibold uppercase tracking-wider">
                    {p.category}
                  </Badge>
                </div>

                {isLowStock && (
                  <div className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/90 backdrop-blur text-white shadow-lg animate-pulse">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Card Details */}
              <CardContent className="p-4 space-y-3.5">
                <div>
                  <h3 className="font-semibold text-sm truncate text-white leading-tight" title={p.name}>
                    {p.name}
                  </h3>
                  <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{p.sku}</p>
                </div>

                {/* Stock Level Slider visualization */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Stock Level</span>
                    <span className={`font-semibold ${isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {p.total_stock} units
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        p.total_stock === 0
                          ? 'bg-rose-500'
                          : isLowStock
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground text-right">
                    Threshold: {p.reorder_threshold}
                  </p>
                </div>

                {/* Warehouse Breakdown Toggle */}
                {isExpanded && p.stock_by_warehouse && (
                  <div className="rounded-lg bg-black/40 border border-border/40 p-2 space-y-1.5 animate-fadeIn">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <Warehouse className="h-3 w-3" /> Distribution
                    </p>
                    <div className="divide-y divide-border/20">
                      {p.stock_by_warehouse.map((dist) => (
                        <div key={dist.warehouse_id} className="flex justify-between py-1 text-[11px]">
                          <span className="text-muted-foreground">{dist.warehouse_name}</span>
                          <span className="font-mono text-white">{dist.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center gap-2 border-t border-border/20 px-4 py-2.5 bg-card/20">
              <span className="text-sm font-bold text-white tabular-nums">{formatCurrency(p.price)}</span>

              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={() => setExpandedCardId(isExpanded ? null : p.id)}
                  className="flex h-7 px-2 items-center gap-1 rounded-md border border-border/60 hover:bg-muted text-[10px] font-medium text-muted-foreground hover:text-white transition-colors"
                >
                  <Warehouse className="h-3 w-3" />
                  {isExpanded ? 'Hide' : 'Stock'}
                </button>

                {onAdjustStock && (
                  <button
                    onClick={() => {
                      setSelectedProduct(p);
                      setSelectedWarehouseId(p.stock_by_warehouse?.[0]?.warehouse_id || 1);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-primary hover:bg-primary/80 text-primary-foreground transition-colors"
                    title="Adjust stock level"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </Card>
        );
      })}

      {/* Stateful Stock Adjustment Modal Overlay */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-md bg-card border border-border shadow-2xl relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-bold text-white">Adjust Stock Level</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Modify quantities for <span className="font-semibold text-white">{selectedProduct.name}</span> ({selectedProduct.sku}).
              </p>

              <form onSubmit={handleAdjustSubmit} className="mt-5 space-y-4">
                {/* Warehouse selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Select Warehouse</label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                    className="flex h-9 w-full rounded-md border border-border bg-muted/40 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {selectedProduct.stock_by_warehouse?.map((dist) => (
                      <option key={dist.warehouse_id} value={dist.warehouse_id} className="bg-card text-white">
                        {dist.warehouse_name} (Current: {dist.quantity})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock change input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Adjustment Quantity</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(Number(e.target.value))}
                      placeholder="e.g. 50 or -20"
                      className="flex h-9 flex-1 rounded-md border border-border bg-muted/40 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      required
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setAdjustQty(50)}
                        className="h-9 px-2.5 rounded-md border border-border hover:bg-muted text-xs font-medium text-muted-foreground hover:text-white transition-colors"
                      >
                        +50
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustQty(-20)}
                        className="h-9 px-2.5 rounded-md border border-border hover:bg-muted text-xs font-medium text-muted-foreground hover:text-white transition-colors"
                      >
                        -20
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Enter a positive number to add stock (restock), or a negative number to subtract stock (shrinkage/adjust).
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-border/20">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="h-9 px-4 rounded-md border border-border hover:bg-muted text-sm font-medium text-muted-foreground hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || adjustQty === 0}
                    className="h-9 px-4 rounded-md bg-primary hover:bg-primary/80 disabled:opacity-50 text-sm font-semibold text-primary-foreground flex items-center gap-1.5 transition-colors"
                  >
                    {isSubmitting ? 'Updating...' : 'Apply Adjustment'}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
