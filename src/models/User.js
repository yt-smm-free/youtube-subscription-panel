const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  loginId: {
    type: String,
    required: true,
    unique: true
  },
  youtubeId: {
    type: String,
    sparse: true
  },
  accessToken: {
    type: String
  },
  refreshToken: {
    type: String
  },
  tokenExpiry: {
    type: Date
  },
  email: {
    type: String,
    sparse: true
  },
  name: {
    type: String
  },
  profilePicture: {
    type: String
  },
  isAuthorized: {
    type: Boolean,
    default: false
  },
  isMasterLink: {
    type: Boolean,
    default: false
  },
  masterLinkId: {
    type: String,
    index: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  subscriptionHistory: [{
    channelId: String,
    channelName: String,
    subscribedAt: {
      type: Date,
      default: Date.now
    },
    success: Boolean,
    errorMessage: String
  }]
});

module.exports = mongoose.model('User', UserSchema);