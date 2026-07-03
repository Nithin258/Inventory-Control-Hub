const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/salesController');

router.post('/', ctrl.createSale);
router.get('/channels', ctrl.channels);
router.get('/by-channel', ctrl.salesByChannel);
router.get('/revenue-summary', ctrl.revenueSummary);
router.get('/trend', ctrl.salesTrend);
router.get('/top-products', ctrl.topProducts);

module.exports = router;
