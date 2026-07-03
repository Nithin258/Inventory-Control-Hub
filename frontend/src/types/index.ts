export interface StockByWarehouse {
  warehouse_id: number;
  warehouse_name: string;
  quantity: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  image_url: string | null;
  reorder_threshold: number;
  total_stock: number;
  stock_by_warehouse: StockByWarehouse[] | null;
}

export interface Warehouse {
  id: number;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface WarehouseSummary extends Warehouse {
  total_units: number;
  product_count: number;
}

export interface Channel {
  id: number;
  name: string;
  color: string;
}

export interface ChannelSales extends Channel {
  revenue: number;
  units_sold: number;
  order_count: number;
}

export interface RevenueSummary {
  total_revenue: number;
  total_units: number;
  total_orders: number;
  avg_order_value: number;
}

export interface SalesTrendPoint {
  period: string;
  revenue: number;
  units_sold: number;
}

export interface TopProduct {
  id: number;
  sku: string;
  name: string;
  category: string;
  image_url: string | null;
  units_sold: number;
  revenue: number;
}

export interface LowStockItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  reorder_threshold: number;
  total_stock: number;
}

export interface Sale {
  id: number;
  product_id: number;
  channel_id: number;
  warehouse_id: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  sold_at: string;
}

export interface StockMovement {
  id: number;
  change: number;
  reason: string;
  created_at: string;
  product_name: string;
  sku: string;
  warehouse_name: string;
}

export interface LowStockAlert {
  product_id: number;
  sku: string;
  name: string;
  total_stock: number;
  reorder_threshold: number;
}
