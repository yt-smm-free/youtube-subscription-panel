const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated && req.session.userId) {
    return next();
  }
  res.redirect('/');
};

// Subscriber panel route
router.get('/subscriber-panel', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    
    if (!user) {
      req.session.destroy();
      return res.redirect('/');
    }
    
    res.render('subscriber-panel', { 
      user,
      showNav: false
    });
  } catch (error) {
    console.error('Error loading subscriber panel:', error);
    res.status(500).render('error', { 
      message: 'Failed to load subscriber panel',
      showNav: false
    });
  }
});

// Process subscriber request (fake endpoint)
router.post('/process-subscribers', isAuthenticated, async (req, res) => {
  try {
    const { channelUrl, subscriberCount } = req.body;
    
    // Validate input
    if (!channelUrl || !subscriberCount) {
      return res.status(400).json({
        success: false,
        message: 'Channel URL and subscriber count are required'
      });
    }
    
    // Always return success with queued status
    setTimeout(() => {
      res.json({
        success: true,
        status: 'queued',
        message: 'Your order has been queued and will be completed within 3 to 5 days.',
        channelUrl,
        subscriberCount
      });
    }, 5000); // Add a delay to simulate processing
    
  } catch (error) {
    console.error('Error processing subscriber request:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request'
    });
  }
});

// Legacy routes for backward compatibility

// Get user profile by login ID
router.get('/profile/:loginId', async (req, res) => {
  try {
    const { loginId } = req.params;
    const user = await User.findOne({ loginId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Return user profile without sensitive information
    res.json({
      success: true,
      profile: {
        name: user.name,
        profilePicture: user.profilePicture,
        isAuthorized: user.isAuthorized,
        subscriptionHistory: user.subscriptionHistory
      }
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user profile' 
    });
  }
});

// Get subscription history by login ID
router.get('/subscriptions/:loginId', async (req, res) => {
  try {
    const { loginId } = req.params;
    const user = await User.findOne({ loginId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      subscriptions: user.subscriptionHistory
    });
    
  } catch (error) {
    console.error('Subscription history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch subscription history' 
    });
  }
});

// Revoke YouTube authorization
router.post('/revoke/:loginId', async (req, res) => {
  try {
    const { loginId } = req.params;
    const user = await User.findOne({ loginId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Clear YouTube authorization data
    user.accessToken = undefined;
    user.refreshToken = undefined;
    user.tokenExpiry = undefined;
    user.isAuthorized = false;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Authorization revoked successfully'
    });
    
  } catch (error) {
    console.error('Revoke authorization error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to revoke authorization' 
    });
  }
});

module.exports = router;