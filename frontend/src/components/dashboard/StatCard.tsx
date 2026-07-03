import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: number; // percent change, positive or negative
  accent?: 'primary' | 'emerald' | 'amber' | 'rose';
  flash?: boolean;
}

const accentClasses = {
  primary: 'bg-primary/10 text-primary border-primary/20 hover:border-primary/40 shadow-[0_0_15px_rgba(101,99,242,0.08)]',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(52,211,153,0.08)]',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:border-amber-500/40 shadow-[0_0_15px_rgba(251,191,36,0.08)]',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:border-rose-500/40 shadow-[0_0_15px_rgba(251,113,133,0.08)]',
};

const sparklineColors = {
  primary: '#8B5CF6',
  emerald: '#34D399',
  amber: '#FBBF24',
  rose: '#FB7185',
};

// Generates a random deterministic sparkline path based on the label
function getSparklinePath(label: string, width: number, height: number): string {
  const seed = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const points = 7;
  const coords: { x: number; y: number }[] = [];

  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * width;
    // generate a wave
    const val = Math.sin(seed + i * 1.5) * Math.cos(seed - i * 0.8);
    const normalized = (val + 1) / 2; // 0 to 1
    const y = height - (normalized * (height - 6) + 3); // pad top/bottom
    coords.push({ x, y });
  }

  return coords.reduce((path, pt, idx) => {
    return path + `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');
}

export function StatCard({ label, value, icon: Icon, trend = 5.4, accent = 'primary', flash }: StatCardProps) {
  const isPositive = trend >= 0;
  const sparkPath = getSparklinePath(label, 70, 24);

  return (
    <Card
      className={cn(
        'group relative overflow-hidden bg-card/30 backdrop-blur-md border border-border/50 hover:bg-card/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
        accentClasses[accent],
        flash && 'animate-flash'
      )}
    >
      {/* Background soft radial glow on hover */}
      <div className="absolute -right-16 -top-16 -z-10 h-32 w-32 rounded-full bg-current opacity-[0.03] blur-3xl transition-opacity group-hover:opacity-[0.08]" />

      <CardContent className="flex items-center justify-between p-5">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-3xl font-extrabold tracking-tight text-white tabular-nums">{value}</p>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              )}
            >
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span className="text-[10px] text-muted-foreground">vs last week</span>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40 text-current transition-transform duration-300 group-hover:scale-110">
            <Icon className="h-5 w-5" />
          </div>

          {/* Sparkline mini-graph */}
          <div className="h-6 w-20 opacity-80 group-hover:opacity-100 transition-opacity">
            <svg width="70" height="24" className="overflow-visible">
              <path
                d={sparkPath}
                fill="none"
                stroke={sparklineColors[accent]}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Pulse at the end of sparkline */}
              <circle
                cx="70"
                cy={sparkPath.split(' ').slice(-1)[0].split(',')[0]} // approximate last y coordinate
                r="2"
                fill={sparklineColors[accent]}
                className="animate-pulse"
              />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
