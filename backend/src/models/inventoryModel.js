const pool = require('../db/pool');

async function adjustStock({ product_id, warehouse_id, change, reason }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const upsert = await client.query(
      `INSERT INTO inventory (product_id, warehouse_id, quantity)
       VALUES ($1, $2, GREATEST($3, 0))
       ON CONFLICT (product_id, warehouse_id)
       DO UPDATE SET quantity = GREATEST(inventory.quantity + $3, 0), updated_at = NOW()
       RETURNING *`,
      [product_id, warehouse_id, change]
    );

    await client.query(
      `INSERT INTO stock_movements (product_id, warehouse_id, change, reason)
       VALUES ($1, $2, $3, $4)`,
      [product_id, warehouse_id, change, reason || 'adjustment']
    );

    await client.query('COMMIT');
    return upsert.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getWarehouses() {
  const { rows } = await pool.query(`SELECT * FROM warehouses ORDER BY name`);
  return rows;
}

async function getWarehouseStockSummary() {
  const { rows } = await pool.query(`
    SELECT w.id, w.name, w.city, w.country, w.latitude, w.longitude,
           COALESCE(SUM(i.quantity), 0)::int AS total_units,
           COUNT(DISTINCT i.product_id)::int AS product_count
    FROM warehouses w
    LEFT JOIN inventory i ON i.warehouse_id = w.id
    GROUP BY w.id
    ORDER BY w.name
  `);
  return rows;
}

async function getRecentMovements(limit = 25) {
  const { rows } = await pool.query(
    `SELECT sm.id, sm.change, sm.reason, sm.created_at,
            p.name AS product_name, p.sku,
            w.name AS warehouse_name
     FROM stock_movements sm
     JOIN products p ON p.id = sm.product_id
     JOIN warehouses w ON w.id = sm.warehouse_id
     ORDER BY sm.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}

module.exports = { adjustStock, getWarehouses, getWarehouseStockSummary, getRecentMovements };
