const db = require('../config/database');

class Account {
  static safeParse(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    try {
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) { return []; }
  }

  static async create(accountData) {
    const { user_id, nom, tel1, tel2w, bio, voiture, paysTrajet, guide, interdits, pricePerKg } = accountData;

    const [result] = await db.execute(
      `INSERT INTO account (user_id, nom, tel1, tel2w, bio, voiture, paysTrajet, guide, interdits, pricePerKg) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        nom || '',
        tel1 || '',
        tel2w || '',
        bio || '',
        voiture || '',
        typeof paysTrajet === 'string' ? paysTrajet : JSON.stringify(paysTrajet || []),
        typeof guide === 'string' ? guide : JSON.stringify(guide || []),
        typeof interdits === 'string' ? interdits : JSON.stringify(interdits || []),
        pricePerKg || 0
      ]
    );
    return result.insertId;
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

  static async getAll() {
    const [rows] = await db.execute('SELECT * FROM account');
    return rows.map(account => ({
      ...account,
      paysTrajet: this.safeParse(account.paysTrajet),
      guide: this.safeParse(account.guide),
      interdits: this.safeParse(account.interdits)
    }));
  }

  static async update(id, data) {
    const { nom, Tel1, Tel2W, Bio, voiture, pricePerKg, paysTrajet, guide, interdits } = data;

    const [result] = await db.execute(
      `UPDATE account SET 
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

  static async updatePaysTrajet(id, paysTrajet) {
    const [result] = await db.execute(
      'UPDATE account SET paysTrajet = ? WHERE id = ?',
      [Array.isArray(paysTrajet) ? JSON.stringify(paysTrajet) : '[]', id]
    );
    return result.affectedRows > 0;
  }

  static async updateGuide(id, guide) {
    const [result] = await db.execute(
      'UPDATE account SET guide = ? WHERE id = ?',
      [Array.isArray(guide) ? JSON.stringify(guide) : '[]', id]
    );
    return result.affectedRows > 0;
  }

  static async updateInterdits(id, interdits) {
    const [result] = await db.execute(
      'UPDATE account SET interdits = ? WHERE id = ?',
      [Array.isArray(interdits) ? JSON.stringify(interdits) : '[]', id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM account WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Account;