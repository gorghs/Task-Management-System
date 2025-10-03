const jwt = require('jsonwebtoken');

// Middleware function to authenticate JWT token
module.exports = (req, res, next) => {
  // 1. Get the token from the Authorization header (e.g., "Bearer <token>")
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    // If no header is present, access is denied (401 Unauthorized)
    return res.status(401).json({ message: 'Access denied. No authentication token provided.' });
  }

  // Split "Bearer " from the token string
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token is malformed.' });
  }

  try {
    // 2. Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach the decoded user payload (which contains user_id) to the request object
    // This makes req.user.user_id available to all subsequent controllers
    req.user = decoded;

    // 4. Move to the next middleware or the route handler
    next();
  } catch (ex) {
    // Handle expired tokens, invalid signatures, etc.
    console.error('JWT Verification Failed:', ex.message);
    return res.status(403).json({ message: 'Invalid or expired token. Please log in again.' }); // 403 Forbidden
  }
};
