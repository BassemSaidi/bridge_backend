const db = require('../config/database');

class Account {
  static safeParse(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) { return []; }
  }

  static async findByUserId(user_id) {
    const [rows] = await db.execute('SELECT * FROM account WHERE user_id = ?', [user_id]);
    if (rows.length > 0) {
      const account = rows[0];
      account.paysTrajet = this.safeParse(account.paysTrajet);
      account.guide = this.safeParse(account.guide);
      account.interdits = this.safeParse(account.interdits);
      return account;
    }
    return null;
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM account WHERE id = ?', [id]);
    if (rows.length > 0) {
      const account = rows[0];
      account.paysTrajet = this.safeParse(account.paysTrajet);
      account.guide = this.safeParse(account.guide);
      account.interdits = this.safeParse(account.interdits);
      return account;
    }
    return null;
  }

  static async update(id, data) {
    const { nom, Tel1, Tel2W, Bio, voiture, pricePerKg, paysTrajet, guide, interdits } = data;

    const [result] = await db.execute(
      `UPDATE Account SET 
        nom = ?, Tel1 = ?, Tel2W = ?, Bio = ?, voiture = ?, 
        pricePerKg = ?, paysTrajet = ?, guide = ?, interdits = ? 
       WHERE id = ?`,
      [
        nom || null, 
        Tel1 || null, 
        Tel2W || null, 
        Bio || null, 
        voiture || null, 
        pricePerKg || 0,
        Array.isArray(paysTrajet) ? JSON.stringify(paysTrajet) : '[]', 
        Array.isArray(guide) ? JSON.stringify(guide) : '[]', 
        Array.isArray(interdits) ? JSON.stringify(interdits) : '[]', 
        id
      ]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Account;