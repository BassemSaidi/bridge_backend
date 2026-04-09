const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createTrip,
  getMyTrips,
  getAllTrips,
  updateTrip,
  deleteTrip,
  getTripStatus,
  startTrip,
  updateTripStatus,
  autoAdvanceTrip,
  getTripByCode
} = require('../controllers/tripController');

// Public tracking route (no authentication)
router.get('/by-code/:code', getTripByCode);

// Apply authentication middleware to all remaining routes
router.use(protect);

// @route   POST /api/trips
router.post('/', createTrip);

// @route   GET /api/trips
router.get('/', getMyTrips);

// @route   GET /api/trips/all
router.get('/all', getAllTrips);

// @route   GET /api/trips/by-code/:code (Public)
router.get('/by-code/:code', getTripByCode);

// @route   GET /api/trips/:tripId/status
router.get('/:tripId/status', getTripStatus);

// @route   POST /api/trips/:tripId/start
router.post('/:tripId/start', startTrip);

// @route   POST /api/trips/:tripId/advance
router.post('/:tripId/advance', autoAdvanceTrip);

// @route   PUT /api/trips/:tripId/status
router.put('/:tripId/status', updateTripStatus);

// @route   PUT /api/trips/:id
router.put('/:id', updateTrip);

// @route   DELETE /api/trips/:id
router.delete('/:id', deleteTrip);

module.exports = router;
