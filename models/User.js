const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const serviceSchema = require('./Service').schema;

// Define the User Schema
const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  services: {
    type: [serviceSchema],
    default: []
  },
  changePasswordToken: {
    type: String,  // This will store a random 6-digit code
  }
});

// Pre-save hook to generate a random 6-digit token when a new user is created
userSchema.pre('save', function (next) {
  if (!this.changePasswordToken) {
    this.changePasswordToken = Math.floor(100000 + Math.random() * 900000).toString();
  }
  next();
});

// Export the User model
module.exports = mongoose.model('User', userSchema);
