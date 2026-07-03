const pool = require('../db/pool');

async function getAllProducts({ search, category } = {}) {
  const clauses = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    clauses.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    clauses.push(`p.category = $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const query = `
    SELECT
      p.id, p.sku, p.name, p.category, p.price, p.cost, p.image_url, p.reorder_threshold,
      COALESCE(SUM(i.quantity), 0)::int AS total_stock,
      json_agg(
        json_build_object('warehouse_id', w.id, 'warehouse_name', w.name, 'quantity', i.quantity)
        ORDER BY w.name
      ) FILTER (WHERE w.id IS NOT NULL) AS stock_by_warehouse
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    LEFT JOIN warehouses w ON w.id = i.warehouse_id
    ${where}
    GROUP BY p.id
    ORDER BY p.name ASC
  `;

  const { rows } = await pool.query(query, params);
  return rows;
}

async function getProductById(id) {
  const { rows } = await pool.query(
    `SELECT
       p.*,
       COALESCE(SUM(i.quantity), 0)::int AS total_stock,
       json_agg(
         json_build_object('warehouse_id', w.id, 'warehouse_name', w.name, 'quantity', i.quantity)
         ORDER BY w.name
       ) FILTER (WHERE w.id IS NOT NULL) AS stock_by_warehouse
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     LEFT JOIN warehouses w ON w.id = i.warehouse_id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  );
  return rows[0] || null;
}

async function createProduct({ sku, name, category, price, cost, image_url, reorder_threshold }) {
  const { rows } = await pool.query(
    `INSERT INTO products (sku, name, category, price, cost, image_url, reorder_threshold)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [sku, name, category, price, cost || 0, image_url || null, reorder_threshold || 20]
  );
  return rows[0];
}

async function updateProduct(id, fields) {
  const allowed = ['sku', 'name', 'category', 'price', 'cost', 'image_url', 'reorder_threshold'];
  const sets = [];
  const params = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      params.push(fields[key]);
      sets.push(`${key} = $${params.length}`);
    }
  }
  if (!sets.length) return getProductById(id);

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE products SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return rows[0] || null;
}

async function deleteProduct(id) {
  const { rowCount } = await pool.query(`DELETE FROM products WHERE id = $1`, [id]);
  return rowCount > 0;
}

async function getLowStockProducts() {
  const { rows } = await pool.query(`
    SELECT p.id, p.sku, p.name, p.category, p.reorder_threshold,
           COALESCE(SUM(i.quantity), 0)::int AS total_stock
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    GROUP BY p.id
    HAVING COALESCE(SUM(i.quantity), 0) <= p.reorder_threshold
    ORDER BY total_stock ASC
  `);
  return rows;
}

async function getCategories() {
  const { rows } = await pool.query(`SELECT DISTINCT category FROM products ORDER BY category`);
  return rows.map((r) => r.category);
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getCategories,
};
