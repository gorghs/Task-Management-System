const db = require('../db/db');
const bcrypt = require('bcryptjs'); // For secure password hashing
const jwt = require('jsonwebtoken'); // For creating session tokens

const SALT_ROUNDS = 10; // Standard salt rounds for bcrypt

/**
 * Handles user registration by hashing the password and inserting the user into the DB.
 */
async function register(name, email, password) {
  // 1. Hash the password securely
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 2. Insert into the users table
  try {
    const query = `
            INSERT INTO users (name, email, password_hash) 
            VALUES ($1, $2, $3) 
            RETURNING user_id, name, email, registration_date
        `;
    const result = await db.query(query, [name, email, passwordHash]);
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique violation error code
      // Show a professional error message if email already exists
      throw new Error('Email address is already registered.');
    }
    throw error;
  }
}

/**
 * Handles user login by verifying credentials and issuing a JWT.
 */
async function login(email, password) {
  // 1. Find the user by email
  const userResult = await db.query('SELECT user_id, password_hash, name FROM users WHERE email = $1', [email]);
  const user = userResult.rows[0];

  if (!user) {
    throw new Error('Invalid credentials.');
  }

  // 2. Compare the provided password with the stored hash
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid credentials.');
  }

  // 3. Generate a JWT token (our session)
  const token = jwt.sign(
    { user_id: user.user_id, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days (standard practice)
  );

  return { token, user_id: user.user_id, name: user.name };
}

module.exports = { register, login };
