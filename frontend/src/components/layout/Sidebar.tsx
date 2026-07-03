import { LayoutDashboard, Package, Boxes, TrendingUp, Map, AlertTriangle, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

export type View = 'overview' | 'products' | 'sales' | 'warehouses' | 'alerts';

interface SidebarProps {
  active: View;
  onChange: (v: View) => void;
  connected: boolean;
}

const NAV_ITEMS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'sales', label: 'Sales & Revenue', icon: TrendingUp },
  { id: 'warehouses', label: 'Warehouses', icon: Map },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
];

export function Sidebar({ active, onChange, connected }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-card/40 p-4">
      <div className="flex items-center gap-2 px-2 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Boxes className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Inventory Hub</p>
          <p className="text-[11px] text-muted-foreground">Omnichannel Control</p>
        </div>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <Radio className={cn('h-3.5 w-3.5', connected ? 'text-emerald-400 animate-pulse-dot' : 'text-muted-foreground')} />
        <span className="text-xs text-muted-foreground">
          {connected ? 'Live updates active' : 'Reconnecting…'}
        </span>
      </div>
    </aside>
  );
}
