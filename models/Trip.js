const db = require('../config/database');

class Trip {
  // Create new trip
  static async create(tripData) {
    const { 
      account_id, 
      PaysD, 
      villePD, 
      PaysF, 
      villePF, 
      DateD, 
      DateF, 
      status = 'a arriver',
      codeT
    } = tripData;

    const [result] = await db.execute(
      `INSERT INTO trips (account_id, PaysD, villePD, PaysF, villePF, DateD, DateF, status, codeT) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        account_id,
        PaysD,
        villePD,
        PaysF,
        villePF,
        DateD,
        DateF,
        status,
        codeT
      ]
    );

    return result.insertId;
  }

  // Find trips by account ID
  static async findByAccountId(account_id) {
    const [rows] = await db.execute(
      'SELECT * FROM trips WHERE account_id = ?',
      [account_id]
    );
    
    console.log('Raw trips from DB:', rows);
    
    // Parse JSON fields
    return rows.map(trip => {
      console.log('Processing trip:', trip.idV);
      console.log('villePD raw:', trip.villePD, 'type:', typeof trip.villePD);
      console.log('villePF raw:', trip.villePF, 'type:', typeof trip.villePF);
      
      try {
        if (trip.villePD && typeof trip.villePD === 'string') {
          trip.villePD = JSON.parse(trip.villePD);
          console.log('Parsed villePD:', trip.villePD);
        } else if (Array.isArray(trip.villePD)) {
          console.log('villePD is already array:', trip.villePD);
        } else {
          console.log('villePD is invalid, setting to []');
          trip.villePD = [];
        }
      } catch (e) {
        console.error('Error parsing villePD:', e, 'for trip:', trip.idV);
        trip.villePD = [];
      }
      
      try {
        if (trip.villePF && typeof trip.villePF === 'string') {
          trip.villePF = JSON.parse(trip.villePF);
          console.log('Parsed villePF:', trip.villePF);
        } else if (Array.isArray(trip.villePF)) {
          console.log('villePF is already array:', trip.villePF);
        } else {
          console.log('villePF is invalid, setting to []');
          trip.villePF = [];
        }
      } catch (e) {
        console.error('Error parsing villePF:', e, 'for trip:', trip.idV);
        trip.villePF = [];
      }
      
      console.log('Final processed trip:', {
        idV: trip.idV,
        villePD: trip.villePD,
        villePF: trip.villePF
      });
      
      return trip;
    });
  }

  // Get all trips
  static async getAll() {
    const [rows] = await db.execute(
      'SELECT * FROM trips'
    );
    
    // Parse JSON fields
    return rows.map(trip => {
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
      return trip;
    });
  }

  // Update trip
  static async update(id, tripData) {
    const { 
      PaysD, 
      villePD, 
      PaysF, 
      villePF, 
      DateD, 
      DateF, 
      status
    } = tripData;

    const [result] = await db.execute(
      `UPDATE trips SET 
        PaysD = ?, villePD = ?, PaysF = ?, villePF = ?, 
        DateD = ?, DateF = ?, status = ? 
       WHERE id = ?`,
      [
        PaysD,
        villePD,
        PaysF,
        villePF,
        DateD,
        DateF,
        status,
        id
      ]
    );

    return result.affectedRows > 0;
  }

  // Delete trip
  static async delete(id) {
    const [result] = await db.execute(
      'DELETE FROM trips WHERE idV = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  // Update trip status
  static async updateStatus(id, status) {
    const [result] = await db.execute(
      'UPDATE trips SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Trip;
