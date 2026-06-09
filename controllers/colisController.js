const Colis = require('../models/Colis');
const Voyage = require('../models/Voyage');
const Account = require('../models/Account');

// @desc    Create new colis
// @route   POST /api/colis
// @access   Private (or public for demande status)
const createColis = async (req, res, next) => {
  try {
    const { voyage_id, KgCo, status } = req.body;

    // Check if voyage exists
    const voyage = await Voyage.findById(voyage_id);
    if (!voyage) {
      return res.status(400).json({
        success: false,
        error: 'Voyage not found'
      });
    }

    // If status is 'demande', allow public access without ownership check
    if (status !== 'demande') {
      // Check if user owns this voyage or is admin
      const account = await Account.findByUserId(req.user.id);
      if (voyage.account_id !== account.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to add colis to this voyage'
        });
      }

      // Calculate prixTotale from weight * pricePerKg
      const weight = parseFloat(KgCo) || 0;
      const pricePerKg = parseFloat(account.pricePerKg) || 0;
      const prixTotale = (weight * pricePerKg).toFixed(2);

      // Add calculated prixTotale to request body
      req.body.prixTotale = prixTotale;
    } else {
      // For demande status, set prixTotale to 0 (will be calculated on acceptance)
      req.body.prixTotale = 0;
    }

    const colisId = await Colis.create(req.body);
    const colis = await Colis.findById(colisId);

    res.status(201).json({
      success: true,
      data: colis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all colis
// @route   GET /api/colis
// @access   Private
const getAllColis = async (req, res, next) => {
  try {
    const { voyage_id, payment_status, search } = req.query;

    let colis;
    if (voyage_id) {
      // Check if user owns this voyage or is admin
      const voyage = await Voyage.findById(voyage_id);
      const account = await Account.findByUserId(req.user.id);
      
      if (voyage.account_id !== account.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view colis for this voyage'
        });
      }
      
      colis = await Colis.findByVoyageId(voyage_id);
    } else if (payment_status) {
      colis = await Colis.getByPaymentStatus(payment_status);
    } else if (search) {
      colis = await Colis.search(search);
    } else {
      // Admin can see all, transporters see only their own
      if (req.user.role === 'ADMIN') {
        colis = await Colis.getAll();
      } else {
        const account = await Account.findByUserId(req.user.id);
        const voyages = await Voyage.findByAccountId(account.id);
        const voyageIds = voyages.map(v => v.idV);
        
        // Get colis for user's voyages
        colis = [];
        for (const vId of voyageIds) {
          const voyageColis = await Colis.findByVoyageId(vId);
          colis.push(...voyageColis);
        }
      }
    }

    res.status(200).json({
      success: true,
      count: colis.length,
      data: colis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single colis
// @route   GET /api/colis/:id
// @access   Private
const getColisById = async (req, res, next) => {
  try {
    const colis = await Colis.findById(req.params.id);

    if (!colis) {
      return res.status(404).json({
        success: false,
        error: 'Colis not found'
      });
    }

    // Check if user owns this colis or is admin
    const voyage = await Voyage.findById(colis.voyage_id);
    const account = await Account.findByUserId(req.user.id);
    
    if (voyage.account_id !== account.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this colis'
      });
    }

    res.status(200).json({
      success: true,
      data: colis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update colis
// @route   PUT /api/colis/:id
// @access   Private (Owner or ADMIN)
const updateColis = async (req, res, next) => {
  try {
    let colis = await Colis.findById(req.params.id);

    if (!colis) {
      return res.status(404).json({
        success: false,
        error: 'Colis not found'
      });
    }

    // Check if user owns this colis or is admin
    const voyage = await Voyage.findById(colis.voyage_id);
    const account = await Account.findByUserId(req.user.id);
    
    if (voyage.account_id !== account.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this colis'
      });
    }

    // Build update object with only provided fields
    const updateData = {};
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.payementStatus !== undefined) updateData.payementStatus = req.body.payementStatus;
    // Add other fields if needed in the future

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    const updated = await Colis.update(req.params.id, updateData);
    
    if (updated) {
      colis = await Colis.findById(req.params.id);
      
      res.status(200).json({
        success: true,
        data: colis
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Colis not updated'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update colis payment status
// @route   PATCH /api/colis/:id/payment
// @access   Private (Owner or ADMIN)
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { payementStatus } = req.body;
    const colis = await Colis.findById(req.params.id);

    if (!colis) {
      return res.status(404).json({
        success: false,
        error: 'Colis not found'
      });
    }

    // Check if user owns this colis or is admin
    const voyage = await Voyage.findById(colis.voyage_id);
    const account = await Account.findByUserId(req.user.id);
    
    if (voyage.account_id !== account.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this colis payment'
      });
    }

    const updated = await Colis.updatePaymentStatus(req.params.id, payementStatus);
    
    if (updated) {
      res.status(200).json({
        success: true,
        data: { id: req.params.id, payementStatus }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment status not updated'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete colis
// @route   DELETE /api/colis/:id
// @access   Private (Owner or ADMIN)
const deleteColis = async (req, res, next) => {
  try {
    const colis = await Colis.findById(req.params.id);

    if (!colis) {
      return res.status(404).json({
        success: false,
        error: 'Colis not found'
      });
    }

    // Check if user owns this colis or is admin
    const voyage = await Voyage.findById(colis.voyage_id);
    const account = await Account.findByUserId(req.user.id);
    
    if (voyage.account_id !== account.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this colis'
      });
    }

    const deleted = await Colis.delete(req.params.id);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        data: {}
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Colis not deleted'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get colis statistics
// @route   GET /api/colis/stats
// @access   Private
const getColisStats = async (req, res, next) => {
  try {
    const { voyage_id } = req.query;
    
    let stats;
    if (voyage_id) {
      // Check if user owns this voyage or is admin
      const voyage = await Voyage.findById(voyage_id);
      const account = await Account.findByUserId(req.user.id);
      
      if (voyage.account_id !== account.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view these stats'
        });
      }
      
      stats = await Colis.getStats(voyage_id);
    } else {
      // User can only see their own stats unless admin
      if (req.user.role === 'ADMIN') {
        stats = await Colis.getStats();
      } else {
        const account = await Account.findByUserId(req.user.id);
        const voyages = await Voyage.findByAccountId(account.id);
        const voyageIds = voyages.map(v => v.idV);
        
        // Aggregate stats for all user's voyages
        let totalStats = { total: 0, total_weight: 0, total_revenue: 0, paid: 0, to_pay: 0 };
        for (const vId of voyageIds) {
          const voyageStats = await Colis.getStats(vId);
          totalStats.total += voyageStats.total;
          totalStats.total_weight += voyageStats.total_weight;
          totalStats.total_revenue += voyageStats.total_revenue;
          totalStats.paid += voyageStats.paid;
          totalStats.to_pay += voyageStats.to_pay;
        }
        stats = totalStats;
      }
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept package request
// @route   PATCH /api/colis/:id/accept
// @access   Private (TRANSPORTEUR or ADMIN)
const acceptColisRequest = async (req, res, next) => {
  try {
    const colis = await Colis.findById(req.params.id);

    if (!colis) {
      return res.status(404).json({
        success: false,
        error: 'Colis not found'
      });
    }

    // Check if user owns this colis or is admin
    const voyage = await Voyage.findById(colis.voyage_id);
    const account = await Account.findByUserId(req.user.id);
    
    if (voyage.account_id !== account.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to accept this request'
      });
    }

    // Update status to accepted and calculate price
    const weight = parseFloat(colis.KgCo) || 0;
    const pricePerKg = parseFloat(account.pricePerKg) || 0;
    const prixTotale = (weight * pricePerKg).toFixed(2);

    const updated = await Colis.updateStatus(req.params.id, 'accepted');
    
    if (updated) {
      // Update the price
      await Colis.updatePrice(req.params.id, prixTotale);
      
      res.status(200).json({
        success: true,
        data: { id: req.params.id, status: 'accepted', prixTotale }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to accept request'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Refuse package request
// @route   PATCH /api/colis/:id/refuse
// @access   Private (TRANSPORTEUR or ADMIN)
const refuseColisRequest = async (req, res, next) => {
  try {
    const colis = await Colis.findById(req.params.id);

    if (!colis) {
      return res.status(404).json({
        success: false,
        error: 'Colis not found'
      });
    }

    // Check if user owns this colis or is admin
    const voyage = await Voyage.findById(colis.voyage_id);
    const account = await Account.findByUserId(req.user.id);
    
    if (voyage.account_id !== account.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to refuse this request'
      });
    }

    const updated = await Colis.updateStatus(req.params.id, 'refused');
    
    if (updated) {
      res.status(200).json({
        success: true,
        data: { id: req.params.id, status: 'refused' }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to refuse request'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending requests count for transporter
// @route   GET /api/colis/pending-count
// @access   Private (TRANSPORTEUR or ADMIN)
const getPendingRequestsCount = async (req, res, next) => {
  try {
    const account = await Account.findByUserId(req.user.id);
    if (!account) {
      return res.status(400).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Get all voyages for this account
    const voyages = await Voyage.findByAccountId(account.id);
    const voyageIds = voyages.map(v => v.idV);
    
    if (voyageIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: { count: 0 }
      });
    }

    // Count pending requests for these voyages
    const db = require('../config/database');
    const placeholders = voyageIds.map(() => '?').join(',');
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM colis WHERE voyage_id IN (${placeholders}) AND status = 'demande'`,
      voyageIds
    );

    res.status(200).json({
      success: true,
      data: { count: rows[0].count }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending requests with trip details for transporter
// @route   GET /api/colis/pending-requests
// @access   Private (TRANSPORTEUR or ADMIN)
const getPendingRequests = async (req, res, next) => {
  try {
    const account = await Account.findByUserId(req.user.id);
    if (!account) {
      return res.status(400).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Get all voyages for this account
    const voyages = await Voyage.findByAccountId(account.id);
    const voyageIds = voyages.map(v => v.idV);
    
    if (voyageIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Get pending requests for these voyages with trip details
    const db = require('../config/database');
    const placeholders = voyageIds.map(() => '?').join(',');
    const [rows] = await db.execute(
      `SELECT c.*, v.PaysD, v.PaysF, v.DateD, v.DateF, v.codeT, v.status as voyage_status, a.nom as transporteur_name 
       FROM colis c 
       JOIN trips v ON c.voyage_id = v.idV 
       JOIN account a ON v.account_id = a.id 
       WHERE c.voyage_id IN (${placeholders}) AND c.status = 'demande'
       `,
      voyageIds
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
