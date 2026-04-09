const Trip = require('../models/Trip');
const db = require('../config/database');

// @desc    Create new trip
// @route   POST /api/trips
// @access   Private
const createTrip = async (req, res, next) => {
  try {
    const tripData = {
      account_id: req.user.id,
      PaysD: req.body.PaysD,
      villePD: req.body.villePD,
      PaysF: req.body.PaysF,
      villePF: req.body.villePF,
      DateD: req.body.DateD,
      DateF: req.body.DateF,
      status: req.body.status || 'a arriver',
      codeT: req.body.codeT
    };

    const tripId = await Trip.create(tripData);

    res.status(201).json({
      success: true,
      data: {
        id: tripId,
        ...tripData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all trips for logged in user
// @route   GET /api/trips
// @access   Private
const getMyTrips = async (req, res, next) => {
  try {
    const trips = await Trip.findByAccountId(req.user.id);

    res.status(200).json({
      success: true,
      data: trips
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all trips
// @route   GET /api/trips/all
// @access   Private (Admin)
const getAllTrips = async (req, res, next) => {
  try {
    const trips = await Trip.getAll();

    res.status(200).json({
      success: true,
      data: trips
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trip
// @route   PUT /api/trips/:id
// @access   Private (Owner or Admin)
const updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findByAccountId(req.user.id);
    const tripToUpdate = trip.find(t => t.id === parseInt(req.params.id));

    if (!tripToUpdate) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    const updated = await Trip.update(req.params.id, req.body);

    if (updated) {
      res.status(200).json({
        success: true,
        data: { id: req.params.id, ...req.body }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to update trip'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete trip
// @route   DELETE /api/trips/:id
// @access   Private (Owner or Admin)
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findByAccountId(req.user.id);
    const tripToDelete = trip.find(t => t.idV == parseInt(req.params.id));

    if (!tripToDelete) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    const deleted = await Trip.delete(req.params.id);

    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Trip deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to delete trip'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get trip with current status and message
// @route   GET /api/trips/:tripId/status
// @access   Private
const getTripStatus = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    
    // Verify trip belongs to user and get parsed data
    const trips = await Trip.findByAccountId(userId);
    const trip = trips.find(t => t.idV == tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found or access denied'
      });
    }

    // Get current status_message and current_city_index from database
    const [tripRows] = await db.execute(
      'SELECT status, status_message, current_city_index FROM trips WHERE idV = ?',
      [tripId]
    );

    if (tripRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    // Combine parsed trip data with status data
    const tripData = {
      ...trip,
      status: tripRows[0].status,
      status_message: tripRows[0].status_message || '',
      current_city_index: tripRows[0].current_city_index || 0
    };

    // Create current_status object with logical progression
    const currentCity = getCurrentCity(tripData);
    let nextCity = getNextCityInRoute(tripData);
    let canAdvance = nextCity !== null;
    
    // Special handling for "On Boat" status
    if (currentCity === 'On Boat') {
      // When on boat, next city should be the first arrival city
      const arrivalCities = tripData.villePF || [];
      if (arrivalCities.length > 0) {
        nextCity = arrivalCities[0];
        canAdvance = true;
      }
    }
    
    tripData.current_status = {
      status: tripData.status,
      current_city: currentCity,
      current_country: getCurrentCountry(tripData),
      message: tripData.status_message,
      next_city: nextCity,
      can_advance: canAdvance
    };

    res.json({
      success: true,
      data: tripData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start a trip
// @route   POST /api/trips/:tripId/start
// @access   Private
const startTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    
    // Verify trip belongs to user and get parsed data
    const trips = await Trip.findByAccountId(userId);
    const trip = trips.find(t => t.idV == tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found or access denied'
      });
    }

    // Get first departure city
    let firstCity = 'Unknown';
    const allCities = [...(trip.villePD || []), ...(trip.villePF || [])];
    if (allCities.length > 0) {
      firstCity = allCities[0];
    }

    // Update trip status, message, and set current_city_index to 0 (first city)
    await db.execute(
      'UPDATE trips SET status = ?, status_message = ?, current_city_index = ? WHERE idV = ?',
      ['in_transit', `Trip started from ${firstCity}, ${trip.PaysD}`, 0, tripId]
    );

    res.json({
      success: true,
      data: {
        message: `Trip started from ${firstCity}, ${trip.PaysD}`,
        current_city: firstCity,
        current_country: trip.PaysD,
        status: 'in_transit'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auto-advance to next city in logical progression
// @route   POST /api/trips/:tripId/advance
// @access   Private
const autoAdvanceTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    
    // Verify trip belongs to user and get parsed data
    const trips = await Trip.findByAccountId(userId);
    const trip = trips.find(t => t.idV == tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found or access denied'
      });
    }

    // Get current city index from database
    const [tripRows] = await db.execute(
      'SELECT current_city_index FROM trips WHERE idV = ?',
      [tripId]
    );

    if (tripRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    const allCities = [...(trip.villePD || []), ...(trip.villePF || [])];
    const currentIndex = tripRows[0].current_city_index || 0;
    const nextIndex = currentIndex + 1;

    // Check if there are more cities
    if (nextIndex >= allCities.length) {
      return res.status(400).json({
        success: false,
        error: 'Trip already completed - no more cities to advance'
      });
    }

    const nextCity = allCities[nextIndex];
    const nextCountry = nextIndex < trip.villePD.length ? trip.PaysD : trip.PaysF;

    // Update trip with next city, status, and increment current_city_index
    let newStatus = 'in_transit';
    if (nextIndex === allCities.length - 1) {
      newStatus = 'arrived';
    }

    const message = `Auto-advanced to ${nextCity}, ${nextCountry}`;

    await db.execute(
      'UPDATE trips SET status = ?, status_message = ?, current_city_index = ? WHERE idV = ?',
      [newStatus, message, nextIndex, tripId]
    );

    res.json({
      success: true,
      data: {
        message,
        status: newStatus,
        current_city: nextCity,
        current_country: nextCountry
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trip status manually with message
// @route   PUT /api/trips/:tripId/status
// @access   Private
const updateTripStatus = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { status, current_city, current_country, message } = req.body;
    const userId = req.user.id;
    
    // Verify trip belongs to user
    const trips = await Trip.findByAccountId(userId);
    const trip = trips.find(t => t.idV == tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found or access denied'
      });
    }

    // Update trip status and message
    await db.execute(
      'UPDATE trips SET status = ?, status_message = ? WHERE idV = ?',
      [status, message || '', tripId]
    );

    res.json({
      success: true,
      data: {
        message: message || `Status updated to ${status}`,
        status,
        current_city,
        current_country
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get current city based on current_city_index
const getCurrentCity = (trip) => {
  const allCities = [...(trip.villePD || []), ...(trip.villePF || [])];
  const departureCities = trip.villePD || [];
  const currentIndex = trip.current_city_index || 0;
  
  // If trip hasn't started, return first city
  if (trip.status === 'a arriver') {
    return allCities[0] || 'Unknown';
  }
  
  // If trip is completed, return last city
  if (trip.status === 'arrived') {
    return allCities[allCities.length - 1] || 'Unknown';
  }
  
  // Special case: On Boat (en_route status and at last departure city)
  if (trip.status === 'en_route' && currentIndex === departureCities.length - 1 && departureCities.length > 0) {
    return 'On Boat';
  }
  
  // Make sure index is within bounds
  if (currentIndex >= 0 && currentIndex < allCities.length) {
    return allCities[currentIndex];
  }
  
  return 'Unknown';
};

// Helper function to get current country based on status
const getCurrentCountry = (trip) => {
  const allCities = [
    ...(trip.villePD || []).map(city => ({ city, country: trip.PaysD })),
    ...(trip.villePF || []).map(city => ({ city, country: trip.PaysF }))
  ];
  
  const currentCity = getCurrentCity(trip);
  const currentCityInfo = allCities.find(item => item.city === currentCity);
  
  return currentCityInfo?.country || trip.PaysD;
};

// Helper function to get next city in the logical progression
const getNextCityInRoute = (trip) => {
  const allCities = [...(trip.villePD || []), ...(trip.villePF || [])];
  const currentCity = getCurrentCity(trip);
  const currentIndex = allCities.indexOf(currentCity);
  
  // If current city is found and not the last one
  if (currentIndex !== -1 && currentIndex < allCities.length - 1) {
    return allCities[currentIndex + 1];
  }
  
  return null; // No more cities
};

// Helper function to get next country in the logical progression
const getNextCountryInRoute = (trip) => {
  const allCities = [
    ...(trip.villePD || []).map(city => ({ city, country: trip.PaysD })),
    ...(trip.villePF || []).map(city => ({ city, country: trip.PaysF }))
  ];
  const currentCity = getCurrentCity(trip);
  const currentIndex = allCities.findIndex(item => item.city === currentCity);
  
  // If current city is found and not the last one
  if (currentIndex !== -1 && currentIndex < allCities.length - 1) {
    return allCities[currentIndex + 1].country;
  }
  
  return trip.PaysF; // Default to destination country
};

// @desc    Get trip by code for public tracking
// @route   GET /api/trips/by-code/:code
// @access   Public
const getTripByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    
    // Get trip by code
    const [tripRows] = await db.execute(
      'SELECT * FROM trips WHERE codeT = ?',
      [code]
    );

    if (tripRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    const tripData = tripRows[0];
    
    // Use the same robust JSON parsing as Trip.findByAccountId
    try {
      if (typeof tripData.villePD === 'string') {
        tripData.villePD = JSON.parse(tripData.villePD || '[]');
      }
    } catch (e) {
      console.error('Error parsing villePD:', e, 'Raw data:', tripData.villePD);
      tripData.villePD = [];
    }
    
    try {
      if (typeof tripData.villePF === 'string') {
        tripData.villePF = JSON.parse(tripData.villePF || '[]');
      }
    } catch (e) {
      console.error('Error parsing villePF:', e, 'Raw data:', tripData.villePF);
      tripData.villePF = [];
    }

    console.log('Parsed cities:', {
      villePD: tripData.villePD,
      villePF: tripData.villePF,
      current_city_index: tripData.current_city_index
    });

    // Create current_status object with logical progression
    const currentCity = getCurrentCity(tripData);
    let nextCity = getNextCityInRoute(tripData);
    let canAdvance = nextCity !== null;
    
    // Special handling for "On Boat" status
    if (currentCity === 'On Boat') {
      // When on boat, next city should be the first arrival city
      const arrivalCities = tripData.villePF || [];
      if (arrivalCities.length > 0) {
        nextCity = arrivalCities[0];
        canAdvance = true;
      }
    }
    
    tripData.current_status = {
      status: tripData.status,
      current_city: currentCity,
      current_country: getCurrentCountry(tripData),
      message: tripData.status_message || '',
      next_city: nextCity,
      can_advance: canAdvance
    };

    res.json({
      success: true,
      data: tripData
    });
  } catch (error) {
    console.error('Error in getTripByCode:', error);
    next(error);
  }
};

module.exports = {
  createTrip,
  getMyTrips,
  getAllTrips,
  updateTrip,
  deleteTrip,
  getTripStatus,
  startTrip,
  updateTripStatus,
  autoAdvanceTrip,
  getTripByCode
};
