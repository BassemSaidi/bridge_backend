const express = require('express');
const { getAllUsers, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Routes
router.get('/', authorize('ADMIN'), getAllUsers);
router.delete('/:id', authorize('ADMIN'), deleteUser);

module.exports = router;
