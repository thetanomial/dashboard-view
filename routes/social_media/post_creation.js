const express = require('express');
const multer = require('multer');
const { PostCreationDocument } = require('../../models/Document');
const User = require('../../models/User');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Set up Multer storage with memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const determineDocumentType = (fileExtension) => {
    // Define your document types based on file extensions
    const documentTypes = {
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      // Add more extensions and corresponding types as needed
    };
  
    return documentTypes[fileExtension.toLowerCase()] || 'unknown';
  };

// Middleware to validate the user
const validateUser = async (req, res, next) => {
  const { created_for } = req.body;
  try {
    const userExists = await User.findOne({ _id: created_for });
    if (!userExists) {
      return res.status(400).json({ message: 'User does not exist' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error validating user', error });
  }
};

// Route to upload multiple images and save PostCreationDocuments to MongoDB
// Route to upload multiple images and save PostCreationDocuments to MongoDB
// Route to upload multiple images and save PostCreationDocuments to MongoDB
router.post('/upload', upload.array('images', 10), validateUser, async (req, res) => {
    try {
        const { created_for, service, subService } = req.body;

        // Ensure all required fields are present
        if (!created_for || !service || !req.files.length) {
            return res.status(400).json({
                message: 'Missing required fields: created_for, service, and images are required.'
            });
        }

        // Prepare an array to hold the upload promises
        const uploadPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                const fileExtension = file.originalname.split('.').pop(); // Get file extension
                const documentType = determineDocumentType(fileExtension); // Determine document type

                // Upload to Cloudinary
                cloudinary.uploader.upload_stream(
                    {
                        folder: 'post_creation', // Specify your folder in Cloudinary
                        resource_type: 'image', // Set resource type to image
                    },
                    (error, result) => {
                        if (error) {
                            return reject(error);
                        }
                        resolve({
                            secure_url: result.secure_url,
                            documentType, // Return the document type as well
                            fileExtension // Return the file extension as well
                        });
                    }
                ).end(file.buffer);
            });
        });

        // Upload all files and wait for completion
        const uploadedImages = await Promise.all(uploadPromises);

        // Extract URLs, document types, and file extensions
        const uploadedImageUrls = uploadedImages.map(img => img.secure_url);
        const documentTypes = uploadedImages.map(img => img.documentType);
        const fileExtensions = uploadedImages.map(img => img.fileExtension);

        // Create a new PostCreationDocument with all required fields
        const newPost = new PostCreationDocument({
            post_image_urls: uploadedImageUrls,
            created_for: created_for,
            belongsToService: service,
            belongsToSubService: subService || null, // Use null if subService is not provided
            uploadedBy: req.user.id, // Assuming req.user.id is set during authentication
            documentType: documentTypes[0], // Assuming all uploaded files have the same type
            // Add additional required fields if necessary
            fileName: req.files[0].originalname, // Example of how to extract fileName
            fileExtension: fileExtensions[0], // Use the extension of the first file
            fileSize: req.files[0].size, // Size of the first file (you may want to adjust this logic)
            fileUrl: uploadedImageUrls[0], // Assuming you want to set the URL of the first file
        });

        // Save the new post document to MongoDB
        const savedPost = await newPost.save();

        res.status(201).json({
            message: 'Post created successfully',
            post: savedPost,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error uploading post', error });
    }
});


  

// Route to update an existing PostCreationDocument
router.put('/update/:id', upload.array('images', 10), validateUser, async (req, res) => {
  try {
    const { id } = req.params; // Document ID from URL params
    const { created_for } = req.body; // Optional additional fields

    // Find the existing document by its ID
    const existingPost = await PostCreationDocument.findById(id);
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // If files are provided in the request, process them
    if (req.files && req.files.length > 0) {
      // Prepare an array to hold the upload promises for multiple files
      const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'post_creation', // Specify your folder in Cloudinary
              resource_type: 'image', // Set resource type to image
            },
            (error, result) => {
              if (error) {
                return reject(error);
              }
              resolve(result.secure_url); // Return the secure URL of the uploaded image
            }
          ).end(file.buffer);
        });
      });

      // Upload all new files and wait for completion
      const uploadedImageUrls = await Promise.all(uploadPromises);

      // Update the document with the new image URLs
      existingPost.post_image_urls = uploadedImageUrls; // Update with new image URLs
    }

    // Update other fields if provided
    existingPost.created_for = created_for || existingPost.created_for;

    // Save the updated document
    const updatedPost = await existingPost.save();

    res.status(200).json({
      message: 'Post updated successfully',
      post: updatedPost,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error updating post', error });
  }
});

// Route to delete a PostCreationDocument
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params; // Document ID from URL params

    // Find the existing document by its ID
    const existingPost = await PostCreationDocument.findById(id);
    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Delete each image from Cloudinary
    const deletePromises = existingPost.post_image_urls.map(url => {
      const publicId = url.split('/').pop().split('.')[0];
      return cloudinary.uploader.destroy(`post_creation/${publicId}`);
    });

    await Promise.all(deletePromises); // Wait for all deletions to complete

    // Delete the document from MongoDB
    await PostCreationDocument.findByIdAndDelete(id);

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error deleting post', error });
  }
});

module.exports = router;
