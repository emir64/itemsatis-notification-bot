const mongoose = require('mongoose');

const schema = mongoose.Schema({
    orderID: String,
    postName: String,
    postID: String,
    postPrice: String, 
    postBanner: String,
    categoryName: String,
    customerName: String,
    customerID: String,
    customerAvatar: String,
    profileLink: String,
    soldDate: Date,
})
  
module.exports = mongoose.model('orders', schema);