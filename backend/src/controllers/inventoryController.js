const inventoryModel = require('../models/inventoryModel');
const productModel = require('../models/productModel');
const { invalidatePattern } = require('../utils/redisClient');

async function adjustStock(req, res, next) {
  try {
    const { product_id, warehouse_id, change, reason } = req.body;
    if (!product_id || !warehouse_id || change === undefined) {
      return res.status(400).json({ error: 'product_id, warehouse_id, and change are required' });
    }

    const updated = await inventoryModel.adjustStock({ product_id, warehouse_id, change, reason });
    await invalidatePattern('products:list:*');

    const io = req.app.get('io');
    io.emit('inventory:updated', updated);

    // Check + broadcast low stock alert
    const product = await productModel.getProductById(product_id);
    if (product && product.total_stock <= product.reorder_threshold) {
      io.emit('alert:low-stock', {
        product_id: product.id,
        sku: product.sku,
        name: product.name,
        total_stock: product.total_stock,
        reorder_threshold: product.reorder_threshold,
      });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function warehouses(req, res, next) {
  try {
    const rows = await inventoryModel.getWarehouses();
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function warehouseSummary(req, res, next) {
  try {
    const rows = await inventoryModel.getWarehouseStockSummary();
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function recentMovements(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 25;
    const rows = await inventoryModel.getRecentMovements(limit);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { adjustStock, warehouses, warehouseSummary, recentMovements };
