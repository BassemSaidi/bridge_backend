const db = require('../config/database');

class TripLog {
  // Create a new trip log entry
  static async create(logData) {
    const {
      trip_id,
      status,
      current_city,
      current_country,
      message,
      log_type = 'auto' // 'auto' or 'manual'
    } = logData;

    const [result] = await db.execute(
      `INSERT INTO trip_logs (trip_id, status, current_city, current_country, message, log_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [trip_id, status, current_city, current_country, message, log_type]
    );

    return result.insertId;
  }

  // Get all logs for a trip
  static async getByTripId(trip_id) {
    const [rows] = await db.execute(
      'SELECT * FROM trip_logs WHERE trip_id = ? ORDER BY created_at ASC',
      [trip_id]
    );
    
    return rows;
  }

  // Get current status of a trip
  static async getCurrentStatus(trip_id) {
    const [rows] = await db.execute(
      'SELECT * FROM trip_logs WHERE trip_id = ? ORDER BY created_at DESC LIMIT 1',
      [trip_id]
    );
    
    return rows[0] || null;
  }

  // Get trip with current status
  static async getTripWithStatus(trip_id) {
    const [tripRows] = await db.execute(
      'SELECT * FROM trips WHERE idV = ?',
      [trip_id]
    );

    if (tripRows.length === 0) return null;

    const trip = tripRows[0];
    
    // Parse JSON fields
    try {
      trip.villePD = JSON.parse(trip.villePD || '[]');
    } catch (e) {
      trip.villePD = [];
    }
    
    try {
      trip.villePF = JSON.parse(trip.villePF || '[]');
    } catch (e) {
      trip.villePF = [];
    }

    // Get current status
    const currentLog = await this.getCurrentStatus(trip_id);
    trip.current_status = currentLog;
    trip.logs = await this.getByTripId(trip_id);

    return trip;
  }

  // Update trip status (for manual updates)
  static async updateStatus(trip_id, status, current_city, current_country, message = null) {
    await this.create({
      trip_id,
      status,
      current_city,
      current_country,
      message,
      log_type: 'manual'
    });

    // Update main trip status
    await db.execute(
      'UPDATE trips SET status = ? WHERE idV = ?',
      [status, trip_id]
    );
  }

  // Auto-advance to next city
  static async autoAdvance(trip_id, current_city, current_country, status) {
    const trip = await this.getTripWithStatus(trip_id);
    if (!trip) return null;

    let next_city = null;
    let next_country = current_country;
    let next_status = status;

    // Build complete route: departure cities + arrival cities
    const allCities = [
      ...trip.villePD.map(city => ({ city, country: trip.PaysD })),
      ...trip.villePF.map(city => ({ city, country: trip.PaysF }))
    ];

    // Find current city index
    const currentIndex = allCities.findIndex(
      item => item.city === current_city && item.country === current_country
    );

    // Move to next city
    if (currentIndex !== -1 && currentIndex < allCities.length - 1) {
      const nextItem = allCities[currentIndex + 1];
      next_city = nextItem.city;
      next_country = nextItem.country;
      
      // Update status based on progress
      if (currentIndex + 1 === allCities.length - 1) {
        next_status = 'arrived';
      } else if (currentIndex + 1 >= trip.villePD.length) {
        next_status = 'in_transit_arrival';
      } else {
        next_status = 'in_transit_departure';
      }
    }

    if (next_city) {
      await this.create({
        trip_id,
        status: next_status,
        current_city: next_city,
        current_country: next_country,
        message: `Auto-advanced to ${next_city}, ${next_country}`,
        log_type: 'auto'
      });

      // Update main trip status
      await db.execute(
        'UPDATE trips SET status = ? WHERE idV = ?',
        [next_status, trip_id]
      );
    }

    return { next_city, next_country, next_status };
  }

  // Start trip
  static async startTrip(trip_id) {
    const trip = await this.getTripWithStatus(trip_id);
    if (!trip || trip.villePD.length === 0) return null;

    const first_city = trip.villePD[0];
    
    await this.create({
      trip_id,
      status: 'in_transit_departure',
      current_city: first_city,
      current_country: trip.PaysD,
      message: `Trip started from ${first_city}, ${trip.PaysD}`,
      log_type: 'manual'
    });

    // Update main trip status
    await db.execute(
      'UPDATE trips SET status = ? WHERE idV = ?',
      ['in_transit_departure', trip_id]
    );

    return { first_city, country: trip.PaysD };
  }
}

module.exports = TripLog;
