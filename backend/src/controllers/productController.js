const productModel = require('../models/productModel');
const { getCache, setCache, invalidatePattern, CACHE_TTL } = require('../utils/redisClient');

async function listProducts(req, res, next) {
  try {
    const { search, category } = req.query;
    const cacheKey = `products:list:${search || ''}:${category || ''}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const products = await productModel.getAllProducts({ search, category });
    await setCache(cacheKey, products, CACHE_TTL.SHORT);
    res.json(products);
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await productModel.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const { sku, name, category, price } = req.body;
    if (!sku || !name || !category || price === undefined) {
      return res.status(400).json({ error: 'sku, name, category, and price are required' });
    }
    const product = await productModel.createProduct(req.body);
    await invalidatePattern('products:list:*');

    const io = req.app.get('io');
    io.emit('product:created', product);

    res.status(201).json(product);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'SKU already exists' });
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await productModel.updateProduct(req.params.id, req.body);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    await invalidatePattern('products:list:*');

    const io = req.app.get('io');
    io.emit('product:updated', product);

    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const deleted = await productModel.deleteProduct(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    await invalidatePattern('products:list:*');

    const io = req.app.get('io');
    io.emit('product:deleted', { id: req.params.id });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function lowStock(req, res, next) {
  try {
    const items = await productModel.getLowStockProducts();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function categories(req, res, next) {
  try {
    const cats = await productModel.getCategories();
    res.json(cats);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  lowStock,
  categories,
};
