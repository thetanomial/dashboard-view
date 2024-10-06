// CustomError.js
const { StatusCodes } = require('http-status-codes');

class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode; // Set the status code
  }
}

// Create some predefined errors
class BadRequestError extends CustomError {
  constructor(message) {
    super(message || 'Bad Request', StatusCodes.BAD_REQUEST);
  }
}

class UnauthorizedError extends CustomError {
  constructor(message) {
    super(message || 'Unauthorized', StatusCodes.UNAUTHORIZED);
  }
}

class ForbiddenError extends CustomError {
  constructor(message) {
    super(message || 'Forbidden', StatusCodes.FORBIDDEN);
  }
}

class NotFoundError extends CustomError {
  constructor(message) {
    super(message || 'Not Found', StatusCodes.NOT_FOUND);
  }
}

module.exports = {
  CustomError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
};
