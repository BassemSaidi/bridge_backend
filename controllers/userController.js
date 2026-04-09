const User = require('../models/User');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access   Private (ADMIN)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.getAll();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access   Private (ADMIN)
const deleteUser = async (req, res, next) => {
  try {
    const deleted = await User.delete(req.params.id);

    if (deleted) {
      res.status(200).json({
        success: true,
        data: {}
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  deleteUser
};
