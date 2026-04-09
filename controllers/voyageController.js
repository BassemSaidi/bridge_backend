const Voyage = require('../models/Voyage');
const Account = require('../models/Account');

// @desc    Create new voyage
// @route   POST /api/voyages
// @access   Private (TRANSPORTEUR)
const createVoyage = async (req, res, next) => {
  try {
    // Get account_id from logged-in user
    const account = await Account.findByUserId(req.user.id);
    if (!account) {
      return res.status(400).json({
        success: false,
        error: 'Account not found. Please create an account first.'
      });
    }

    const voyageData = {
      ...req.body,
      account_id: account.id
    };

    const voyageId = await Voyage.create(voyageData);

    const voyage = await Voyage.findById(voyageId);

    res.status(201).json({
      success: true,
      data: voyage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all voyages
// @route   GET /api/voyages
// @access   Public
const getAllVoyages = async (req, res, next) => {
  try {
    const { status, account_id } = req.query;

    let voyages;
    if (status === 'active') {
      voyages = await Voyage.getActive();
    } else if (account_id) {
      voyages = await Voyage.findByAccountId(account_id);
    } else {
      voyages = await Voyage.getAll();
    }

    res.status(200).json({
      success: true,
      count: voyages.length,
      data: voyages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single voyage
// @route   GET /api/voyages/:id
// @access   Public
const getVoyageById = async (req, res, next) => {
  try {
    const voyage = await Voyage.findById(req.params.id);

    if (!voyage) {
      return res.status(404).json({
        success: false,
        error: 'Voyage not found'
      });
    }

    res.status(200).json({
      success: true,
      data: voyage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update voyage
// @route   PUT /api/voyages/:id
// @access   Private (Owner or ADMIN)
const updateVoyage = async (req, res, next) => {
  try {
    let voyage = await Voyage.findById(req.params.id);

    if (!voyage) {
      return res.status(404).json({
        success: false,
        error: 'Voyage not found'
      });
    }

    // Check if user owns this voyage or is admin
    const account = await Account.findByUserId(req.user.id);
    if (voyage.account_id !== account.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this voyage'
      });
    }

    const updated = await Voyage.update(req.params.id, req.body);
    
    if (updated) {
      voyage = await Voyage.findById(req.params.id);
      
      res.status(200).json({
        success: true,
        data: voyage
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Voyage not updated'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update voyage status
// @route   PATCH /api/voyages/:id/status
// @access   Private (Owner or ADMIN)
const updateVoyageStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const voyage = await Voyage.findById(req.params.id);

    if (!voyage) {
      return res.status(404).json({
        success: false,
        error: 'Voyage not found'
      });
    }

    // Check if user owns this voyage or is admin
    const account = await Account.findByUserId(req.user.id);
    if (voyage.account_id !== account.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this voyage'
      });
    }

    const updated = await Voyage.updateStatus(req.params.id, status);
    
    if (updated) {
      res.status(200).json({
        success: true,
        data: { id: req.params.id, status }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Status not updated'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete voyage
// @route   DELETE /api/voyages/:id
// @access   Private (Owner or ADMIN)
const deleteVoyage = async (req, res, next) => {
  try {
    const voyage = await Voyage.findById(req.params.id);

    if (!voyage) {
      return res.status(404).json({
        success: false,
        error: 'Voyage not found'
      });
    }

    // Check if user owns this voyage or is admin
    const account = await Account.findByUserId(req.user.id);
    if (voyage.account_id !== account.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this voyage'
      });
    }

    const deleted = await Voyage.delete(req.params.id);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        data: {}
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Voyage not deleted'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get voyage statistics
// @route   GET /api/voyages/stats
// @access   Private
const getVoyageStats = async (req, res, next) => {
  try {
    const { account_id } = req.query;
    
    let stats;
    if (account_id) {
      // Check if user owns this account or is admin
      const account = await Account.findByUserId(req.user.id);
      if (account.id != account_id && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view these stats'
        });
      }
      stats = await Voyage.getStats(account_id);
    } else {
      stats = await Voyage.getStats();
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVoyage,
  getAllVoyages,
  getVoyageById,
  updateVoyage,
  updateVoyageStatus,
  deleteVoyage,
  getVoyageStats
};
