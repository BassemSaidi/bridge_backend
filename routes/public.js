const express = require('express');
const { getPublicAccount, getPublicTrips, getAllUpcomingTrips } = require('../controllers/publicController');

const router = express.Router();

// Public routes - no authentication required
router.get('/account/:id', getPublicAccount);
router.get('/trips/:accountId', getPublicTrips);
router.get('/upcoming-trips', getAllUpcomingTrips);

module.exports = router;
