const TripLog = require('../models/TripLog');
const Trip = require('../models/Trip');
const db = require('../config/database');

// Get trip with current status and logs
const getTripStatus = async (req, res) => {
  try {
    const { tripId } = req.params;
    
    const trip = await TripLog.getTripWithStatus(tripId);
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    res.json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Error getting trip status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trip status'
    });
  }
};

// Start a trip
const startTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
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

    const result = await TripLog.startTrip(tripId);
    
    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Failed to start trip - no departure cities'
      });
    }

    res.json({
      success: true,
      data: {
        message: `Trip started from ${result.first_city}, ${result.country}`,
        current_city: result.first_city,
        current_country: result.country
      }
    });
  } catch (error) {
    console.error('Error starting trip:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start trip'
    });
  }
};

// Update trip status manually
const updateStatus = async (req, res) => {
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

    await TripLog.updateStatus(tripId, status, current_city, current_country, message);

    res.json({
      success: true,
      data: {
        message: 'Status updated successfully',
        status,
        current_city,
        current_country
      }
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
};

// Auto-advance to next city
const autoAdvance = async (req, res) => {
  try {
    const { tripId } = req.params;
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

    const currentStatus = await TripLog.getCurrentStatus(tripId);
    if (!currentStatus) {
      return res.status(400).json({
        success: false,
        error: 'Trip not started yet'
      });
    }

    const result = await TripLog.autoAdvance(
      tripId, 
      currentStatus.current_city, 
      currentStatus.current_country, 
      currentStatus.status
    );

    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Already at final destination'
      });
    }

    res.json({
      success: true,
      data: {
        message: `Auto-advanced to ${result.next_city}, ${result.next_country}`,
        next_city: result.next_city,
        next_country: result.next_country,
        next_status: result.next_status
      }
    });
  } catch (error) {
    console.error('Error auto-advancing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to auto-advance'
    });
  }
};

// Add manual log entry
const addManualLog = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { message, status, current_city, current_country } = req.body;
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

    await TripLog.create({
      trip_id: tripId,
      status: status || 'custom',
      current_city: current_city || 'Unknown',
      current_country: current_country || 'Unknown',
      message,
      log_type: 'manual'
    });

    // Update main trip status if provided
    if (status) {
      await db.execute(
        'UPDATE trips SET status = ? WHERE idV = ?',
        [status, tripId]
      );
    }

    res.json({
      success: true,
      data: {
        message: 'Log entry added successfully'
      }
    });
  } catch (error) {
    console.error('Error adding manual log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add log entry'
    });
  }
};

module.exports = {
  getTripStatus,
  startTrip,
  updateStatus,
  autoAdvance,
  addManualLog
};
