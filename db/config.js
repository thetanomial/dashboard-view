const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Connection function to MongoDB Atlas
const connectDB = async () => {
  try {
    // Replace with your MongoDB Atlas connection string
    const mongoURI = process.env.MONGO_URI + `/${process.env.COLLECTION_NAME}`;

    // Mongoose connection
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    // Exit process with failure if connection fails
    process.exit(1);
  }
};

// Export the connect function
module.exports = connectDB;
