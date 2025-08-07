const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  channelId: {
    type: String,
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  channelUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  subscriberCount: {
    type: Number,
    default: 0
  },
  targetSubscribers: {
    type: Number,
    default: 0
  },
  actualSubscribers: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  subscribers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    },
    subscribedAt: Date,
    errorMessage: String
  }]
});

module.exports = mongoose.model('Campaign', CampaignSchema);