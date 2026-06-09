const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bridgetn',
  // 1. Updated default port to 4000 for TiDB
  port: process.env.DB_PORT || 4000, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  
  // 2. 🔐 Added SSL configuration for TiDB Cloud
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
  
  // 3. Removed acquireTimeout, timeout, and reconnect to clear warnings
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;