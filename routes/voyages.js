const express = require('express');
const { 
  createVoyage, 
  getAllVoyages, 
  getVoyageById, 
  updateVoyage, 
  updateVoyageStatus, 
  deleteVoyage, 
  getVoyageStats 
} = require('../controllers/voyageController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Routes
router.post('/', authorize('TRANSPORTEUR', 'ADMIN'), createVoyage);
router.get('/', getAllVoyages);
router.get('/stats', getVoyageStats);
router.get('/:id', getVoyageById);
router.put('/:id', authorize('TRANSPORTEUR', 'ADMIN'), updateVoyage);
router.patch('/:id/status', authorize('TRANSPORTEUR', 'ADMIN'), updateVoyageStatus);
router.delete('/:id', authorize('TRANSPORTEUR', 'ADMIN'), deleteVoyage);

module.exports = router;
