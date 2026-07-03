-- ==========================================================
-- Omnichannel Real-Time Inventory Control Hub — Schema
-- ==========================================================

DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS channels CASCADE;

CREATE TABLE warehouses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(120) NOT NULL,
  country VARCHAR(120) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE channels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(60) UNIQUE NOT NULL,      -- Amazon, Shopify, Website, Store
  color VARCHAR(20) NOT NULL DEFAULT '#6366f1'
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(60) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  reorder_threshold INT NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id INT REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);

CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id INT REFERENCES warehouses(id) ON DELETE CASCADE,
  change INT NOT NULL,                    -- positive = restock, negative = sale/adjustment
  reason VARCHAR(120) NOT NULL DEFAULT 'adjustment',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id) ON DELETE CASCADE,
  channel_id INT REFERENCES channels(id) ON DELETE CASCADE,
  warehouse_id INT REFERENCES warehouses(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  sold_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_sold_at ON sales(sold_at);
CREATE INDEX idx_sales_channel ON sales(channel_id);
CREATE INDEX idx_sales_product ON sales(product_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
