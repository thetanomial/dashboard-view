const mongoose = require('mongoose');

// Define the Document schema
const documentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true, // Make it required if needed
  },
  fileExtension: {
    type: String,
    required: true, // Make it required if needed
  },
  fileSize: {
    type: Number,
    required: true, // Make it required if needed
  },
  fileUrl: {
    type: String,
    required: true, // Assuming the URL should be required
  },
  belongsToService: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service', // Reference to the Service model
    required: true, // Make it required if needed
  },
  belongsToSubService: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubService', // Reference to the SubService model
    required: false, // Optional field
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true, // Assuming the uploader should be required
  },
  documentType: {
    type: String,
    enum: ['image', 'video', 'document'], // Allowed values for documentType
    required: true, // Making it required
  }
}, { timestamps: true }); // Add createdAt and updatedAt timestamps

// Create the Document model
const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
