const express = require('express');
const {
  createColis,
  getAllColis,
  getColisById,
  updateColis,
  updatePaymentStatus,
  deleteColis,
  getColisStats,
  acceptColisRequest,
  refuseColisRequest,
  getPendingRequestsCount,
  getPendingRequests
} = require('../controllers/colisController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes
router.post('/', protect, createColis);
router.get('/', protect, getAllColis);
router.get('/stats', protect, getColisStats);
router.get('/pending-count', protect, getPendingRequestsCount);
router.get('/pending-requests', protect, getPendingRequests);
router.get('/:id', protect, getColisById);
router.put('/:id', protect, authorize('TRANSPORTEUR', 'ADMIN'), updateColis);
router.patch('/:id/payment', protect, authorize('TRANSPORTEUR', 'ADMIN'), updatePaymentStatus);
router.patch('/:id/accept', protect, authorize('TRANSPORTEUR', 'ADMIN'), acceptColisRequest);
router.patch('/:id/refuse', protect, authorize('TRANSPORTEUR', 'ADMIN'), refuseColisRequest);
router.delete('/:id', protect, authorize('TRANSPORTEUR', 'ADMIN'), deleteColis);

module.exports = router;
