const express = require('express');
const router = express.Router();

const contentStrategyRoutes = require('./content_strategy');
const postCreationRoutes = require('./post_creation');

// Route for content strategy
router.use('/content_strategy', contentStrategyRoutes);
router.use('/post_creation', postCreationRoutes);

// Add more routes as needed
// router.use('/other_route', otherRoute);

module.exports = router;
