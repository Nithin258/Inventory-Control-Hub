import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from './useSocket';
import * as api from '@/lib/api';
import type {
  Product,
  WarehouseSummary,
  ChannelSales,
  RevenueSummary,
  SalesTrendPoint,
  TopProduct,
  LowStockItem,
  Sale,
} from '@/types';
import type { ActivityEvent } from '@/components/dashboard/LiveActivityFeed';

// ==========================================
// MOCK DATA INITIAL SEEDS FOR DEMO MODE
// ==========================================
const MOCK_WAREHOUSES: WarehouseSummary[] = [
  { id: 1, name: 'East Coast Hub', city: 'Newark', country: 'USA', latitude: 40.7357, longitude: -74.1724, total_units: 1420, product_count: 8 },
  { id: 2, name: 'West Coast Hub', city: 'Los Angeles', country: 'USA', latitude: 34.0522, longitude: -118.2437, total_units: 2840, product_count: 8 },
  { id: 3, name: 'Central Logistics', city: 'Dallas', country: 'USA', latitude: 32.7767, longitude: -96.7970, total_units: 1950, product_count: 8 },
  { id: 4, name: 'Europe Gateway', city: 'Rotterdam', country: 'Netherlands', latitude: 51.9244, longitude: 4.4777, total_units: 1190, product_count: 8 },
];

const MOCK_CHANNELS: ChannelSales[] = [
  { id: 1, name: 'Amazon', color: '#FF9900', revenue: 142500, units_sold: 1650, order_count: 980 },
  { id: 2, name: 'Shopify', color: '#95BF47', revenue: 98400, units_sold: 1120, order_count: 670 },
  { id: 3, name: 'Website Store', color: '#6366F1', revenue: 76200, units_sold: 840, order_count: 510 },
  { id: 4, name: 'Retail Store', color: '#F43F5E', revenue: 32100, units_sold: 450, order_count: 320 },
];

const MOCK_PRODUCTS_RAW = [
  { id: 1, sku: 'SKU-E101', name: 'Wireless Earbuds Pro', category: 'Electronics', price: 129, cost: 55, reorder_threshold: 40, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=60' },
  { id: 2, sku: 'SKU-E102', name: 'Smart Fitness Band', category: 'Electronics', price: 79, cost: 32, reorder_threshold: 45, image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&auto=format&fit=crop&q=60' },
  { id: 3, sku: 'SKU-E103', name: '4K Action Camera', category: 'Electronics', price: 249, cost: 110, reorder_threshold: 20, image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&auto=format&fit=crop&q=60' },
  { id: 4, sku: 'SKU-E104', name: 'Bluetooth Speaker Mini', category: 'Electronics', price: 49, cost: 18, reorder_threshold: 50, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&auto=format&fit=crop&q=60' },
  { id: 5, sku: 'SKU-A201', name: 'Organic Cotton T-Shirt', category: 'Apparel', price: 29, cost: 8, reorder_threshold: 60, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=60' },
  { id: 6, sku: 'SKU-A202', name: 'Running Shoes X1', category: 'Apparel', price: 119, cost: 45, reorder_threshold: 30, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=60' },
  { id: 7, sku: 'SKU-H301', name: 'Non-Stick Cookware Set', category: 'Home & Kitchen', price: 189, cost: 80, reorder_threshold: 15, image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=60' },
  { id: 8, sku: 'SKU-H302', name: 'LED Desk Lamp', category: 'Home & Kitchen', price: 39, cost: 15, reorder_threshold: 35, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&auto=format&fit=crop&q=60' },
  { id: 9, sku: 'SKU-S401', name: 'Yoga Mat Premium', category: 'Sports & Outdoors', price: 59, cost: 22, reorder_threshold: 25, image: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=400&auto=format&fit=crop&q=60' },
  { id: 10, sku: 'SKU-B501', name: 'Vitamin C Serum', category: 'Beauty', price: 35, cost: 12, reorder_threshold: 40, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=60' },
];

export function useInventoryData() {
  const { socket, connected } = useSocket();

  const [products, setProducts] = useState<Product[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseSummary[]>([]);
  const [channelSales, setChannelSales] = useState<ChannelSales[]>([]);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [trend, setTrend] = useState<SalesTrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashIds, setFlashIds] = useState<Set<number>>(new Set());

  // Demo mode indicator
  const [isDemoMode, setIsDemoMode] = useState(false);

  // local ref to store current list of products in memory (for simulator)
  const productsRef = useRef<Product[]>([]);
  productsRef.current = products;

  // Initialize simulated database state in case backend fails
  const mockDbRef = useRef<{
    products: Product[];
    warehouses: WarehouseSummary[];
    channels: ChannelSales[];
    trend: SalesTrendPoint[];
    activity: ActivityEvent[];
  } | null>(null);

  const initMockDb = () => {
    if (mockDbRef.current) return;

    // Generate product inventory distributions
    const prods: Product[] = MOCK_PRODUCTS_RAW.map((p) => {
      const stockDist = MOCK_WAREHOUSES.map((w) => {
        // assign random stock level, some low stock specifically
        let quantity = Math.floor(Math.random() * 80) + 10;
        if (p.id === 2 && w.id === 1) quantity = 2; // low stock trigger
        if (p.id === 5 && w.id === 3) quantity = 4; // low stock trigger
        return {
          warehouse_id: w.id,
          warehouse_name: w.name,
          quantity,
        };
      });
      const totalStock = stockDist.reduce((sum, d) => sum + d.quantity, 0);

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        price: p.price,
        cost: p.cost,
        image_url: p.image,
        reorder_threshold: p.reorder_threshold,
        total_stock: totalStock,
        stock_by_warehouse: stockDist,
      };
    });

    // Generate 60 days sales trends
    const tr: SalesTrendPoint[] = [];
    const now = new Date();
    for (let i = 59; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      tr.push({
        period: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 8000) + 3000,
        units_sold: Math.floor(Math.random() * 100) + 40,
      });
    }

    const act: ActivityEvent[] = [
      { id: 'act-1', type: 'restock', message: 'Restocked 150x SKU-E101 at East Coast Hub', timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
      { id: 'act-2', type: 'sale', message: 'Sold 2x Smart Fitness Band via Amazon — $158', timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
      { id: 'act-3', type: 'adjustment', message: '⚠️ Low stock: Smart Fitness Band (12 left)', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
      { id: 'act-4', type: 'sale', message: 'Sold 1x 4K Action Camera via Shopify — $249', timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
    ];

    mockDbRef.current = {
      products: prods,
      warehouses: MOCK_WAREHOUSES,
      channels: MOCK_CHANNELS,
      trend: tr,
      activity: act,
    };
  };

  const syncFromMockDb = useCallback(() => {
    if (!mockDbRef.current) return;
    const db = mockDbRef.current;

    // Recalculate warehouse totals dynamically based on current product counts
    const updatedWarehouses = db.warehouses.map((w) => {
      let total_units = 0;
      db.products.forEach((p) => {
        const qty = p.stock_by_warehouse?.find((dist) => dist.warehouse_id === w.id)?.quantity || 0;
        total_units += qty;
      });
      return {
        ...w,
        total_units,
        product_count: db.products.length,
      };
    });
    db.warehouses = updatedWarehouses;

    // Filter low stock
    const ls: LowStockItem[] = db.products
      .filter((p) => p.total_stock <= p.reorder_threshold)
      .map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        reorder_threshold: p.reorder_threshold,
        total_stock: p.total_stock,
      }));

    // Calculate revenue stats
    const total_revenue = db.channels.reduce((sum, c) => sum + c.revenue, 0);
    const total_units = db.channels.reduce((sum, c) => sum + c.units_sold, 0);
    const total_orders = db.channels.reduce((sum, c) => sum + c.order_count, 0);
    const rev: RevenueSummary = {
      total_revenue,
      total_units,
      total_orders,
      avg_order_value: total_orders > 0 ? Math.floor(total_revenue / total_orders) : 0,
    };

    // Calculate top products
    const tp: TopProduct[] = db.products
      .map((p) => {
        // simulate standard sale contribution
        const multiplier = p.id === 1 ? 2.5 : p.id === 3 ? 1.8 : p.id === 6 ? 1.4 : 0.8;
        const units_sold = Math.floor(rev.total_units * 0.05 * multiplier) + 10;
        return {
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          image_url: p.image_url,
          units_sold,
          revenue: units_sold * p.price,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    setProducts([...db.products]);
    setLowStock(ls);
    setWarehouses(updatedWarehouses);
    setChannelSales([...db.channels]);
    setRevenue(rev);
    setTrend([...db.trend]);
    setTopProducts(tp);
    setActivity([...db.activity]);
  }, []);

  const flashProduct = useCallback((id: number) => {
    setFlashIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setFlashIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1000);
  }, []);

  const pushActivity = useCallback((event: Omit<ActivityEvent, 'id'>) => {
    setActivity((prev) => [
      { id: `${Date.now()}-${Math.random()}`, ...event },
      ...prev,
    ].slice(0, 30));
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [p, ls, w, cs, rev, tr, tp] = await Promise.all([
        api.fetchProducts(),
        api.fetchLowStock(),
        api.fetchWarehouseSummary(),
        api.fetchSalesByChannel(),
        api.fetchRevenueSummary(),
        api.fetchSalesTrend(),
        api.fetchTopProducts({ limit: 10 }),
      ]);
      setProducts(p);
      setLowStock(ls);
      setWarehouses(w);
      setChannelSales(cs);
      setRevenue(rev);
      setTrend(tr);
      setTopProducts(tp);
      setIsDemoMode(false);
    } catch (err) {
      console.warn('Backend API connection failed. Activating Offline Visual Demo Mode...', err);
      setIsDemoMode(true);
      initMockDb();
      syncFromMockDb();
    } finally {
      setLoading(false);
    }
  }, [syncFromMockDb]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Simulate real-time socket events in Demo Mode
  useEffect(() => {
    if (!isDemoMode) return;

    const interval = setInterval(() => {
      if (!mockDbRef.current) return;
      const db = mockDbRef.current;

      // 80% chance of sale, 20% chance of restock/adjustment alert
      const isSale = Math.random() < 0.8;
      if (isSale) {
        // Trigger simulated sale
        const prod = db.products[Math.floor(Math.random() * db.products.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const channel = db.channels[Math.floor(Math.random() * db.channels.length)];
        const warehouse = db.warehouses[Math.floor(Math.random() * db.warehouses.length)];

        // Decrease stock in mockDb
        const updatedProds = db.products.map((p) => {
          if (p.id === prod.id) {
            const updatedDist = p.stock_by_warehouse?.map((d) => {
              if (d.warehouse_id === warehouse.id) {
                return { ...d, quantity: Math.max(d.quantity - qty, 0) };
              }
              return d;
            }) || [];
            const totalStock = updatedDist.reduce((sum, d) => sum + d.quantity, 0);
            return { ...p, total_stock: totalStock, stock_by_warehouse: updatedDist };
          }
          return p;
        });
        db.products = updatedProds;

        // Increase channel metrics
        const amount = qty * prod.price;
        db.channels = db.channels.map((c) => {
          if (c.id === channel.id) {
            return {
              ...c,
              revenue: c.revenue + amount,
              units_sold: c.units_sold + qty,
              order_count: c.order_count + 1,
            };
          }
          return c;
        });

        // Add to sales trend
        const todayStr = new Date().toISOString().split('T')[0];
        const lastTrendPoint = db.trend[db.trend.length - 1];
        if (lastTrendPoint && lastTrendPoint.period === todayStr) {
          lastTrendPoint.revenue += amount;
          lastTrendPoint.units_sold += qty;
        } else {
          db.trend.push({ period: todayStr, revenue: amount, units_sold: qty });
          if (db.trend.length > 60) db.trend.shift();
        }

        // Add activity
        const newAct: ActivityEvent = {
          id: `sim-sale-${Date.now()}`,
          type: 'sale',
          message: `Sold ${qty}x ${prod.name} via ${channel.name} — $${amount}`,
          timestamp: new Date().toISOString(),
        };
        db.activity = [newAct, ...db.activity].slice(0, 30);

        // flash product visual
        flashProduct(prod.id);

        // check if low stock trigger
        const postProd = db.products.find((p) => p.id === prod.id);
        if (postProd && postProd.total_stock <= postProd.reorder_threshold) {
          db.activity = [
            {
              id: `sim-alert-${Date.now()}`,
              type: 'adjustment',
              message: `⚠️ Low stock: ${prod.name} (${postProd.total_stock} left)`,
              timestamp: new Date().toISOString(),
            },
            ...db.activity,
          ];
        }

        syncFromMockDb();
      } else {
        // Trigger a random restock
        const prod = db.products[Math.floor(Math.random() * db.products.length)];
        const qty = (Math.floor(Math.random() * 5) + 2) * 10;
        const warehouse = db.warehouses[Math.floor(Math.random() * db.warehouses.length)];

        const updatedProds = db.products.map((p) => {
          if (p.id === prod.id) {
            const updatedDist = p.stock_by_warehouse?.map((d) => {
              if (d.warehouse_id === warehouse.id) {
                return { ...d, quantity: d.quantity + qty };
              }
              return d;
            }) || [];
            const totalStock = updatedDist.reduce((sum, d) => sum + d.quantity, 0);
            return { ...p, total_stock: totalStock, stock_by_warehouse: updatedDist };
          }
          return p;
        });
        db.products = updatedProds;

        // Add activity
        const newAct: ActivityEvent = {
          id: `sim-restock-${Date.now()}`,
          type: 'restock',
          message: `Restocked +${qty}x ${prod.name} at ${warehouse.name}`,
          timestamp: new Date().toISOString(),
        };
        db.activity = [newAct, ...db.activity].slice(0, 30);

        flashProduct(prod.id);
        syncFromMockDb();
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [isDemoMode, syncFromMockDb, flashProduct]);

  // Real-time backend Socket.IO listeners (when connected)
  useEffect(() => {
    if (!socket || isDemoMode) return;

    const onSaleCreated = async (sale: Sale) => {
      const product = productsRef.current.find((p) => p.id === sale.product_id);
      pushActivity({
        type: 'sale',
        message: `Sold ${sale.quantity}x ${product?.name || `#${sale.product_id}`} — $${sale.total_amount}`,
        timestamp: sale.sold_at,
      });
      flashProduct(sale.product_id);

      try {
        const [rev, tr, tp, cs] = await Promise.all([
          api.fetchRevenueSummary(),
          api.fetchSalesTrend(),
          api.fetchTopProducts({ limit: 10 }),
          api.fetchSalesByChannel(),
        ]);
        setRevenue(rev);
        setTrend(tr);
        setTopProducts(tp);
        setChannelSales(cs);
      } catch (err) {
        console.error(err);
      }
    };

    const onInventoryUpdated = async (inv: { product_id: number }) => {
      flashProduct(inv.product_id);
      try {
        const [p, ls, w] = await Promise.all([
          api.fetchProducts(),
          api.fetchLowStock(),
          api.fetchWarehouseSummary(),
        ]);
        setProducts(p);
        setLowStock(ls);
        setWarehouses(w);
      } catch (err) {
        console.error(err);
      }
    };

    const onLowStockAlert = (alert: { name: string; total_stock: number }) => {
      pushActivity({
        type: 'adjustment',
        message: `⚠️ Low stock: ${alert.name} (${alert.total_stock} left)`,
        timestamp: new Date().toISOString(),
      });
    };

    const onProductCreated = (product: Product) => {
      setProducts((prev) => [...prev, product]);
      pushActivity({ type: 'restock', message: `New product added: ${product.name}`, timestamp: new Date().toISOString() });
    };

    socket.on('sale:created', onSaleCreated);
    socket.on('inventory:updated', onInventoryUpdated);
    socket.on('alert:low-stock', onLowStockAlert);
    socket.on('product:created', onProductCreated);

    return () => {
      socket.off('sale:created', onSaleCreated);
      socket.off('inventory:updated', onInventoryUpdated);
      socket.off('alert:low-stock', onLowStockAlert);
      socket.off('product:created', onProductCreated);
    };
  }, [socket, isDemoMode, flashProduct, pushActivity]);

  // Adjust stock method supporting both backend API & client-side simulation state
  const adjustStock = useCallback(
    async (productId: number, warehouseId: number, change: number, reason = 'adjustment') => {
      if (isDemoMode && mockDbRef.current) {
        const db = mockDbRef.current;
        const prod = db.products.find((p) => p.id === productId);
        const warehouse = db.warehouses.find((w) => w.id === warehouseId);
        if (!prod || !warehouse) return;

        const updatedProducts = db.products.map((p) => {
          if (p.id === productId) {
            const dist = p.stock_by_warehouse?.map((d) => {
              if (d.warehouse_id === warehouseId) {
                return { ...d, quantity: Math.max(d.quantity + change, 0) };
              }
              return d;
            }) || [];
            return {
              ...p,
              total_stock: dist.reduce((sum, d) => sum + d.quantity, 0),
              stock_by_warehouse: dist,
            };
          }
          return p;
        });

        db.products = updatedProducts;
        const actionText = change >= 0 ? `Restocked +${change}` : `Reduced ${Math.abs(change)}`;
        db.activity = [
          {
            id: `manual-adj-${Date.now()}`,
            type: 'adjustment',
            message: `Stock updated: ${prod.name} (${actionText} units) at ${warehouse.name}`,
            timestamp: new Date().toISOString(),
          },
          ...db.activity,
        ];
        flashProduct(productId);
        syncFromMockDb();
        return;
      }

      // If online, call API
      try {
        await api.adjustStock({ product_id: productId, warehouse_id: warehouseId, change, reason });
      } catch (err) {
        console.error('API adjustStock failed', err);
      }
    },
    [isDemoMode, flashProduct, syncFromMockDb]
  );

  // Trigger manual sale method (useful for quick simulator actions)
  const triggerManualSale = useCallback(
    async (productId: number, channelId: number, warehouseId: number, quantity: number) => {
      const prod = products.find((p) => p.id === productId);
      if (!prod) return;

      if (isDemoMode && mockDbRef.current) {
        const db = mockDbRef.current;
        const channel = db.channels.find((c) => c.id === channelId);
        const warehouse = db.warehouses.find((w) => w.id === warehouseId);
        if (!channel || !warehouse) return;

        // decrease stock
        db.products = db.products.map((p) => {
          if (p.id === productId) {
            const dist = p.stock_by_warehouse?.map((d) => {
              if (d.warehouse_id === warehouseId) {
                return { ...d, quantity: Math.max(d.quantity - quantity, 0) };
              }
              return d;
            }) || [];
            return {
              ...p,
              total_stock: dist.reduce((sum, d) => sum + d.quantity, 0),
              stock_by_warehouse: dist,
            };
          }
          return p;
        });

        // add metrics
        const amount = quantity * prod.price;
        db.channels = db.channels.map((c) => {
          if (c.id === channelId) {
            return {
              ...c,
              revenue: c.revenue + amount,
              units_sold: c.units_sold + quantity,
              order_count: c.order_count + 1,
            };
          }
          return c;
        });

        // add trend
        const todayStr = new Date().toISOString().split('T')[0];
        const lastTrendPoint = db.trend[db.trend.length - 1];
        if (lastTrendPoint && lastTrendPoint.period === todayStr) {
          lastTrendPoint.revenue += amount;
          lastTrendPoint.units_sold += quantity;
        } else {
          db.trend.push({ period: todayStr, revenue: amount, units_sold: quantity });
        }

        // add activity
        db.activity = [
          {
            id: `manual-sale-${Date.now()}`,
            type: 'sale',
            message: `Sold ${quantity}x ${prod.name} via ${channel.name} — $${amount}`,
            timestamp: new Date().toISOString(),
          },
          ...db.activity,
        ];

        flashProduct(productId);
        syncFromMockDb();
        return;
      }

      // Online API call
      try {
        await api.createSale({
          product_id: productId,
          channel_id: channelId,
          warehouse_id: warehouseId,
          quantity,
          unit_price: prod.price,
        });
      } catch (err) {
        console.error('API createSale failed', err);
      }
    },
    [isDemoMode, products, flashProduct, syncFromMockDb]
  );

  return {
    connected: isDemoMode ? true : connected, // pretend connected if we are simulating locally
    isDemoMode,
    loading,
    products,
    lowStock,
    warehouses,
    channelSales,
    revenue,
    trend,
    topProducts,
    activity,
    flashIds,
    refresh: loadAll,
    adjustStock,
    triggerManualSale,
  };
}
