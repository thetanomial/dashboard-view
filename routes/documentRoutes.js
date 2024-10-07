const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Document = require('../models/Document'); // Import the Document model
const router = express.Router();

// Set up Multer storage with memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

// Route to handle file uploads and save document info to MongoDB
router.post('/upload', upload.array('files', 10), async (req, res) => {
  try {
    const { belongsToService, belongsToSubService } = req.body;

    // Prepare an array to hold the upload promises
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'your_folder_name', // Specify your folder in Cloudinary
            resource_type: 'auto', // Auto-detect the file type (image, video, etc.)
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
            });
          }
        ).end(file.buffer);
      });
    });

    // Upload all files and wait for completion
    const uploadedFiles = await Promise.all(uploadPromises);

    // Save each file's information as a document in MongoDB
    const savedDocuments = await Promise.all(
      uploadedFiles.map(async file => {
        const documentType = determineDocumentType(file.fileExtension); // Determine documentType
        const newDocument = new Document({
          fileName: file.fileName,
          fileExtension: file.fileExtension,
          fileSize: file.fileSize,
          fileUrl: file.fileUrl,
          belongsToService,
          belongsToSubService: belongsToSubService || null,
          uploadedBy: req.user.id,
          documentType, // Set documentType based on file extension
        });
        return await newDocument.save();
      })
    );

    res.status(201).json({
      message: 'Documents uploaded and saved successfully',
      documents: savedDocuments,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading documents', error });
  }
});

module.exports = router;
