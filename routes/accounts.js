const express = require('express');
const { 
  createAccount, 
  getAllAccounts, 
  getMyAccount, 
  getAccountById, 
  updateAccount, 
  updateRoutes, 
  updateGuide, 
  updateRestrictions, 
  deleteAccount 
} = require('../controllers/accountController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Routes
router.post('/', authorize('TRANSPORTEUR', 'ADMIN'), createAccount);
router.get('/', authorize('ADMIN'), getAllAccounts);
router.get('/me', getMyAccount);
router.get('/:id', getAccountById);
router.put('/:id', updateAccount);
router.patch('/:id/routes', updateRoutes);
router.patch('/:id/guide', updateGuide);
router.patch('/:id/restrictions', updateRestrictions);
router.delete('/:id', deleteAccount);

module.exports = router;
