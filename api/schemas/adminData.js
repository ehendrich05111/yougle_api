const mongoose = require('mongoose');

const adminDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slackSearchTimes: {
    type: Array,
    required: false
  }
})

const adminData = mongoose.model("adminData", adminDataSchema);

module.exports = adminData;