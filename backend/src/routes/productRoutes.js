const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');

router.get('/', ctrl.listProducts);
router.get('/low-stock', ctrl.lowStock);
router.get('/categories', ctrl.categories);
router.get('/:id', ctrl.getProduct);
router.post('/', ctrl.createProduct);
router.put('/:id', ctrl.updateProduct);
router.delete('/:id', ctrl.deleteProduct);

module.exports = router;
