import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Zap, ArrowUp, ArrowDown } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

export interface ActivityEvent {
  id: string;
  type: 'sale' | 'restock' | 'adjustment';
  message: string;
  timestamp: string;
}

interface Props {
  events: ActivityEvent[];
}

export function LiveActivityFeed({ events }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" />
          Live Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Waiting for live events…
          </div>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {events.map((e) => (
              <div key={e.id} className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2">
                <div className="mt-0.5">
                  {e.type === 'sale' ? (
                    <ArrowDown className="h-3.5 w-3.5 text-rose-400" />
                  ) : (
                    <ArrowUp className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-snug">{e.message}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(e.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
