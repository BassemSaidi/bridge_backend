const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTripStatus,
  startTrip,
  updateStatus,
  autoAdvance,
  addManualLog
} = require('../controllers/tripLogController');

// All routes require authentication
router.use(protect);

// Get trip status and logs
router.get('/:tripId/status', getTripStatus);

// Start a trip
router.post('/:tripId/start', startTrip);

// Update trip status manually
router.put('/:tripId/status', updateStatus);

// Auto-advance to next city
router.post('/:tripId/advance', autoAdvance);

// Add manual log entry
router.post('/:tripId/log', addManualLog);

module.exports = router;
