const mongoose = require('mongoose');

// Define the Document schema
const documentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  fileExtension: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  belongsToService: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  belongsToSubService: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubService',
    required: false,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  documentType: {
    type: String,
    enum: ['image', 'video', 'document'],
    required: true,
  }
}, { timestamps: true }); // Add createdAt and updatedAt timestamps

// Create the base Document model
const Document = mongoose.model('Document', documentSchema);

// Define the Content Strategy Document schema as a discriminator
const contentStrategyDocumentSchema = new mongoose.Schema({
  content_strategy_report_url: {
    type: String,
    required: false, // Optional field
  },
  created_for: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  report_for_month: {
    type: String,
    required: true,
    validate: {
      validator: function(value) {
        // Regex to match YYYY-MM format (e.g., 2024-10)
        return /^(19|20)\d{2}-(0[1-9]|1[0-2])$/.test(value);
      },
      message: props => `${props.value} is not a valid month. Please use the YYYY-MM format.`,
    }
  },
}, { timestamps: true });

// Create the ContentStrategyDocument model using discriminator
const ContentStrategyDocument = Document.discriminator('ContentStrategyDocument', contentStrategyDocumentSchema);

// Define the PostCreationDocument schema as a discriminator of Document
const postCreationDocumentSchema = new mongoose.Schema({
  post_image_urls: {
    type: [String], // Array of strings to hold image URLs
    required: true,
  },
  created_for: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  upload_date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  isUpcoming: {
    type: Boolean,
    default: function() {
      return this.upload_date > new Date();
    }
  }
}, { timestamps: true });

// Pre-save middleware to update isUpcoming field
postCreationDocumentSchema.pre('save', function(next) {
  this.isUpcoming = this.upload_date > new Date();
  next();
});

// Create the PostCreationDocument model using discriminator
const PostCreationDocument = Document.discriminator('PostCreationDocument', postCreationDocumentSchema);

// Export the models
module.exports = { Document, ContentStrategyDocument, PostCreationDocument };
