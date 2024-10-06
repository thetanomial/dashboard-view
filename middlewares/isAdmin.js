const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Middleware to protect routes and check for admin role
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

    // Check if the user has the admin role
    if (decoded.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admins only.' });
    }

    // Attach the user object to the request for further use
    req.user = decoded.user;
    next();
    
  } catch (err) {
    console.error(err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
