// middlewares/notFound.js
const notFound = (req, res, next) => {
    res.status(404).json({
      success: false,
      message: 'Resource not found',
    });
  };
  
  module.exports = notFound;
  