// Import the required modules
const express = require('express');
require('express-async-errors');
const dotenv = require('dotenv');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const connectDB = require('./db/config.js');
const authRouter = require('./routes/auth.js');
const userRouter = require('./routes/user.js');
const servicesRouter = require('./routes/services.js');
const subServicesRouter = require('./routes/subServices.js');
const userSubscriptionsRouter = require('./routes/userSubscriptions.js');
const documentRoutes = require('./routes/documentRoutes.js');
const authMiddleware = require('./middlewares/auth.js');
const isAdmin = require('./middlewares/isAdmin.js');
const notFound = require('./middlewares/notFound.js');
const errorHandler = require('./middlewares/errorHandler.js');
const socialMediaContentStrategyRouter = require('./routes/social_media/content_strategy.js');


// Load environment variables
dotenv.config();

// Create an instance of an Express app
const app = express();

// Define a port for the app to listen on
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Multer storage with memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define an upload route for multiple files
app.post('/upload', upload.array('files', 10), async (req, res) => {
  try {
    const fileInfos = await Promise.all(
      req.files.map(file => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'your_folder_name', // Specify your folder name in Cloudinary
            },
            (error, result) => {
              if (error) {
                return reject(error);
              }
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
              });
            }
          ).end(file.buffer); // Pass the buffer to upload
        });
      })
    );

    res.status(200).json({
      message: 'Files uploaded successfully',
      files: fileInfos,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set the view engine to ejs and specify the views folder
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Serve static files from the public directory
app.use(express.static('public'));

// Define a route to render the main page
app.get('/', (req, res) => {
  res.render('index.ejs');
});

// Set up the API routes
app.use('/api/auth', authRouter);
app.use('/api/user', authMiddleware, userRouter);
app.use('/api/services', isAdmin, servicesRouter);
app.use('/api/services/social_media', isAdmin, require("./routes/social_media"));
app.use('/api/subServices', isAdmin, subServicesRouter);
app.use('/api/userSubscriptions', isAdmin, userSubscriptionsRouter);
app.use('/api/documents', authMiddleware, documentRoutes);

// Not Found Middleware
app.use(notFound);

// Error Handling Middleware
app.use(errorHandler);

// Start the server and listen on the specified port
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
});
