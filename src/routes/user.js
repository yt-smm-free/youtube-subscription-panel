const express = require('express');
const router = express.Router();
const User = require('../models/User');

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