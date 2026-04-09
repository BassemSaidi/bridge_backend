const Account = require('../models/Account');
const Voyage = require('../models/Voyage');

// @desc    Get public account profile
// @route   GET /api/public/account/:id
// @access   Public
const getPublicAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get account by ID
    const account = await Account.findById(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Return only public information (exclude sensitive data)
    const publicAccount = {
      id: account.id,
      nom: account.nom,
      Tel1: account.Tel1,
      Tel2W: account.Tel2W,
      voiture: account.voiture,
      Bio: account.Bio,
      paysTrajet: account.paysTrajet,
      guide: account.guide,
      interdits: account.interdits,
      img: account.img,
      pricePerKg: account.pricePerKg
    };

    res.status(200).json({
      success: true,
      data: publicAccount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public trips for an account
// @route   GET /api/public/trips/:accountId
// @access   Public
const getPublicTrips = async (req, res, next) => {
  try {
    const { accountId } = req.params;

    // Verify account exists
    const account = await Account.findById(accountId);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    // Get trips for this account (Voyage model already parses cities)
    const trips = await Voyage.findByAccountId(accountId);
    
    // Debug: Log the trips data to see what we're getting
    console.log('Raw trips from database:', JSON.stringify(trips, null, 2));

    // Return only public trip information (cities are already parsed by Voyage model)
    const publicTrips = trips.map(trip => ({
      idV: trip.idV,
      PaysD: trip.PaysD,
      PaysF: trip.PaysF,
      DateD: trip.DateD,
      DateF: trip.DateF,
      status: trip.status,
      codeT: trip.codeT,
      villePD: trip.villePD, // Already parsed by Voyage model
      villePF: trip.villePF  // Already parsed by Voyage model
    }));
    
    // Debug: Log the final public trips
    console.log('Public trips response:', JSON.stringify(publicTrips, null, 2));

    res.status(200).json({
      success: true,
      data: publicTrips
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicAccount,
  getPublicTrips
};
