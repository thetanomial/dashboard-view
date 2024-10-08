const cron = require('node-cron');
const { PostCreationDocument } = require('../models/Document');
// Schedule a task to run daily at midnight
const scheduleUpcomingPostsUpdate = () => {
// Change the schedule to run every 10 seconds for testing
cron.schedule('0 0 * * *', async () => {
    try {
      const today = new Date();

      // Find all posts where isUpcoming is true and upload_date is in the past
      const upcomingPosts = await PostCreationDocument.find({
        isUpcoming: true,
        upload_date: { $lte: today },
      });

      // Update the isUpcoming field to false for those posts
      if (upcomingPosts.length > 0) {
        await PostCreationDocument.updateMany(
          { _id: { $in: upcomingPosts.map(post => post._id) } },
          { $set: { isUpcoming: false } }
        );
        console.log(`${upcomingPosts.length} posts updated as not upcoming`);
      } else {
        console.log('No upcoming posts to update');
      }
    } catch (error) {
      console.error('Error updating upcoming posts:', error);
    }
  });
  
};

// Export the cron job function
module.exports = scheduleUpcomingPostsUpdate
