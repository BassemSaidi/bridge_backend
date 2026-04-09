const express = require('express');
const { getPublicAccount, getPublicTrips } = require('../controllers/publicController');

const router = express.Router();

// Public routes - no authentication required
router.get('/account/:id', getPublicAccount);
router.get('/trips/:accountId', getPublicTrips);

module.exports = router;
