import { useEffect, useState } from 'react';
import { ProductStockCards } from '@/components/dashboard/ProductStockCards';
import { Select } from '@/components/ui/input';
import * as api from '@/lib/api';
import type { useInventoryData } from '@/hooks/useInventoryData';

export function ProductsPage({
  data,
  searchQuery,
}: {
  data: ReturnType<typeof useInventoryData>;
  searchQuery: string;
}) {
  const { products, loading, flashIds } = data;
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    api.fetchCategories().then(setCategories).catch(() => {});
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !category || p.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{filtered.length} products</p>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-48">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
      <ProductStockCards
        products={filtered}
        loading={loading}
        flashIds={flashIds}
        onAdjustStock={data.adjustStock}
      />
    </div>
  );
}
