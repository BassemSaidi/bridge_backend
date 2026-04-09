const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Create admin user with properly hashed password
const createAdmin = async () => {
  try {
    const adminEmail = 'admin@bridgetn.com';
    const adminPassword = 'admin123'; // Change this in production!
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    // Insert admin user
    const [result] = await db.execute(
      'INSERT INTO users (mail, mdp, role) VALUES (?, ?, ?)',
      [adminEmail, hashedPassword, 'ADMIN']
    );
    
    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`🆔 User ID: ${result.insertId}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password in production!');
    console.log('📝 To create a new admin with different credentials, edit this file.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  createAdmin();
}

module.exports = createAdmin;
