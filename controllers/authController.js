const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// @desc    Register user
// @route   POST /api/auth/register
// @access   Public
const register = async (req, res, next) => {
  try {
    const { mail, mdp, role } = req.body;

    // Check if user exists
    const existingUser = await User.findByEmail(mail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create user
    const userId = await User.create({ mail, mdp, role });

    // Generate token
    const token = User.generateToken(userId);

    res.status(201).json({
      success: true,
      data: {
        id: userId,
        mail,
        role,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access   Public
const login = async (req, res, next) => {
  try {
    const { mail, mdp } = req.body;
    
    console.log('🔍 Login attempt:', { mail, hasPassword: !!mdp });

    // Check if user exists
    const user = await User.findByEmail(mail);
    console.log('👤 User found:', !!user);
    if (user) {
      console.log('📧 User data:', { id: user.id, mail: user.mail, hasPassword: !!user.mdp });
    }
    
    if (!user || !user.id) {
      console.log('❌ User not found or missing ID');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await User.verifyPassword(mdp, user.mdp);
    console.log('🔐 Password verification:', { provided: !!mdp, stored: !!user.mdp, match: isMatch });
    
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = User.generateToken(user.id);
    console.log('🎫 Token generated successfully');

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        mail: user.mail,
        role: user.role,
        token
      }
    });
  } catch (error) {
    console.log('💥 Login error:', error);
    next(error);
  }
};

// @desc    Get current logged in User
// @route   GET /api/auth/me
// @access   Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access   Private
const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
