const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSubscriptionSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  services: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'SubService', 
    required: true ,
    unique:true
  }]
});

const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);

module.exports = UserSubscription;
