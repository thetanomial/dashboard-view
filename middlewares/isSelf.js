const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Middleware to ensure the user can access their own model
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

    // Get the user ID from the token
    const userIdFromToken = decoded.user.id;

    console.log(userIdFromToken)

    // console.log(userIdFromToken,userIdFromParams)

    // Get the user ID from the request parameters (e.g., /users/:id)
    const userIdFromParams = req.params.id;

    // Check if the user is trying to access their own model
    if (userIdFromToken !== userIdFromParams) {
      return res.status(403).json({ msg: 'Access denied. You can only access your own profile.' });
    }

    // Attach the user object to the request for further use
    req.user = decoded.user;
    next();

  } catch (err) {
    console.error(err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
