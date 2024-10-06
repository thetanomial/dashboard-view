// Import the express module
const express = require('express');
require('express-async-errors')
const dotenv = require('dotenv')
dotenv.config()
// Create an instance of an Express app
const app = express();
const authRouter = require('./routes/auth.js');
const userRouter = require('./routes/user.js');
const connectDB = require('./db/config.js');
const authMiddleware = require('./middlewares/auth.js');
const isAdmin = require('./middlewares/isAdmin.js');
const notFound = require('./middlewares/notFound.js');
const errorHandler = require('./middlewares/errorHandler.js');


// Define a port for the app to listen on
const port = process.env.PORT;

app.use(express.json())

// Define a basic route that responds with "Hello, World!"
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use('/api/auth', authRouter);
app.use('/api/user',authMiddleware,userRouter);

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