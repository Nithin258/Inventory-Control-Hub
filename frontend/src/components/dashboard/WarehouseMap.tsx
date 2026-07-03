import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { WarehouseSummary } from '@/types';
import { formatNumber } from '@/lib/utils';
import { Warehouse, Info, MapPin } from 'lucide-react';

interface Props {
  data: WarehouseSummary[];
  loading?: boolean;
}

// Equirectangular projection mapping.
function project(lat: number, lng: number, width: number, height: number) {
  // Center maps to focus on North America & Europe (around lng -120 to +20, lat 20 to 60)
  // Let's stretch and offset coordinates for a beautiful, zoomed-in view of the North Atlantic region.
  const minLng = -135;
  const maxLng = 25;
  const minLat = 20;
  const maxLat = 62;

  const x = ((lng - minLng) / (maxLng - minLng)) * width;
  // SVG y is top-to-bottom, so invert latitude
  const y = height - ((lat - minLat) / (maxLat - minLat)) * height;

  return { x, y };
}

export function WarehouseMap({ data, loading }: Props) {
  const W = 800;
  const H = 350;
  const maxUnits = Math.max(...data.map((w) => w.total_units), 1);
  const [hoveredWarehouse, setHoveredWarehouse] = useState<WarehouseSummary | null>(null);

  // Approximate vector outline shapes for North America and Europe to make the map look stunning and contextual.
  const continentalPaths = [
    // North America stylized outline
    'M 60,60 L 150,55 L 200,90 L 220,150 L 190,190 L 170,220 L 120,240 L 90,270 L 80,310 L 75,280 L 60,250 L 50,180 Z',
    // Greenland stylized
    'M 300,30 L 380,40 L 350,90 L 290,70 Z',
    // Europe stylized outline
    'M 580,70 L 640,65 L 680,85 L 720,110 L 740,160 L 690,190 L 660,230 L 620,240 L 590,210 L 580,150 L 550,120 Z',
    // Connecting routes/links
    'M 120,160 Q 350,120 620,130', // West Coast to Europe Gateway
    'M 200,140 Q 400,110 620,130', // East Coast to Europe Gateway
  ];

  return (
    <Card className="bg-card/30 border border-border/50 backdrop-blur-md overflow-hidden">
      <CardHeader className="border-b border-border/20 px-5 py-4 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-white">
          <Warehouse className="h-4 w-4 text-primary" />
          Warehouse Locations & Capacity Overview
        </CardTitle>
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" /> Hover nodes for live telemetry
        </span>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {loading ? (
          <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">Loading map systems…</div>
        ) : (
          <div className="relative w-full overflow-hidden rounded-xl border border-border/40 bg-black/40">
            {/* SVG Visual Map Panel */}
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-h-[380px] select-none">
              {/* Background HUD elements */}
              <defs>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(250 84% 64%)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(250 84% 64%)" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Grid System */}
              {Array.from({ length: 16 }).map((_, i) => (
                <line
                  key={`v${i}`}
                  x1={(i * W) / 16}
                  y1={0}
                  x2={(i * W) / 16}
                  y2={H}
                  stroke="hsl(240 6% 16%)"
                  strokeWidth="0.5"
                  strokeDasharray="2 3"
                />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <line
                  key={`h${i}`}
                  x1={0}
                  y1={(i * H) / 8}
                  x2={W}
                  y2={(i * H) / 8}
                  stroke="hsl(240 6% 16%)"
                  strokeWidth="0.5"
                  strokeDasharray="2 3"
                />
              ))}

              {/* Abstract Continent Backdrops */}
              {continentalPaths.map((path, idx) => (
                <path
                  key={idx}
                  d={path}
                  fill="none"
                  stroke={path.startsWith('M 120') || path.startsWith('M 200') ? 'hsl(250 84% 64% / 0.18)' : 'hsl(240 6% 25% / 0.3)'}
                  strokeWidth={path.startsWith('M 120') || path.startsWith('M 200') ? '1.5' : '1'}
                  strokeDasharray={path.startsWith('M 120') || path.startsWith('M 200') ? '4 4' : 'none'}
                  fillOpacity={0.03}
                />
              ))}

              {/* Connecting flightpaths / supply links */}
              {data.map((w) => {
                const { x, y } = project(w.latitude, w.longitude, W, H);
                const radius = 8 + (w.total_units / maxUnits) * 18;
                const isHovered = hoveredWarehouse?.id === w.id;

                return (
                  <g
                    key={w.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredWarehouse(w)}
                    onMouseLeave={() => setHoveredWarehouse(null)}
                  >
                    {/* Outer glowing pulsing ring */}
                    <circle
                      cx={x}
                      cy={y}
                      r={radius + 8}
                      fill="url(#nodeGlow)"
                      className={isHovered ? 'scale-110 transition-transform' : 'animate-pulse'}
                    />

                    {/* Outer ring */}
                    <circle
                      cx={x}
                      cy={y}
                      r={radius}
                      fill="none"
                      stroke={isHovered ? 'hsl(250 84% 64%)' : 'hsl(250 84% 64% / 0.4)'}
                      strokeWidth="1.5"
                      className="transition-colors duration-300"
                    />

                    {/* Pulsing inner dot */}
                    <circle cx={x} cy={y} r="4" fill="hsl(250 84% 64%)" />

                    {/* Node Labels */}
                    <text
                      x={x + radius + 6}
                      y={y - 2}
                      fontSize={11}
                      fill={isHovered ? 'white' : 'hsl(0 0% 90%)'}
                      fontWeight={isHovered ? 700 : 600}
                      className="transition-colors duration-300"
                    >
                      {w.name}
                    </text>

                    <text x={x + radius + 6} y={y + 11} fontSize={9} fill="hsl(240 5% 65%)">
                      {formatNumber(w.total_units)} units
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Floating Tooltip inside SVG */}
            {hoveredWarehouse && (
              <div
                className="absolute bg-card/95 border border-border p-3 rounded-lg shadow-2xl backdrop-blur-md pointer-events-none animate-fadeIn"
                style={{
                  left: `${Math.min(project(hoveredWarehouse.latitude, hoveredWarehouse.longitude, W, H).x + 15, W - 220)}px`,
                  top: `${Math.min(project(hoveredWarehouse.latitude, hoveredWarehouse.longitude, W, H).y - 20, H - 120)}px`,
                  width: '200px',
                }}
              >
                <p className="text-xs font-bold text-white flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary" /> {hoveredWarehouse.name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {hoveredWarehouse.city}, {hoveredWarehouse.country}
                </p>
                <div className="mt-2 pt-1.5 border-t border-border/40 flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Unique Products:</span>
                  <span className="font-semibold text-white">{hoveredWarehouse.product_count}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Stock Volume:</span>
                  <span className="font-semibold text-white">{formatNumber(hoveredWarehouse.total_units)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warehouse Detail Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((w) => {
            const capacityRatio = Math.min((w.total_units / 5000) * 100, 100);
            return (
              <div
                key={w.id}
                className="group rounded-xl border border-border/40 bg-card/20 p-4 hover:bg-card/40 hover:border-border/80 transition-all duration-300 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-primary transition-colors leading-tight">
                      {w.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      {w.city}, {w.country}
                    </p>
                  </div>
                  <Warehouse className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                {/* Capacity utilization indicator */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Warehouse Load</span>
                    <span className="font-mono text-white">{capacityRatio.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        capacityRatio > 80
                          ? 'bg-rose-500'
                          : capacityRatio > 50
                          ? 'bg-amber-400'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${capacityRatio}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-1 text-[11px]">
                  <span className="text-muted-foreground">Catalog items</span>
                  <span className="font-semibold text-white">{w.product_count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
