import { useState } from 'react';
import type { useInventoryData } from '@/hooks/useInventoryData';
import { Card, CardContent } from '@/components/ui/card';
import { Play, RotateCcw, AlertTriangle, Zap, Radio, X, Settings2 } from 'lucide-react';

interface Props {
  data: ReturnType<typeof useInventoryData>;
}

export function QuickSimActions({ data }: Props) {
  const { isDemoMode, triggerManualSale, adjustStock, products } = data;
  const [isOpen, setIsOpen] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleSimulateSale = async () => {
    if (products.length === 0) return;
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const channelId = Math.floor(Math.random() * 4) + 1; // 1 to 4
    const warehouseId = Math.floor(Math.random() * 4) + 1; // 1 to 4
    const qty = Math.floor(Math.random() * 3) + 1;

    try {
      await triggerManualSale(randomProduct.id, channelId, warehouseId, qty);
      setLastAction(`Simulated: Sale of ${qty}x ${randomProduct.name}`);
      setTimeout(() => setLastAction(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestockAll = async () => {
    const lowStockItems = products.filter((p) => p.total_stock <= p.reorder_threshold);
    if (lowStockItems.length === 0) {
      setLastAction('All items are already fully stocked!');
      setTimeout(() => setLastAction(null), 3000);
      return;
    }

    try {
      for (const item of lowStockItems) {
        // Adjust stock by adding 100 units
        await adjustStock(item.id, 1, 100, 'bulk simulation restock');
      }
      setLastAction(`Simulated: Restocked ${lowStockItems.length} low stock products`);
      setTimeout(() => setLastAction(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRandomAdjustment = async () => {
    if (products.length === 0) return;
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const change = Math.random() < 0.5 ? -15 : 25;
    const warehouseId = Math.floor(Math.random() * 4) + 1;

    try {
      await adjustStock(randomProduct.id, warehouseId, change, 'simulated random shift');
      setLastAction(`Simulated: Shifted stock of ${randomProduct.name} by ${change >= 0 ? '+' : ''}${change}`);
      setTimeout(() => setLastAction(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Floating Activator Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-11 items-center gap-2 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground px-4 shadow-xl transition-all hover:scale-105"
        >
          <Settings2 className="h-4.5 w-4.5 animate-spin-slow" />
          <span className="text-xs font-bold uppercase tracking-wider">Simulation Hub</span>
        </button>
      )}

      {/* Expanded Control HUD */}
      {isOpen && (
        <Card className="w-72 bg-card/95 border border-border shadow-2xl backdrop-blur-md animate-scaleUp">
          <CardContent className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/30 pb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="h-4.5 w-4.5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">Simulator Controls</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-border/40 hover:bg-muted p-1 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Mode Telemetry */}
            <div className="rounded-lg bg-black/40 border border-border/20 px-3 py-2 flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">App Telemetry:</span>
              <div className="flex items-center gap-1.5">
                <Radio className={`h-3 w-3 ${isDemoMode ? 'text-violet-400 animate-pulse' : 'text-emerald-400 animate-pulse'}`} />
                <span className={`text-[10px] font-bold ${isDemoMode ? 'text-violet-400' : 'text-emerald-400'}`}>
                  {isDemoMode ? 'Simulated Mode' : 'Connected API'}
                </span>
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="space-y-2">
              <button
                onClick={handleSimulateSale}
                className="w-full flex items-center gap-2.5 h-8.5 rounded-lg border border-border/60 hover:border-primary hover:bg-primary/10 text-xs font-semibold text-white px-3 transition-all hover:translate-x-0.5 text-left"
              >
                <Play className="h-3.5 w-3.5 text-primary" /> Simulate Random Sale
              </button>

              <button
                onClick={handleRandomAdjustment}
                className="w-full flex items-center gap-2.5 h-8.5 rounded-lg border border-border/60 hover:border-primary hover:bg-primary/10 text-xs font-semibold text-white px-3 transition-all hover:translate-x-0.5 text-left"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Random Inventory Shift
              </button>

              <button
                onClick={handleRestockAll}
                className="w-full flex items-center gap-2.5 h-8.5 rounded-lg border border-border/60 hover:border-primary hover:bg-primary/10 text-xs font-semibold text-white px-3 transition-all hover:translate-x-0.5 text-left"
              >
                <RotateCcw className="h-3.5 w-3.5 text-emerald-400" /> Bulk Restock Low Stock
              </button>
            </div>

            {/* Feedback notification status */}
            {lastAction && (
              <div className="text-[10px] rounded bg-muted/40 border border-border/20 px-2.5 py-1.5 text-center text-primary-foreground font-mono truncate animate-fadeIn">
                {lastAction}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
