const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const bcrypt = require('bcryptjs');
const youtubeUtils = require('../utils/youtube'); // Import the YouTube utilities

// Middleware to check if admin is authenticated
const isAdminAuthenticated = (req, res, next) => {
  if (req.session.isAdminAuthenticated) {
    return next();
  }
  res.redirect('/admin/login');
};

// Admin login page
router.get('/login', (req, res) => {
  res.render('admin/login', { showNav: false });
});

// Admin login process
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if admin exists in database
    let admin = await Admin.findOne({ username });
    
    // If admin doesn't exist in DB but matches env credentials, create admin
    if (!admin && 
        username === process.env.ADMIN_USERNAME && 
        password === process.env.ADMIN_PASSWORD) {
      
      admin = new Admin({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD
      });
      
      await admin.save();
      
      // Set session
      req.session.isAdminAuthenticated = true;
      req.session.adminId = admin._id;
      
      // Update last login
      admin.lastLogin = new Date();
      await admin.save();
      
      return res.redirect('/admin/dashboard');
    }
    
    // If admin exists, check password
    if (admin) {
      const isMatch = await admin.comparePassword(password);
      
      if (isMatch) {
        // Set session
        req.session.isAdminAuthenticated = true;
        req.session.adminId = admin._id;
        
        // Update last login
        admin.lastLogin = new Date();
        await admin.save();
        
        return res.redirect('/admin/dashboard');
      }
    }
    
    // Invalid credentials
    res.render('admin/login', { 
      error: 'Invalid username or password' 
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).render('error', { 
      message: 'An error occurred during login' 
    });
  }
});

// Admin dashboard
router.get('/dashboard', isAdminAuthenticated, async (req, res) => {
  try {
    // Get stats
    const totalUsers = await User.countDocuments();
    const authorizedUsers = await User.countDocuments({ isAuthorized: true });
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).limit(5);
    
    res.render('admin/dashboard', {
      totalUsers,
      authorizedUsers,
      campaigns
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { 
      message: 'Failed to load dashboard' 
    });
  }
});

// List all users
router.get('/users', isAdminAuthenticated, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.render('admin/users', { users });
  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).render('error', { 
      message: 'Failed to load users' 
    });
  }
});

// New campaign page
router.get('/campaigns/new', isAdminAuthenticated, async (req, res) => {
  try {
    const authorizedUsers = await User.countDocuments({ isAuthorized: true });
    res.render('admin/new-campaign', { authorizedUsers }); // Use the fixed template
  } catch (error) {
    console.error('New campaign page error:', error);
    res.status(500).render('error', { 
      message: 'Failed to load new campaign page' 
    });
  }
});

// Create new campaign
router.post('/campaigns', isAdminAuthenticated, async (req, res) => {
  try {
    const { channelUrl, targetSubscribers } = req.body;
    
    // Get an authorized user to fetch channel info - MOVED THIS BEFORE USING IT
    const authorizedUser = await User.findOne({ 
      isAuthorized: true,
      accessToken: { $exists: true }
    });
    
    if (!authorizedUser) {
      return res.status(400).render('error', { 
        message: 'No authorized users available to fetch channel info' 
      });
    }
    
    // Use the extractChannelId function from youtube.js
    let channelId;
    try {
      channelId = await youtubeUtils.extractChannelId(
        channelUrl, 
        authorizedUser.accessToken, 
        authorizedUser.refreshToken
      );
    } catch (error) {
      console.error('Channel ID extraction error:', error);
      return res.status(400).render('error', { 
        message: `Failed to extract channel ID: ${error.message}` 
      });
    }
    
    // Create OAuth client for API calls
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );
    
    // Set credentials
    oauth2Client.setCredentials({
      access_token: authorizedUser.accessToken,
      refresh_token: authorizedUser.refreshToken
    });
    
    // Get channel info
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });
    
    const channelResponse = await youtube.channels.list({
      part: 'snippet,statistics',
      id: channelId
    });
    
    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return res.status(404).render('error', { 
        message: 'Channel not found' 
      });
    }
    
    const channelInfo = channelResponse.data.items[0];
    
    // Create new campaign
    const campaign = new Campaign({
      channelId,
      channelName: channelInfo.snippet.title,
      channelUrl,
      thumbnailUrl: channelInfo.snippet.thumbnails.default.url,
      subscriberCount: channelInfo.statistics.subscriberCount,
      targetSubscribers: targetSubscribers || 0,
      status: 'pending',
      createdBy: req.session.adminId
    });
    
    await campaign.save();
    
    res.redirect(`/admin/campaigns/${campaign._id}`);
    
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).render('error', { 
      message: 'Failed to create campaign' 
    });
  }
});

// View campaign
router.get('/campaigns/:id', isAdminAuthenticated, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).render('error', { 
        message: 'Campaign not found' 
      });
    }
    
    const authorizedUsers = await User.countDocuments({ isAuthorized: true });
    
    res.render('admin/campaign-detail', {
      campaign,
      authorizedUsers
    });
    
  } catch (error) {
    console.error('Campaign detail error:', error);
    res.status(500).render('error', { 
      message: 'Failed to load campaign details' 
    });
  }
});

// List all campaigns
router.get('/campaigns', isAdminAuthenticated, async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.render('admin/campaigns', { campaigns });
  } catch (error) {
    console.error('Campaigns list error:', error);
    res.status(500).render('error', { 
      message: 'Failed to load campaigns' 
    });
  }
});

// Execute campaign (subscribe users to channel)
router.post('/campaigns/:id/execute', isAdminAuthenticated, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ 
        success: false, 
        message: 'Campaign not found' 
      });
    }
    
    // Update campaign status
    campaign.status = 'in-progress';
    await campaign.save();
    
    // Get all authorized users
    const users = await User.find({ isAuthorized: true });
    
    // Process subscriptions in batches
    const batchSize = 10; // Process 10 users at a time
    const batches = Math.ceil(users.length / batchSize);
    
    let successCount = 0;
    let failCount = 0;
    
    // Process each batch
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, users.length);
      const batchUsers = users.slice(start, end);
      
      // Process users in parallel
      const results = await Promise.all(
        batchUsers.map(user => subscribeUserToChannel(user, campaign))
      );
      
      // Count successes and failures
      results.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      });
    }
    
    // Update campaign status
    campaign.status = 'completed';
    campaign.actualSubscribers = successCount;
    campaign.completedAt = new Date();
    await campaign.save();
    
    res.json({
      success: true,
      message: `Campaign executed: ${successCount} successful subscriptions, ${failCount} failed`,
      successCount,
      failCount
    });
    
  } catch (error) {
    console.error('Execute campaign error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to execute campaign' 
    });
  }
});

// Helper function to subscribe a user to a channel
async function subscribeUserToChannel(user, campaign) {
  try {
    // Create OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );
    
    // Check if token is expired and refresh if needed
    if (new Date() > new Date(user.tokenExpiry)) {
      try {
        oauth2Client.setCredentials({
          refresh_token: user.refreshToken
        });
        
        const { tokens } = await oauth2Client.refreshAccessToken();
        
        // Update user tokens
        user.accessToken = tokens.access_token;
        if (tokens.refresh_token) {
          user.refreshToken = tokens.refresh_token;
        }
        user.tokenExpiry = new Date(tokens.expiry_date);
        await user.save();
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        
        // Record subscription failure
        user.subscriptionHistory.push({
          channelId: campaign.channelId,
          channelName: campaign.channelName,
          success: false,
          errorMessage: 'Failed to refresh access token'
        });
        await user.save();
        
        // Update campaign subscriber record
        campaign.subscribers.push({
          userId: user._id,
          status: 'failed',
          errorMessage: 'Failed to refresh access token'
        });
        await campaign.save();
        
        return { success: false, error: 'Token refresh failed' };
      }
    }
    
    // Set credentials
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken
    });
    
    // Create YouTube API client
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });
    
    // Subscribe to channel
    await youtube.subscriptions.insert({
      part: 'snippet',
      requestBody: {
        snippet: {
          resourceId: {
            kind: 'youtube#channel',
            channelId: campaign.channelId
          }
        }
      }
    });
    
    // Record successful subscription
    user.subscriptionHistory.push({
      channelId: campaign.channelId,
      channelName: campaign.channelName,
      success: true
    });
    await user.save();
    
    // Update campaign subscriber record
    campaign.subscribers.push({
      userId: user._id,
      status: 'success',
      subscribedAt: new Date()
    });
    await campaign.save();
    
    return { success: true };
    
  } catch (error) {
    console.error(`Subscription error for user ${user._id}:`, error);
    
    // Record subscription failure
    user.subscriptionHistory.push({
      channelId: campaign.channelId,
      channelName: campaign.channelName,
      success: false,
      errorMessage: error.message
    });
    await user.save();
    
    // Update campaign subscriber record
    campaign.subscribers.push({
      userId: user._id,
      status: 'failed',
      errorMessage: error.message
    });
    await campaign.save();
    
    return { success: false, error: error.message };
  }
}
 
router.post('/users/authorize-all', isAdminAuthenticated, async (req, res) => {
  try {
    // Find all unauthorized users
    const users = await User.find({ isAuthorized: false });
    
    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'No unauthorized users found',
        authorizedCount: 0
      });
    }
    
    // Update all users to authorized status
    const updateResult = await User.updateMany(
      { isAuthorized: false },
      { $set: { isAuthorized: true } }
    );
    
    res.json({
      success: true,
      message: `${updateResult.modifiedCount} users authorized successfully`,
      authorizedCount: updateResult.modifiedCount
    });
    
  } catch (error) {
    console.error('Bulk authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to authorize users'
    });
  }
});

// Toggle user authorization status
router.post('/users/:loginId/toggle-auth', isAdminAuthenticated, async (req, res) => {
  try {
    const { loginId } = req.params;
    const user = await User.findOne({ loginId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Toggle authorization status
    user.isAuthorized = !user.isAuthorized;
    await user.save();
    
    res.json({
      success: true,
      message: `User ${user.isAuthorized ? 'authorized' : 'unauthorized'} successfully`,
      isAuthorized: user.isAuthorized
    });
    
  } catch (error) {
    console.error('Toggle authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user authorization'
    });
  }
});

// Admin logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

module.exports = router;