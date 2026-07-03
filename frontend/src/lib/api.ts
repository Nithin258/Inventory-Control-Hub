import axios from 'axios';
import type {
  Product,
  Warehouse,
  WarehouseSummary,
  Channel,
  ChannelSales,
  RevenueSummary,
  SalesTrendPoint,
  TopProduct,
  LowStockItem,
  StockMovement,
} from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// ---------- Products ----------
export const fetchProducts = (params?: { search?: string; category?: string }) =>
  api.get<Product[]>('/products', { params }).then((r) => r.data);

export const fetchProduct = (id: number) => api.get<Product>(`/products/${id}`).then((r) => r.data);

export const fetchCategories = () => api.get<string[]>('/products/categories').then((r) => r.data);

export const fetchLowStock = () => api.get<LowStockItem[]>('/products/low-stock').then((r) => r.data);

export const createProduct = (data: Partial<Product>) =>
  api.post<Product>('/products', data).then((r) => r.data);

export const updateProduct = (id: number, data: Partial<Product>) =>
  api.put<Product>(`/products/${id}`, data).then((r) => r.data);

export const deleteProduct = (id: number) => api.delete(`/products/${id}`);

// ---------- Inventory ----------
export const fetchWarehouses = () => api.get<Warehouse[]>('/inventory/warehouses').then((r) => r.data);

export const fetchWarehouseSummary = () =>
  api.get<WarehouseSummary[]>('/inventory/warehouses/summary').then((r) => r.data);

export const fetchRecentMovements = (limit = 25) =>
  api.get<StockMovement[]>('/inventory/movements', { params: { limit } }).then((r) => r.data);

export const adjustStock = (data: {
  product_id: number;
  warehouse_id: number;
  change: number;
  reason?: string;
}) => api.post('/inventory/adjust', data).then((r) => r.data);

// ---------- Sales / Analytics ----------
export const fetchChannels = () => api.get<Channel[]>('/sales/channels').then((r) => r.data);

export const fetchSalesByChannel = (params?: { from?: string; to?: string }) =>
  api.get<ChannelSales[]>('/sales/by-channel', { params }).then((r) => r.data);

export const fetchRevenueSummary = (params?: { from?: string; to?: string }) =>
  api.get<RevenueSummary>('/sales/revenue-summary', { params }).then((r) => r.data);

export const fetchSalesTrend = (params?: { from?: string; to?: string; interval?: string }) =>
  api.get<SalesTrendPoint[]>('/sales/trend', { params }).then((r) => r.data);

export const fetchTopProducts = (params?: { from?: string; to?: string; limit?: number }) =>
  api.get<TopProduct[]>('/sales/top-products', { params }).then((r) => r.data);

export const createSale = (data: {
  product_id: number;
  channel_id: number;
  warehouse_id: number;
  quantity: number;
  unit_price: number;
}) => api.post('/sales', data).then((r) => r.data);
