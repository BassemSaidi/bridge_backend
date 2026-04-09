const db = require('../config/database');

class Colis {
  // Create new colis
  static async create(colisData) {
    const {
      voyage_id,
      nomS,
      TelS,
      adresseS,
      detailsS,
      nomR,
      TelR,
      adresseR,
      detailsR, 
      KgCo, 
      nb_box,
      prixTotale, 
      payementStatus = 'TO PAY'
    } = colisData;

    const [result] = await db.execute(
      `INSERT INTO Colis (voyage_id, nomS, TelS, adresseS, detailsS, nomR, TelR, adresseR, detailsR, KgCo, nb_box, prixTotale, payementStatus) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        voyage_id,
        nomS,
        TelS,
        adresseS,
        detailsS,
        nomR,
        TelR,
        adresseR,
        detailsR,
        KgCo,
        nb_box,
        prixTotale,
        payementStatus,
      ]
    );

    return result.insertId;
  }

  // Find colis by ID
  static async findById(idCo) {
    const [rows] = await db.execute(
      `SELECT c.*, v.PaysD, v.PaysF, v.DateD, a.nom as transporteur_name 
       FROM colis c 
       JOIN trips v ON c.voyage_id = v.idV 
       JOIN Account a ON v.account_id = a.id 
       WHERE c.idCo = ?`,
      [idCo]
    );
    
    if (rows.length > 0) {
      const colis = rows[0];
      // Removed photoCo parsing since it's no longer in database
      return colis;
    }
    
    return null;
  }

  // Get colis by voyage ID
  static async findByVoyageId(voyage_id) {
    const [rows] = await db.execute(
      'SELECT * FROM colis WHERE voyage_id = ?',
      [voyage_id]
    );
    
    // Return colis data without photoCo parsing
    return rows;
  }

  // Get all colis
  static async getAll() {
    const [rows] = await db.execute(
      `SELECT c.*, v.PaysD, v.PaysF, v.DateD, a.nom as transporteur_name 
       FROM colis c 
       JOIN trips v ON c.voyage_id = v.idV 
       JOIN Account a ON v.account_id = a.id 
       ORDER BY c.created_at DESC`
    );
    
    // Return colis data without photoCo parsing
    return rows;
  }

  // Get colis by payment status
  static async getByPaymentStatus(payementStatus) {
    const [rows] = await db.execute(
      `SELECT c.*, v.PaysD, v.PaysF, v.DateD, a.nom as transporteur_name 
       FROM colis c 
       JOIN trips v ON c.voyage_id = v.idV 
       JOIN Account a ON v.account_id = a.id 
       WHERE c.payementStatus = ? 
       ORDER BY c.created_at DESC`,
      [payementStatus]
    );
    
    // Return colis data without photoCo parsing
    return rows;
  }

  // Update colis
  static async update(idCo, colisData) {
    const {
      nomS, 
      TelS, 
      adresseS, 
      detailsS, 
      nomR, 
      TelR, 
      adresseR, 
      detailsR, 
      KgCo, 
      nb_box,
      prixTotale, 
      payementStatus,
      status
    } = colisData;

    // Build dynamic SQL query based on provided fields
    const updateFields = [];
    const values = [];

    if (nomS !== undefined) {
      updateFields.push('nomS = ?');
      values.push(nomS);
    }
    if (TelS !== undefined) {
      updateFields.push('TelS = ?');
      values.push(TelS);
    }
    if (adresseS !== undefined) {
      updateFields.push('adresseS = ?');
      values.push(adresseS);
    }
    if (detailsS !== undefined) {
      updateFields.push('detailsS = ?');
      values.push(detailsS);
    }
    if (nomR !== undefined) {
      updateFields.push('nomR = ?');
      values.push(nomR);
    }
    if (TelR !== undefined) {
      updateFields.push('TelR = ?');
      values.push(TelR);
    }
    if (adresseR !== undefined) {
      updateFields.push('adresseR = ?');
      values.push(adresseR);
    }
    if (detailsR !== undefined) {
      updateFields.push('detailsR = ?');
      values.push(detailsR);
    }
    if (KgCo !== undefined) {
      updateFields.push('KgCo = ?');
      values.push(KgCo);
    }
    if (nb_box !== undefined) {
      updateFields.push('nb_box = ?');
      values.push(nb_box);
    }
    if (prixTotale !== undefined) {
      updateFields.push('prixTotale = ?');
      values.push(prixTotale);
    }
    if (payementStatus !== undefined) {
      updateFields.push('payementStatus = ?');
      values.push(payementStatus);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      values.push(status);
    }

    if (updateFields.length === 0) {
      return false; // No fields to update
    }

    // Add idCo at the end for WHERE clause
    values.push(idCo);

    const sql = `UPDATE Colis SET ${updateFields.join(', ')} WHERE idCo = ?`;

    const [result] = await db.execute(sql, values);

    return result.affectedRows > 0;
  }

  // Update payment status
  static async updatePaymentStatus(idCo, payementStatus) {
    const [result] = await db.execute(
      'UPDATE Colis SET payementStatus = ? WHERE idCo = ?',
      [payementStatus, idCo]
    );
    return result.affectedRows > 0;
  }

  // Delete colis
  static async delete(idCo) {
    const [result] = await db.execute(
      'DELETE FROM colis WHERE idCo = ?',
      [idCo]
    );
    return result.affectedRows > 0;
  }

  // Get colis statistics
  static async getStats(voyage_id = null) {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(KgCo) as total_weight,
        SUM(prixTotale) as total_revenue,
        SUM(CASE WHEN payementStatus = 'PAID' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN payementStatus = 'TO PAY' THEN 1 ELSE 0 END) as to_pay
      FROM colis
    `;
    
    const params = [];
    if (voyage_id) {
      query += ' WHERE voyage_id = ?';
      params.push(voyage_id);
    }
    
    const [rows] = await db.execute(query, params);
    return rows[0];
  }

  // Search colis
  static async search(searchTerm) {
    const [rows] = await db.execute(
      `SELECT c.*, v.PaysD, v.PaysF, a.nom as transporteur_name 
       FROM colis c 
       JOIN trips v ON c.voyage_id = v.idV 
       JOIN Account a ON v.account_id = a.id 
       WHERE c.nomS LIKE ? OR c.nomR LIKE ? OR c.TelS LIKE ? OR c.TelR LIKE ?
       ORDER BY c.created_at DESC`,
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    
    // Return colis data without photoCo parsing
    return rows;
  }
}

module.exports = Colis;
