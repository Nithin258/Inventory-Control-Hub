import { Bell, Search } from 'lucide-react';
import { useState } from 'react';
import type { View } from './Sidebar';
import { cn } from '@/lib/utils';

const MOBILE_ITEMS: { id: View; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'products', label: 'Products' },
  { id: 'sales', label: 'Sales' },
  { id: 'warehouses', label: 'Warehouses' },
  { id: 'alerts', label: 'Alerts' },
];

interface TopbarProps {
  title: string;
  active: View;
  onChange: (v: View) => void;
  alertCount: number;
  onSearch?: (q: string) => void;
}

export function Topbar({ title, active, onChange, alertCount, onSearch }: TopbarProps) {
  const [query, setQuery] = useState('');

  return (
    <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {onSearch && (
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  onSearch(e.target.value);
                }}
                placeholder="Search products or SKU…"
                className="h-9 w-64 rounded-md border border-border bg-muted/40 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          )}
          <button
            onClick={() => onChange('alerts')}
            className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-muted"
          >
            <Bell className="h-4 w-4" />
            {alertCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto px-5 pb-2 md:hidden">
        {MOBILE_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium',
              active === item.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
