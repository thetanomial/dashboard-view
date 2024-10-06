const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the SubService Schema
const subServiceSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  parentService: {
    type: Schema.Types.ObjectId, // Reference to the Service model
    ref: 'Service',               // Reference name for the Service model
    required: true                // Ensure that each SubService must have a parent Service
  }
});

// Export the SubService model
module.exports = mongoose.model('SubService', subServiceSchema);
