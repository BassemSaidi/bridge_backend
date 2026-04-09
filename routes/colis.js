const express = require('express');
const { 
  createColis, 
  getAllColis, 
  getColisById, 
  updateColis, 
  updatePaymentStatus, 
  deleteColis, 
  getColisStats 
} = require('../controllers/colisController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Routes
router.post('/', authorize('TRANSPORTEUR', 'ADMIN'), createColis);
router.get('/', getAllColis);
router.get('/stats', getColisStats);
router.get('/:id', getColisById);
router.put('/:id', authorize('TRANSPORTEUR', 'ADMIN'), updateColis);
router.patch('/:id/payment', authorize('TRANSPORTEUR', 'ADMIN'), updatePaymentStatus);
router.delete('/:id', authorize('TRANSPORTEUR', 'ADMIN'), deleteColis);

module.exports = router;
