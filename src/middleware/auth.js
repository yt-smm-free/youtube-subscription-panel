const User = require('../models/User');
const { google } = require('googleapis');

// Middleware to check if user is authenticated
const isUserAuthenticated = async (req, res, next) => {
  const { loginId } = req.params;
  
  if (!loginId) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  try {
    const user = await User.findOne({ loginId });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (!user.isAuthorized) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authorized with YouTube' 
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// Middleware to refresh token if expired
const refreshTokenIfNeeded = async (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return next();
  }
  
  // Check if token is expired
  if (user.tokenExpiry && new Date() > new Date(user.tokenExpiry)) {
    try {
      // Create OAuth client
      const oauth2Client = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET,
        process.env.YOUTUBE_REDIRECT_URI
      );
      
      // Set refresh token
      oauth2Client.setCredentials({
        refresh_token: user.refreshToken
      });
      
      // Refresh token
      const { tokens } = await oauth2Client.refreshAccessToken();
      
      // Update user tokens
      user.accessToken = tokens.access_token;
      if (tokens.refresh_token) {
        user.refreshToken = tokens.refresh_token;
      }
      user.tokenExpiry = new Date(tokens.expiry_date);
      
      await user.save();
      
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({ 
        success: false, 
        message: 'Failed to refresh authentication token' 
      });
    }
  }
  
  next();
};

module.exports = {
  isUserAuthenticated,
  refreshTokenIfNeeded
};