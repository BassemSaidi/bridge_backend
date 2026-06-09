const db = require('../config/database');

class Voyage {
  // Create new voyage
  static async create(voyageData) {
    const { 
      account_id, 
      PaysD, 
      villePD = [], 
      PaysF, 
      villePF = [], 
      DateD, 
      DateF, 
      status = 'a arriver', 
      codeT 
    } = voyageData;

    const [result] = await db.execute(
      `INSERT INTO trips (account_id, PaysD, villePD, PaysF, villePF, DateD, DateF, status, codeT, current_city_index) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        account_id,
        PaysD,
        JSON.stringify(villePD),
        PaysF,
        JSON.stringify(villePF),
        DateD,
        DateF,
        status,
        codeT
      ]
    );

    return result.insertId;
  }

  // Helper function to safely parse cities field
  static parseCitiesField(citiesField) {
    if (!citiesField || citiesField === null || citiesField === undefined) return [];
    
    try {
      // If it's already an array, return it
      if (Array.isArray(citiesField)) return citiesField;
      
      // If it's a string, try to parse as JSON
      if (typeof citiesField === 'string') {
        // Handle empty string
        if (citiesField.trim() === '') return [];
        
        // Try JSON parse first
        try {
          const parsed = JSON.parse(citiesField);
          return Array.isArray(parsed) ? parsed : [];
        } catch (jsonError) {
          // If JSON parse fails, treat as comma-separated string
          return citiesField.split(',').map(city => city.trim()).filter(city => city.length > 0);
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing cities field:', error);
      return [];
    }
  }

  // Find voyage by ID
  static async findById(idV) {
    const [rows] = await db.execute(
      'SELECT * FROM trips WHERE idV = ?',
      [idV]
    );
    
    if (rows.length > 0) {
      const voyage = rows[0];
      // Parse cities fields safely
      voyage.villePD = this.parseCitiesField(voyage.villePD);
      voyage.villePF = this.parseCitiesField(voyage.villePF);
      // Calculate current location based on current_city_index
      voyage.current_location = this.getCurrentLocation(voyage);
      return voyage;
    }
    
    return null;
  }

  // Get voyages by account ID
  static async findByAccountId(account_id) {
    const [rows] = await db.execute(
      'SELECT * FROM trips WHERE account_id = ? ORDER BY DateD DESC',
      [account_id]
    );
    
    console.log('Raw database rows for account', account_id, ':', JSON.stringify(rows, null, 2));
    
    // Parse cities fields safely for all voyages
    const parsedRows = rows.map(voyage => {
      const parsed = {
        ...voyage,
        villePD: this.parseCitiesField(voyage.villePD),
        villePF: this.parseCitiesField(voyage.villePF),
        current_location: this.getCurrentLocation(voyage)
      };
      console.log('Parsed voyage', voyage.idV, ':', {
        original_villePD: voyage.villePD,
        parsed_villePD: parsed.villePD,
        original_villePF: voyage.villePF,
        parsed_villePF: parsed.villePF
      });
      return parsed;
    });
    
    return parsedRows;
  }

  // Get all voyages
  static async getAll() {
    const [rows] = await db.execute(
      `SELECT v.*, a.nom as account_name, a.voiture 
       FROM trips v 
       JOIN account a ON v.account_id = a.id 
       ORDER BY v.DateD DESC`
    );
    
    // Parse cities fields safely for all voyages
    return rows.map(voyage => ({
      ...voyage,
      villePD: this.parseCitiesField(voyage.villePD),
      villePF: this.parseCitiesField(voyage.villePF),
      current_location: this.getCurrentLocation(voyage)
    }));
  }

  // Get active voyages
  static async getActive() {
    const [rows] = await db.execute(
      `SELECT v.*, a.nom as account_name, a.voiture 
       FROM trips v 
       JOIN account a ON v.account_id = a.id 
       WHERE v.status IN ('SCHEDULED', 'IN_PROGRESS') 
       ORDER BY v.DateD ASC`
    );
    
    // Parse cities fields safely for all voyages
    return rows.map(voyage => ({
      ...voyage,
      villePD: this.parseCitiesField(voyage.villePD),
      villePF: this.parseCitiesField(voyage.villePF),
      current_location: this.getCurrentLocation(voyage)
    }));
  }

  // Get active voyages by account ID
  static async getActiveByAccountId(account_id) {
    const [rows] = await db.execute(
      `SELECT v.*, a.nom as account_name, a.voiture 
       FROM trips v 
       JOIN account a ON v.account_id = a.id 
       WHERE v.account_id = ? AND v.status IN ('SCHEDULED', 'IN_PROGRESS') 
       ORDER BY v.DateD ASC`,
      [account_id]
    );
    
    // Parse cities fields safely for all voyages
    return rows.map(voyage => ({
      ...voyage,
      villePD: this.parseCitiesField(voyage.villePD),
      villePF: this.parseCitiesField(voyage.villePF),
      current_location: this.getCurrentLocation(voyage)
    }));
  }

  // Update voyage
  static async update(idV, voyageData) {
    const { 
      PaysD, 
      villePD, 
      PaysF, 
      villePF, 
      DateD, 
      DateF, 
      status, 
      codeT,
      current_city_index,
      status_message
    } = voyageData;

    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];
    
    if (PaysD !== undefined) { fields.push('PaysD = ?'); values.push(PaysD); }
    if (villePD !== undefined) { fields.push('villePD = ?'); values.push(JSON.stringify(villePD)); }
    if (PaysF !== undefined) { fields.push('PaysF = ?'); values.push(PaysF); }
    if (villePF !== undefined) { fields.push('villePF = ?'); values.push(JSON.stringify(villePF)); }
    if (DateD !== undefined) { fields.push('DateD = ?'); values.push(DateD); }
    if (DateF !== undefined) { fields.push('DateF = ?'); values.push(DateF); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (codeT !== undefined) { fields.push('codeT = ?'); values.push(codeT); }
    if (current_city_index !== undefined) { fields.push('current_city_index = ?'); values.push(current_city_index); }
    if (status_message !== undefined) { fields.push('status_message = ?'); values.push(status_message); }
    
    values.push(idV);

    const [result] = await db.execute(
      `UPDATE trips SET ${fields.join(', ')} WHERE idV = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // Update voyage status
  static async updateStatus(idV, status) {
    const [result] = await db.execute(
      'UPDATE trips SET status = ? WHERE idV = ?',
      [status, idV]
    );
    return result.affectedRows > 0;
  }

  // Delete voyage
  static async delete(idV) {
    const [result] = await db.execute(
      'DELETE FROM trips WHERE idV = ?',
      [idV]
    );
    return result.affectedRows > 0;
  }

  // Get voyage statistics
  static async getStats(account_id = null) {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'SCHEDULED' THEN 1 ELSE 0 END) as scheduled
      FROM trips
    `;
    
    const params = [];
    if (account_id) {
      query += ' WHERE account_id = ?';
      params.push(account_id);
    }
    
    const [rows] = await db.execute(query, params);
    return rows[0];
  }

  // Get current location based on current_city_index
  static getCurrentLocation(voyage) {
    const villePD = this.parseCitiesField(voyage.villePD);
    const villePF = this.parseCitiesField(voyage.villePF);
    const currentIndex = voyage.current_city_index || 0;
    
    // Build the route: villePD -> Douane -> Boat -> Douane -> villePF
    const route = [];
    
    // Add departure cities
    villePD.forEach(city => {
      route.push({ type: 'city', name: city, country: voyage.PaysD });
    });
    
    // Add customs before boat
    route.push({ type: 'customs', name: 'Douane', country: voyage.PaysD });
    
    // Add boat
    route.push({ type: 'boat', name: 'En Bateau', country: 'International' });
    
    // Add customs after boat
    route.push({ type: 'customs', name: 'Douane', country: voyage.PaysF });
    
    // Add arrival cities
    villePF.forEach(city => {
      route.push({ type: 'city', name: city, country: voyage.PaysF });
    });
    
    // Return current location or first location if index is out of bounds
    if (currentIndex >= 0 && currentIndex < route.length) {
      return route[currentIndex];
    }
    
    return route[0] || { type: 'unknown', name: 'Unknown', country: 'Unknown' };
  }

  // Increment current city index
  static async incrementCityIndex(idV) {
    const [result] = await db.execute(
      'UPDATE trips SET current_city_index = current_city_index + 1 WHERE idV = ?',
      [idV]
    );
    return result.affectedRows > 0;
  }

  // Find voyage by tracking code
  static async findByCode(codeT) {
    const [rows] = await db.execute(
      'SELECT * FROM trips WHERE codeT = ?',
      [codeT]
    );
    
    if (rows.length > 0) {
      const voyage = rows[0];
      // Parse cities fields safely
      voyage.villePD = this.parseCitiesField(voyage.villePD);
      voyage.villePF = this.parseCitiesField(voyage.villePF);
      // Calculate current location based on current_city_index
      voyage.current_location = this.getCurrentLocation(voyage);
      return voyage;
    }
    
    return null;
  }
}

module.exports = Voyage;
