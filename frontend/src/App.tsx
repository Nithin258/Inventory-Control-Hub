import { useState } from 'react';
import { Sidebar, type View } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { OverviewPage } from '@/pages/OverviewPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { SalesPage } from '@/pages/SalesPage';
import { WarehousesPage } from '@/pages/WarehousesPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { useInventoryData } from '@/hooks/useInventoryData';
import { QuickSimActions } from '@/components/dashboard/QuickSimActions';
import { ShieldAlert, RefreshCw } from 'lucide-react';

const TITLES: Record<View, string> = {
  overview: 'Overview Dashboard',
  products: 'Products Directory',
  sales: 'Sales & Revenue Analytics',
  warehouses: 'Warehouse Logistics Map',
  alerts: 'Real-time Stock Alerts',
};

export default function App() {
  const [view, setView] = useState<View>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const data = useInventoryData();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground select-none">
      {/* Sidebar navigation */}
      <Sidebar active={view} onChange={setView} connected={data.connected} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Connection Notice Banner if in Offline Mock Simulation Mode */}
        {data.isDemoMode && (
          <div className="flex items-center justify-between gap-3 bg-violet-600/15 border-b border-violet-500/20 px-5 py-2 text-xs font-medium text-violet-300 backdrop-blur">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-violet-400 shrink-0 animate-pulse" />
              <span>
                <strong>Running in Offline Demo Mode</strong> — Database connections are offline. Real-time transaction simulation is active.
              </span>
            </div>
            <button
              onClick={() => data.refresh()}
              className="flex items-center gap-1 hover:bg-violet-500/20 border border-violet-500/30 px-2 py-0.5 rounded text-[10px] text-white transition-all"
            >
              <RefreshCw className="h-3 w-3" /> Retry Connection
            </button>
          </div>
        )}

        <Topbar
          title={TITLES[view]}
          active={view}
          onChange={setView}
          alertCount={data.lowStock.length}
          onSearch={view === 'products' ? setSearchQuery : undefined}
        />

        <main className="flex-1 overflow-y-auto p-5 pb-24">
          {view === 'overview' && <OverviewPage data={data} />}
          {view === 'products' && <ProductsPage data={data} searchQuery={searchQuery} />}
          {view === 'sales' && <SalesPage data={data} />}
          {view === 'warehouses' && <WarehousesPage data={data} />}
          {view === 'alerts' && <AlertsPage data={data} />}
        </main>
      </div>

      {/* Floating Simulator Actions HUD */}
      <QuickSimActions data={data} />
    </div>
  );
}
