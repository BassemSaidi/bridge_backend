const express = require('express');
const { 
  createVoyage, 
  getAllVoyages, 
  getVoyageById, 
  updateVoyage, 
  updateVoyageStatus, 
  deleteVoyage, 
  getVoyageStats,
  startVoyage,
  advanceVoyage,
  getVoyageByCode
} = require('../controllers/voyageController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route for tracking (no auth required)
router.get('/by-code/:code', getVoyageByCode);

// Apply protection to all other routes
router.use(protect);

// Routes
router.post('/', authorize('TRANSPORTEUR', 'ADMIN'), createVoyage);
router.get('/', getAllVoyages);
router.get('/stats', getVoyageStats);
router.get('/:id', getVoyageById);
router.post('/:id/start', authorize('TRANSPORTEUR', 'ADMIN'), startVoyage);
router.post('/:id/advance', authorize('TRANSPORTEUR', 'ADMIN'), advanceVoyage);
router.put('/:id', authorize('TRANSPORTEUR', 'ADMIN'), updateVoyage);
router.patch('/:id/status', authorize('TRANSPORTEUR', 'ADMIN'), updateVoyageStatus);
router.delete('/:id', authorize('TRANSPORTEUR', 'ADMIN'), deleteVoyage);

module.exports = router;
