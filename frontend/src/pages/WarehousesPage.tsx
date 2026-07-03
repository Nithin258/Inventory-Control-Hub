import { WarehouseMap } from '@/components/dashboard/WarehouseMap';
import type { useInventoryData } from '@/hooks/useInventoryData';

export function WarehousesPage({ data }: { data: ReturnType<typeof useInventoryData> }) {
  const { warehouses, loading } = data;
  return (
    <div className="space-y-6">
      <WarehouseMap data={warehouses} loading={loading} />
    </div>
  );
}
