// Import the express module
const express = require('express');
require('express-async-errors')
const dotenv = require('dotenv')
dotenv.config()
// Create an instance of an Express app
const app = express();
const authRouter = require('./routes/auth.js');
const userRouter = require('./routes/user.js');
const servicesRouter = require('./routes/services.js');
const subServicesRouter = require('./routes/subServices.js');
const connectDB = require('./db/config.js');
const authMiddleware = require('./middlewares/auth.js');
const isAdmin = require('./middlewares/isAdmin.js');
const notFound = require('./middlewares/notFound.js');
const errorHandler = require('./middlewares/errorHandler.js');
const subService = require('./models/subService.js');


// Define a port for the app to listen on
const port = process.env.PORT;

app.use(express.json())

// Define a basic route that responds with "Hello, World!"


// Set the view engine to ejs
app.set('view engine', 'ejs');
// Set the path to the views folder
app.set('views', __dirname + '/views');
// Set the path to the public folder
app.use(express.static('public'));


app.get('/', (req, res) => {
  res.render('index.ejs');
});


app.use('/api/auth', authRouter);
app.use('/api/user',authMiddleware,userRouter);
app.use('/api/services',isAdmin,servicesRouter);
app.use('/api/subServices',isAdmin,subServicesRouter);

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