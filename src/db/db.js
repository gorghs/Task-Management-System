const { Pool } = require('pg');

// Create a connection pool using environment variables defined in .env
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Listener for connection errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1); // Exit process if a serious pool error occurs
});

console.log('PostgreSQL Connection Pool Initialized.');

module.exports = {
  // Standard query execution (runs a single query and returns the client to the pool)
  query: (text, params) => {
    console.log('EXECUTING QUERY:', text.substring(0, 80));
    return pool.query(text, params);
  },
  // Method to get a dedicated client for handling transactions (used in our updateTaskStatus logic)
  getClient: () => pool.connect(),
};
