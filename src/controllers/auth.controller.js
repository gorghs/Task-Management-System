const authService = require('../services/auth.service');

// Controller for POST /v1/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const newUser = await authService.register(name, email, password);

    // Remove password hash before sending the response for security
    // eslint-disable-next-line no-unused-vars
    const { password_hash, ...responseUser } = newUser;

    res.status(201).json({
      message: 'Registration successful. Please log in.',
      user: responseUser
    });

  } catch (error) {
    // Handle custom service errors (e.g., email already registered)
    if (error.message.includes('registered')) {
      return res.status(409).json({ message: error.message }); // 409 Conflict
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  }
};

// Controller for POST /v1/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const { token, user_id, name } = await authService.login(email, password);

    // Respond with the JWT token the client needs for all future requests
    res.status(200).json({
      message: 'Login successful.',
      token: token,
      user_id: user_id,
      name: name
    });

  } catch (error) {
    // Handle custom service errors (e.g., invalid credentials)
    if (error.message.includes('Invalid credentials')) {
      return res.status(401).json({ message: error.message }); // 401 Unauthorized
    }
    console.error('Login error:', error);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  }
};
