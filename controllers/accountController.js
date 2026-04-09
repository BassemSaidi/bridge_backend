const Account = require('../models/Account');
const User = require('../models/User');

// @desc    Create account
// @route   POST /api/accounts
// @access   Private (TRANSPORTEUR)
const createAccount = async (req, res, next) => {
  try {
    // Check if user already has an account
    const existingAccount = await Account.findByUserId(req.user.id);
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        error: 'Account already exists for this user'
      });
    }

    const accountData = {
      ...req.body,
      user_id: req.user.id
    };

    const accountId = await Account.create(accountData);
    const account = await Account.findByUserId(req.user.id);

    res.status(201).json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all accounts
// @route   GET /api/accounts
// @access   Private (ADMIN)
const getAllAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.getAll();

    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user account
// @route   GET /api/accounts/me
// @access   Private
const getMyAccount = async (req, res, next) => {
  try {
    const account = await Account.findByUserId(req.user.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    res.status(200).json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single account
// @route   GET /api/accounts/:id
// @access   Private (ADMIN or Owner)
const getAccountById = async (req, res, next) => {
  try {
    const account = await Account.findByUserId(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Check if user owns this account or is admin
    if (account.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this account'
      });
    }

    res.status(200).json({
      success: true,
      data: account
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update account
// @route   PUT /api/accounts/:id
// @access   Private (ADMIN or Owner)
const updateAccount = async (req, res, next) => {
  try {
    let account = await Account.findByUserId(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Check if user owns this account or is admin
    if (account.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this account'
      });
    }

    const updated = await Account.update(account.id, req.body);
    
    if (updated) {
      account = await Account.findByUserId(req.params.id);
      
      res.status(200).json({
        success: true,
        data: account
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Account not updated'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update account routes
// @route   PATCH /api/accounts/:id/routes
// @access   Private (ADMIN or Owner)
const updateRoutes = async (req, res, next) => {
  try {
    const { paysTrajet } = req.body;
    const account = await Account.findByUserId(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Check if user owns this account or is admin
    if (account.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this account'
      });
    }

    const updated = await Account.updatePaysTrajet(account.id, paysTrajet);
    
    if (updated) {
      res.status(200).json({
        success: true,
        data: { id: account.id, paysTrajet }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Routes not updated'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update account guide
// @route   PATCH /api/accounts/:id/guide
// @access   Private (ADMIN or Owner)
const updateGuide = async (req, res, next) => {
  try {
    const { guide } = req.body;
    const account = await Account.findByUserId(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Check if user owns this account or is admin
    if (account.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this account'
      });
    }

    const updated = await Account.updateGuide(account.id, guide);
    
    if (updated) {
      res.status(200).json({
        success: true,
        data: { id: account.id, guide }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Guide not updated'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update account restrictions
// @route   PATCH /api/accounts/:id/restrictions
// @access   Private (ADMIN or Owner)
const updateRestrictions = async (req, res, next) => {
  try {
    const { interdits } = req.body;
    const account = await Account.findByUserId(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Check if user owns this account or is admin
    if (account.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this account'
      });
    }

    const updated = await Account.updateInterdits(account.id, interdits);
    
    if (updated) {
      res.status(200).json({
        success: true,
        data: { id: account.id, interdits }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Restrictions not updated'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete account
// @route   DELETE /api/accounts/:id
// @access   Private (ADMIN or Owner)
const deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findByUserId(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Check if user owns this account or is admin
    if (account.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this account'
      });
    }

    const deleted = await Account.delete(account.id);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        data: {}
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Account not deleted'
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAccount,
  getAllAccounts,
  getMyAccount,
  getAccountById,
  updateAccount,
  updateRoutes,
  updateGuide,
  updateRestrictions,
  deleteAccount
};
