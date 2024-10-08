

const moment = require('moment'); // Use moment.js for date manipulation
const { PostCreationDocument } = require('./models/Document.js');
// Function to classify upload date
function classifyUploadDate(uploadDate) {
  const today = moment().startOf('day');
  const yesterday = moment().subtract(1, 'days').startOf('day');
  const startOfWeek = moment().startOf('week'); // Adjust to 'isoWeek' if you want to start on Monday
  const endOfWeek = moment().endOf('week');
  const uploadDateMoment = moment(uploadDate).startOf('day');

  if (uploadDateMoment.isSame(today, 'day')) {
    return 'Today';
  } else if (uploadDateMoment.isSame(yesterday, 'day')) {
    return 'Yesterday';
  } else if (uploadDateMoment.isBetween(startOfWeek, endOfWeek, null, '[]')) {
    return 'This Week';
  } else if (uploadDateMoment.isAfter(moment().subtract(7, 'days').startOf('day')) && uploadDateMoment.isBefore(startOfWeek)) {
    return 'Last Week';
  } else if (uploadDateMoment.isSame(moment(), 'month')) {
    return 'This Month';
  } else if (uploadDateMoment.isSame(moment(), 'year')) {
    return 'This Year';
  } else {
    // For posts older than a week, show the specific date in a readable format
    return uploadDateMoment.format('D MMMM YYYY');
  }
}

// Function to classify the month
function classifyUploadMonth(uploadDate) {
  const uploadDateMoment = moment(uploadDate);
  if (uploadDateMoment.isSame(moment(), 'month')) {
    return 'This Month';
  } 
  return uploadDateMoment.format('MMMM YYYY'); // Return the month and year
}

// Function to classify the year
function classifyUploadYear(uploadDate) {
  const uploadDateMoment = moment(uploadDate);
  if (uploadDateMoment.isSame(moment(), 'year')) {
    return 'This Year';
  } 
  return uploadDateMoment.format('YYYY'); // Return the year
}

// Function to fetch all PostCreationDocuments and add upload_date_text dynamically
async function getPostsWithUploadDateText() {
  try {
    // Fetch all PostCreationDocuments from the database
    const posts = await PostCreationDocument.find({});

    // Map through each post and add the upload_date_text field dynamically
    const postsWithUploadDateText = posts.map(post => {
      const uploadDateText = classifyUploadDate(post.upload_date);
      const monthText = classifyUploadMonth(post.upload_date);
      const yearText = classifyUploadYear(post.upload_date);
      
      return {
        ...post._doc, // spread the post document
        upload_date_text: uploadDateText, // dynamically add the new field
        month_text: monthText, // dynamically add the month field
        year_text: yearText, // dynamically add the year field
      };
    });

    return postsWithUploadDateText; // Return posts with the new fields
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error; // Handle or rethrow the error based on your needs
  }
}

// Example usage
getPostsWithUploadDateText()
  .then(posts => {
    console.log(posts); // All posts with the upload_date_text, month_text, and year_text fields added
  })
  .catch(error => {
    console.error('Error:', error);
  });
