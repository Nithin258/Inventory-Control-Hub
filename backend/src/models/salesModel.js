const pool = require('../db/pool');

async function recordSale({ product_id, channel_id, warehouse_id, quantity, unit_price }) {
  const total_amount = +(quantity * unit_price).toFixed(2);
  const { rows } = await pool.query(
    `INSERT INTO sales (product_id, channel_id, warehouse_id, quantity, unit_price, total_amount)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [product_id, channel_id, warehouse_id, quantity, unit_price, total_amount]
  );
  return rows[0];
}

async function getChannels() {
  const { rows } = await pool.query(`SELECT * FROM channels ORDER BY name`);
  return rows;
}

async function getSalesByChannel({ from, to } = {}) {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.color,
            COALESCE(SUM(s.total_amount), 0)::float AS revenue,
            COALESCE(SUM(s.quantity), 0)::int AS units_sold,
            COUNT(s.id)::int AS order_count
     FROM channels c
     LEFT JOIN sales s ON s.channel_id = c.id
       AND s.sold_at >= COALESCE($1, '1970-01-01')
       AND s.sold_at <= COALESCE($2, NOW())
     GROUP BY c.id
     ORDER BY revenue DESC`,
    [from || null, to || null]
  );
  return rows;
}

async function getRevenueSummary({ from, to } = {}) {
  const { rows } = await pool.query(
    `SELECT
       COALESCE(SUM(total_amount), 0)::float AS total_revenue,
       COALESCE(SUM(quantity), 0)::int AS total_units,
       COUNT(*)::int AS total_orders,
       COALESCE(AVG(total_amount), 0)::float AS avg_order_value
     FROM sales
     WHERE sold_at >= COALESCE($1, '1970-01-01') AND sold_at <= COALESCE($2, NOW())`,
    [from || null, to || null]
  );
  return rows[0];
}

async function getSalesTrend({ from, to, interval = 'day' } = {}) {
  const validIntervals = ['day', 'week', 'month'];
  const bucket = validIntervals.includes(interval) ? interval : 'day';

  const { rows } = await pool.query(
    `SELECT date_trunc('${bucket}', sold_at) AS period,
            COALESCE(SUM(total_amount), 0)::float AS revenue,
            COALESCE(SUM(quantity), 0)::int AS units_sold
     FROM sales
     WHERE sold_at >= COALESCE($1, NOW() - INTERVAL '60 days') AND sold_at <= COALESCE($2, NOW())
     GROUP BY period
     ORDER BY period ASC`,
    [from || null, to || null]
  );
  return rows;
}

async function getTopProducts({ from, to, limit = 10 } = {}) {
  const { rows } = await pool.query(
    `SELECT p.id, p.sku, p.name, p.category, p.image_url,
            COALESCE(SUM(s.quantity), 0)::int AS units_sold,
            COALESCE(SUM(s.total_amount), 0)::float AS revenue
     FROM products p
     JOIN sales s ON s.product_id = p.id
     WHERE s.sold_at >= COALESCE($1, '1970-01-01') AND s.sold_at <= COALESCE($2, NOW())
     GROUP BY p.id
     ORDER BY units_sold DESC
     LIMIT $3`,
    [from || null, to || null, limit]
  );
  return rows;
}

module.exports = {
  recordSale,
  getChannels,
  getSalesByChannel,
  getRevenueSummary,
  getSalesTrend,
  getTopProducts,
};
