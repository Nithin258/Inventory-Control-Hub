const salesModel = require('../models/salesModel');
const inventoryModel = require('../models/inventoryModel');
const productModel = require('../models/productModel');
const { getCache, setCache, invalidatePattern, CACHE_TTL } = require('../utils/redisClient');

async function createSale(req, res, next) {
  try {
    const { product_id, channel_id, warehouse_id, quantity, unit_price } = req.body;
    if (!product_id || !channel_id || !warehouse_id || !quantity || !unit_price) {
      return res.status(400).json({
        error: 'product_id, channel_id, warehouse_id, quantity, and unit_price are required',
      });
    }

    const sale = await salesModel.recordSale({ product_id, channel_id, warehouse_id, quantity, unit_price });

    // Decrement inventory for the sale
    const updatedInventory = await inventoryModel.adjustStock({
      product_id,
      warehouse_id,
      change: -Math.abs(quantity),
      reason: 'sale',
    });

    await invalidatePattern('products:list:*');
    await invalidatePattern('analytics:*');

    const io = req.app.get('io');
    io.emit('sale:created', sale);
    io.emit('inventory:updated', updatedInventory);

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

    res.status(201).json(sale);
  } catch (err) {
    next(err);
  }
}

async function channels(req, res, next) {
  try {
    const rows = await salesModel.getChannels();
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function salesByChannel(req, res, next) {
  try {
    const { from, to } = req.query;
    const cacheKey = `analytics:byChannel:${from || ''}:${to || ''}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const rows = await salesModel.getSalesByChannel({ from, to });
    await setCache(cacheKey, rows, CACHE_TTL.SHORT);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function revenueSummary(req, res, next) {
  try {
    const { from, to } = req.query;
    const cacheKey = `analytics:revenue:${from || ''}:${to || ''}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const summary = await salesModel.getRevenueSummary({ from, to });
    await setCache(cacheKey, summary, CACHE_TTL.SHORT);
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

async function salesTrend(req, res, next) {
  try {
    const { from, to, interval } = req.query;
    const cacheKey = `analytics:trend:${from || ''}:${to || ''}:${interval || 'day'}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const rows = await salesModel.getSalesTrend({ from, to, interval });
    await setCache(cacheKey, rows, CACHE_TTL.SHORT);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function topProducts(req, res, next) {
  try {
    const { from, to, limit } = req.query;
    const cacheKey = `analytics:top:${from || ''}:${to || ''}:${limit || 10}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const rows = await salesModel.getTopProducts({ from, to, limit: parseInt(limit) || 10 });
    await setCache(cacheKey, rows, CACHE_TTL.SHORT);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createSale,
  channels,
  salesByChannel,
  revenueSummary,
  salesTrend,
  topProducts,
};
