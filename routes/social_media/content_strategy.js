const express = require('express');
const multer = require('multer');
const Service = require('../../models/Service');
const SubService = require('../../models/SubService');
const { ContentStrategyDocument } = require('../../models/Document'); // Updated import
const User = require('../../models/User');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Set up Multer storage with memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware to validate service and subservice for content strategy
const validateServiceAndSubService = async (req, res, next) => {
  try {
    const socialMediaService = await Service.findOne({ name: 'Social Media' });
    const contentStrategySubService = await SubService.findOne({ name: 'Content Strategy', parentService: socialMediaService._id });
    
    if (!socialMediaService || !contentStrategySubService) {
      return res.status(400).json({ message: 'Invalid service or subservice' });
    }

    req.belongsToService = socialMediaService._id;
    req.belongsToSubService = contentStrategySubService._id;

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error validating service and subservice', error });
  }
};

// Utility function to determine document type based on file extension
const determineDocumentType = (fileExtension) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'];
  const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'wmv'];
  
  if (imageExtensions.includes(fileExtension.toLowerCase())) {
    return 'image';
  }
  if (videoExtensions.includes(fileExtension.toLowerCase())) {
    return 'video';
  }
  return 'document'; // Default to 'document' for other types of files
};

// Route to upload files and save ContentStrategyDocuments to MongoDB
router.post('/upload', upload.array('files', 10), validateServiceAndSubService, async (req, res) => {
  try {
    const { created_for, report_for_month } = req.body; // Updated to match your required fields

    const userExists = await User.findOne({ _id: created_for });
    if (!userExists) {
      return res.status(400).json({ message: 'User does not exist' });
    }

    if (req.files.length === 0) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Prepare an array to hold the upload promises
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'social_media',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve({
              fileName: result.original_filename,
              fileExtension: result.format,
              fileSize: result.bytes,
              fileUrl: result.secure_url,
              content_strategy_report_url: result.secure_url // Take this from Cloudinary's response
            });
          }
        ).end(file.buffer);
      });
    });

    // Upload all files and wait for completion
    const uploadedFiles = await Promise.all(uploadPromises);

    // Save each file's information as a content strategy document in MongoDB
    const savedDocuments = await Promise.all(
      uploadedFiles.map(async file => {
        const documentType = determineDocumentType(file.fileExtension);
        const newDocument = new ContentStrategyDocument({ // Updated to new model name
          fileName: file.fileName,
          fileExtension: file.fileExtension,
          fileSize: file.fileSize,
          fileUrl: file.fileUrl,
          belongsToService: req.belongsToService,
          belongsToSubService: req.belongsToSubService,
          uploadedBy: req.user.id,
          created_for,
          report_for_month, // Updated to match your required fields
          documentType,
          content_strategy_report_url: file.content_strategy_report_url
        });
        return await newDocument.save();
      })
    );

    res.status(201).json({
      message: 'Content strategy documents uploaded and saved successfully',
      documents: savedDocuments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error uploading documents', error });
  }
});

// Route to update a ContentStrategyDocument and optionally replace the report URL in Cloudinary
router.put('/update/:id', upload.array('files', 10), validateServiceAndSubService, async (req, res) => {
  try {
    const { id } = req.params; // Document ID from URL params
    const { created_for, report_for_month } = req.body; // Updated to match your required fields

    const userExists = await User.findOne({ _id: created_for });
    if (!userExists) {
      return res.status(400).json({ message: 'User does not exist' });
    }

    // Find the existing document by its ID
    const existingDocument = await ContentStrategyDocument.findById(id); // Updated to new model name
    if (!existingDocument) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // If files are provided in the request, process them
    if (req.files && req.files.length > 0) {
      // Extract the public ID from the current Cloudinary URL to delete it
      const publicId = existingDocument.content_strategy_report_url.split('/').pop().split('.')[0];

      // Delete the old file(s) from Cloudinary
      await cloudinary.uploader.destroy(`social_media/${publicId}`, (error, result) => {
        if (error) {
          console.log('Error deleting old file from Cloudinary:', error);
        } else {
          console.log('Old file deleted from Cloudinary:', result);
        }
      });

      // Prepare an array to hold the upload promises for multiple files
      const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'social_media',
              resource_type: 'auto',
            },
            (error, result) => {
              if (error) {
                return reject(error);
              }
              resolve({
                fileName: result.original_filename,
                fileExtension: result.format,
                fileSize: result.bytes,
                fileUrl: result.secure_url,
                content_strategy_report_url: result.secure_url
              });
            }
          ).end(file.buffer);
        });
      });

      // Upload all new files and wait for completion
      const uploadedFiles = await Promise.all(uploadPromises);

      // Update the document with the new file details
      existingDocument.fileName = uploadedFiles[0].fileName; // Use first file's info as representative
      existingDocument.fileExtension = uploadedFiles[0].fileExtension;
      existingDocument.fileSize = uploadedFiles[0].fileSize;
      existingDocument.fileUrl = uploadedFiles[0].fileUrl;
      existingDocument.content_strategy_report_url = uploadedFiles[0].content_strategy_report_url; // New report URL for first file
    }

    // Update the document fields even if no new files are uploaded
    existingDocument.created_for = created_for || existingDocument.created_for; // Update if provided
    existingDocument.report_for_month = report_for_month || existingDocument.report_for_month; // Update if provided

    // Save the updated document
    const updatedDocument = await existingDocument.save();

    res.status(200).json({
      message: 'Document updated successfully',
      document: updatedDocument,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error updating document', error });
  }
});

module.exports = router;
