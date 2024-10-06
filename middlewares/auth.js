const jwt = require('jsonwebtoken');
const dotenv = require('dotenv')

dotenv.config()

// Middleware to protect routes
module.exports = function(req, res, next) {
  // Get the token from the header
  const token = req.header('authorization').split(" ")[1];


  // Check if token is missing
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
} catch (err) {
      console.log(err)
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
