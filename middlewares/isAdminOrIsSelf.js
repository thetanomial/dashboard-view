const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Middleware to ensure the user is either an admin or accessing their own model
module.exports = function (req, res, next) {
  try {
    // Get the token from the header
    const token = req.header('authorization').split(" ")[1];

    // Check if token is missing
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user ID from the token
    const userIdFromToken = decoded.user.id;

    // Get the user ID from the request parameters (e.g., /users/:id)
    const userIdFromParams = req.params.id;

    // Check if the user is an admin
    const isAdmin = decoded.user.role === 'admin';

    // Check if the user is accessing their own model
    const isSelf = userIdFromToken === userIdFromParams;

    // Allow access if the user is an admin or accessing their own model
    if (isAdmin || isSelf) {
      // Attach the user object to the request for further use
      req.user = decoded.user;
      return next();
    }

    // Deny access if neither condition is met
    return res.status(403).json({ msg: 'Access denied. You are not authorized to access this resource.' });

  } catch (err) {
    console.error(err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
