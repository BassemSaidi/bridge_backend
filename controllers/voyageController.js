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
// @access   Private
const getAllVoyages = async (req, res, next) => {
  try {
    const { status, account_id } = req.query;

    // Get the authenticated user's account
    const account = await Account.findByUserId(req.user.id);
    if (!account) {
      return res.status(400).json({
        success: false,
        error: 'Account not found'
      });
    }

    let voyages;
    if (status === 'active') {
      // Only return active voyages for this user's account
      voyages = await Voyage.getActiveByAccountId(account.id);
    } else if (account_id) {
      // Only allow admins to view other accounts' voyages
      if (account_id != account.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view these voyages'
        });
      }
      voyages = await Voyage.findByAccountId(account_id);
    } else {
      // By default, only return voyages for this user's account
      voyages = await Voyage.findByAccountId(account.id);
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
// @access   Private
const getVoyageById = async (req, res, next) => {
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
        error: 'Not authorized to view this voyage'
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

// @desc    Get voyage by tracking code
// @route   GET /api/voyages/by-code/:code
// @access   Public
const getVoyageByCode = async (req, res, next) => {
  try {
    const voyage = await Voyage.findByCode(req.params.code);

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

// @desc    Start voyage
// @route   POST /api/voyages/:id/start
// @access   Private (Owner or ADMIN)
const startVoyage = async (req, res, next) => {
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
        error: 'Not authorized to start this voyage'
      });
    }

    // Set initial status and reset city index to 0
    const firstCity = (voyage.villePD && voyage.villePD.length > 0) ? voyage.villePD[0] : voyage.PaysD;
    
    console.log('Starting voyage:', {
      id: voyage.idV,
      villePD: voyage.villePD,
      PaysD: voyage.PaysD,
      firstCity: firstCity
    });

    const updated = await Voyage.update(req.params.id, {
      status: 'en_route',
      current_city_index: 0,
      status_message: `Started trip from ${firstCity}`
    });
    
    if (updated) {
      const updatedVoyage = await Voyage.findById(req.params.id);
      res.status(200).json({
        success: true,
        data: updatedVoyage
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Voyage not started'
      });
    }
  } catch (error) {
    console.error('Error starting voyage:', error);
    next(error);
  }
};

// @desc    Advance voyage to next city
// @route   POST /api/voyages/:id/advance
// @access   Private (Owner or ADMIN)
const advanceVoyage = async (req, res, next) => {
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
        error: 'Not authorized to advance this voyage'
      });
    }

    // Calculate total route length
    const villePD = voyage.villePD || [];
    const villePF = voyage.villePF || [];
    const totalRouteLength = villePD.length + 2 + 2 + villePF.length; // cities + douane + boat + douane + cities
    
    // Increment city index
    const incremented = await Voyage.incrementCityIndex(req.params.id);
    
    if (!incremented) {
      return res.status(400).json({
        success: false,
        error: 'Failed to advance voyage'
      });
    }
    
    // Get updated voyage to check if at destination
    const updatedVoyage = await Voyage.findById(req.params.id);
    
    // Check if at destination (last city in villePF)
    if (updatedVoyage.current_city_index >= totalRouteLength ) {
      // Mark as arrived
      await Voyage.update(req.params.id, {
        status: 'arrived',
        status_message: 'Trip completed successfully'
      });
    } else {
      // Update status message
      const location = updatedVoyage.current_location;
      await Voyage.update(req.params.id, {
        status_message: `Advanced to ${location.name}, ${location.country}`
      });
    }
    
    const finalVoyage = await Voyage.findById(req.params.id);
    res.status(200).json({
      success: true,
      data: finalVoyage
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
  getVoyageStats,
  startVoyage,
  advanceVoyage,
  getVoyageByCode
};
