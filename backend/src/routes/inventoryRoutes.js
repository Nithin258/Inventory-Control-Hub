const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventoryController');

router.post('/adjust', ctrl.adjustStock);
router.get('/warehouses', ctrl.warehouses);
router.get('/warehouses/summary', ctrl.warehouseSummary);
router.get('/movements', ctrl.recentMovements);

module.exports = router;
