const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Service Schema
const serviceSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  subLinks: {
    type: [String],  // Array of strings
    required: true
  }
});

// Export the Service model
module.exports = mongoose.model('Service', serviceSchema);
