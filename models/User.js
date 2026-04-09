const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  // Create new user
  static async create(userData) {
    const { mail, mdp, role = 'TRANSPORTEUR' } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mdp, salt);

    const [result] = await db.execute(
      'INSERT INTO users (mail, mdp, role, created_at) VALUES (?, ?, ?, NOW())',
      [mail, hashedPassword, role]
    );

    return result.insertId;
  }

  // Find user by email (with password for verification)
  static async findByEmail(mail) {
    if (!mail) {
      return null;
    }
    
    const [rows] = await db.execute(
      'SELECT id, mail, mdp, role FROM users WHERE mail = ?',
      [mail]
    );
    return rows[0] || null;
  }

  // Find user by ID
  static async findById(id) {
    if (!id) {
      return null;
    }
    
    const [rows] = await db.execute(
      'SELECT id, mail, role FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Generate JWT token
  static generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });
  }

  // Get all users (admin only)
  static async getAll() {
    const [rows] = await db.execute(
      'SELECT id, mail, role, created_at FROM users'
    );
    return rows;
  }

  // Update user
  static async update(id, userData) {
    const { mail, role } = userData;
    const [result] = await db.execute(
      'UPDATE Users SET mail = ?, role = ? WHERE id = ?',
      [mail, role, id]
    );
    return result.affectedRows > 0;
  }

  // Delete user
  static async delete(id) {
    const [result] = await db.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = User;
