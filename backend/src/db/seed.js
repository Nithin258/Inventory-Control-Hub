const pool = require('./pool');

const WAREHOUSES = [
  { name: 'East Coast DC', city: 'Newark', country: 'USA', latitude: 40.7357, longitude: -74.1724 },
  { name: 'West Coast DC', city: 'Los Angeles', country: 'USA', latitude: 34.0522, longitude: -118.2437 },
  { name: 'Central Hub', city: 'Dallas', country: 'USA', latitude: 32.7767, longitude: -96.7970 },
  { name: 'EU Fulfillment', city: 'Rotterdam', country: 'Netherlands', latitude: 51.9244, longitude: 4.4777 },
];

const CHANNELS = [
  { name: 'Amazon', color: '#FF9900' },
  { name: 'Shopify', color: '#95BF47' },
  { name: 'Website', color: '#6366F1' },
  { name: 'Store', color: '#F43F5E' },
];

const CATEGORIES = ['Electronics', 'Apparel', 'Home & Kitchen', 'Beauty', 'Sports & Outdoors', 'Toys'];

const PRODUCT_NAMES = [
  'Wireless Earbuds Pro', 'Smart Fitness Band', '4K Action Camera', 'Bluetooth Speaker Mini',
  'Ergonomic Office Chair', 'Stainless Steel Water Bottle', 'Organic Cotton T-Shirt', 'Running Shoes X1',
  'Non-Stick Cookware Set', 'LED Desk Lamp', 'Yoga Mat Premium', 'Facial Cleanser Gel',
  'Vitamin C Serum', 'Kids Building Blocks', 'Remote Control Drone', 'Insulated Lunch Box',
  'Leather Wallet', 'Portable Power Bank', 'Noise Cancelling Headphones', 'Adjustable Dumbbell Set',
  'Standing Desk Converter', 'Ceramic Coffee Mug Set', 'Backpack Travel Pro', 'Sunglasses Polarized',
  'Electric Kettle', 'Air Fryer Compact', 'Memory Foam Pillow', 'Weighted Blanket',
  'Bike Helmet', 'Camping Tent 4-Person',
];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function randFloat(min, max, decimals = 2) { return +(Math.random() * (max - min) + min).toFixed(decimals); }

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Seeding warehouses...');
    const warehouseIds = [];
    for (const w of WAREHOUSES) {
      const res = await client.query(
        `INSERT INTO warehouses (name, city, country, latitude, longitude) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [w.name, w.city, w.country, w.latitude, w.longitude]
      );
      warehouseIds.push(res.rows[0].id);
    }

    console.log('Seeding channels...');
    const channelIds = [];
    for (const c of CHANNELS) {
      const res = await client.query(
        `INSERT INTO channels (name, color) VALUES ($1,$2) RETURNING id`,
        [c.name, c.color]
      );
      channelIds.push(res.rows[0].id);
    }

    console.log('Seeding products + inventory...');
    const productIds = [];
    for (let i = 0; i < PRODUCT_NAMES.length; i++) {
      const name = PRODUCT_NAMES[i];
      const sku = `SKU-${1000 + i}`;
      const category = pick(CATEGORIES);
      const cost = randFloat(5, 80);
      const price = +(cost * randFloat(1.4, 2.2)).toFixed(2);
      const reorderThreshold = rand(10, 40);
      const imageUrl = `https://picsum.photos/seed/${sku}/300/300`;

      const res = await client.query(
        `INSERT INTO products (sku, name, category, price, cost, image_url, reorder_threshold)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [sku, name, category, price, cost, imageUrl, reorderThreshold]
      );
      const productId = res.rows[0].id;
      productIds.push(productId);

      for (const warehouseId of warehouseIds) {
        const qty = rand(0, 150);
        await client.query(
          `INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES ($1,$2,$3)`,
          [productId, warehouseId, qty]
        );
      }
    }

    console.log('Seeding sales history (last 60 days)...');
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    for (let d = 60; d >= 0; d--) {
      const dayTimestamp = now - d * DAY;
      const salesCountToday = rand(15, 45);
      for (let s = 0; s < salesCountToday; s++) {
        const productId = pick(productIds);
        const channelId = pick(channelIds);
        const warehouseId = pick(warehouseIds);
        const qty = rand(1, 5);

        const priceRes = await client.query(`SELECT price FROM products WHERE id = $1`, [productId]);
        const unitPrice = priceRes.rows[0].price;
        const totalAmount = +(unitPrice * qty).toFixed(2);
        const soldAt = new Date(dayTimestamp + rand(0, DAY - 1));

        await client.query(
          `INSERT INTO sales (product_id, channel_id, warehouse_id, quantity, unit_price, total_amount, sold_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [productId, channelId, warehouseId, qty, unitPrice, totalAmount, soldAt]
        );
      }
    }

    console.log('Seeding a few low-stock products...');
    const lowStockSample = productIds.slice(0, 5);
    for (const productId of lowStockSample) {
      const warehouseId = warehouseIds[0];
      await client.query(
        `UPDATE inventory SET quantity = $1 WHERE product_id = $2 AND warehouse_id = $3`,
        [rand(0, 8), productId, warehouseId]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Seed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
