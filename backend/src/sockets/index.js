const pool = require('../db/pool');
const { invalidatePattern } = require('../utils/redisClient');

/**
 * Registers Socket.IO connection handling and an optional simulated
 * live-activity generator (random sales) so the dashboard feels "real-time"
 * out of the box, even without an external order source wired in.
 */
function registerSockets(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.emit('connected', { message: 'Connected to Inventory Hub real-time stream' });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  if (process.env.SIMULATE_LIVE_SALES !== 'false') {
    startSalesSimulator(io);
  }
}

async function startSalesSimulator(io) {
  const intervalMs = parseInt(process.env.SIMULATION_INTERVAL_MS) || 8000;

  setInterval(async () => {
    try {
      const productsRes = await pool.query('SELECT id, price FROM products ORDER BY random() LIMIT 1');
      const channelsRes = await pool.query('SELECT id FROM channels ORDER BY random() LIMIT 1');
      const warehousesRes = await pool.query('SELECT id FROM warehouses ORDER BY random() LIMIT 1');

      if (!productsRes.rows.length || !channelsRes.rows.length || !warehousesRes.rows.length) return;

      const product = productsRes.rows[0];
      const channel_id = channelsRes.rows[0].id;
      const warehouse_id = warehousesRes.rows[0].id;
      const quantity = Math.floor(Math.random() * 3) + 1;
      const unit_price = product.price;
      const total_amount = +(quantity * unit_price).toFixed(2);

      const saleRes = await pool.query(
        `INSERT INTO sales (product_id, channel_id, warehouse_id, quantity, unit_price, total_amount)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [product.id, channel_id, warehouse_id, quantity, unit_price, total_amount]
      );

      const invRes = await pool.query(
        `INSERT INTO inventory (product_id, warehouse_id, quantity)
         VALUES ($1, $2, 0)
         ON CONFLICT (product_id, warehouse_id)
         DO UPDATE SET quantity = GREATEST(inventory.quantity - $3, 0), updated_at = NOW()
         RETURNING *`,
        [product.id, warehouse_id, quantity]
      );

      await pool.query(
        `INSERT INTO stock_movements (product_id, warehouse_id, change, reason) VALUES ($1,$2,$3,'sale')`,
        [product.id, warehouse_id, -quantity]
      );

      await invalidatePattern('products:list:*');
      await invalidatePattern('analytics:*');

      io.emit('sale:created', saleRes.rows[0]);
      io.emit('inventory:updated', invRes.rows[0]);

      const stockRes = await pool.query(
        `SELECT p.id, p.sku, p.name, p.reorder_threshold, COALESCE(SUM(i.quantity),0)::int AS total_stock
         FROM products p LEFT JOIN inventory i ON i.product_id = p.id
         WHERE p.id = $1 GROUP BY p.id`,
        [product.id]
      );
      const p = stockRes.rows[0];
      if (p && p.total_stock <= p.reorder_threshold) {
        io.emit('alert:low-stock', {
          product_id: p.id,
          sku: p.sku,
          name: p.name,
          total_stock: p.total_stock,
          reorder_threshold: p.reorder_threshold,
        });
      }
    } catch (err) {
      console.error('Simulator error:', err.message);
    }
  }, intervalMs);
}

module.exports = { registerSockets };
