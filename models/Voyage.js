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
      status = 'SCHEDULED', 
      codeT 
    } = voyageData;

    const [result] = await db.execute(
      `INSERT INTO Voyage (account_id, PaysD, villePD, PaysF, villePF, DateD, DateF, status, codeT) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        villePF: this.parseCitiesField(voyage.villePF)
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
       JOIN Account a ON v.account_id = a.id 
       ORDER BY v.DateD DESC`
    );
    
    // Parse cities fields safely for all voyages
    return rows.map(voyage => ({
      ...voyage,
      villePD: this.parseCitiesField(voyage.villePD),
      villePF: this.parseCitiesField(voyage.villePF)
    }));
  }

  // Get active voyages
  static async getActive() {
    const [rows] = await db.execute(
      `SELECT v.*, a.nom as account_name, a.voiture 
       FROM trips v 
       JOIN Account a ON v.account_id = a.id 
       WHERE v.status IN ('SCHEDULED', 'IN_PROGRESS') 
       ORDER BY v.DateD ASC`
    );
    
    // Parse cities fields safely for all voyages
    return rows.map(voyage => ({
      ...voyage,
      villePD: this.parseCitiesField(voyage.villePD),
      villePF: this.parseCitiesField(voyage.villePF)
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
      codeT 
    } = voyageData;

    const [result] = await db.execute(
      `UPDATE Voyage SET 
        PaysD = ?, villePD = ?, PaysF = ?, villePF = ?, 
        DateD = ?, DateF = ?, status = ?, codeT = ? 
       WHERE idV = ?`,
      [
        PaysD,
        JSON.stringify(villePD),
        PaysF,
        JSON.stringify(villePF),
        DateD,
        DateF,
        status,
        codeT,
        idV
      ]
    );

    return result.affectedRows > 0;
  }

  // Update voyage status
  static async updateStatus(idV, status) {
    const [result] = await db.execute(
      'UPDATE Voyage SET status = ? WHERE idV = ?',
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
}

module.exports = Voyage;
