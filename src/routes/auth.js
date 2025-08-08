const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

// YouTube API scope for managing subscriptions
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

// Generate a unique login link
router.get('/generate-link', (req, res) => {
  const loginId = uuidv4();
  
  // Create a new user with this login ID
  const newUser = new User({
    loginId: loginId,
    isAuthorized: false
  });
  
  newUser.save()
    .then(() => {
      const loginLink = `${req.protocol}://${req.get('host')}/auth/login/${loginId}`;
      res.json({ 
        success: true, 
        loginId, 
        loginLink 
      });
    })
    .catch(err => {
      console.error('Error generating login link:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate login link' 
      });
    });
});

// Handle login with unique ID
router.get('/login/:loginId', async (req, res) => {
  try {
    const { loginId } = req.params;
    
    // Find user with this login ID
    const user = await User.findOne({ loginId });
    
    if (!user) {
      return res.status(404).render('error', { 
        message: 'Invalid login link. Please request a new one.' 
      });
    }
    
    // Store login ID in session
    req.session.loginId = loginId;
    
    // Generate OAuth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent' // Force to get refresh token
    });
    
// Render login page with auth URL and pre-authorization status
    res.render('user-login', { 
      authUrl,
      loginId,
      isPreAuthorized
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('error', { 
      message: 'An error occurred during login' 
    });
  }
});

// YouTube OAuth callback
router.get('/youtube/callback', async (req, res) => {
  const { code } = req.query;
  const { loginId } = req.session;
  
  if (!code) {
    return res.status(400).render('error', { 
      message: 'Authorization code is missing' 
    });
  }
  
  if (!loginId) {
    return res.status(400).render('error', { 
      message: 'Session expired. Please try again.' 
    });
  }
  
  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user info from YouTube
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });
    
    const people = google.people({
      version: 'v1',
      auth: oauth2Client
    });
    
    // Get channel info
    const channelResponse = await youtube.channels.list({
      part: 'snippet',
      mine: true
    });
    
    // Get user profile
    const peopleResponse = await people.people.get({
      resourceName: 'people/me',
      personFields: 'emailAddresses,names,photos'
    });
    
    const channel = channelResponse.data.items[0];
    const profile = peopleResponse.data;
    
    // Update user with YouTube info
    const user = await User.findOne({ loginId });
    
    if (!user) {
      return res.status(404).render('error', { 
        message: 'User not found. Please try again.' 
      });
    }
    
    user.youtubeId = channel.id;
    user.accessToken = tokens.access_token;
    user.refreshToken = tokens.refresh_token;
    user.tokenExpiry = new Date(tokens.expiry_date);
    user.name = channel.snippet.title;
    user.profilePicture = channel.snippet.thumbnails.default.url;
    user.email = profile.emailAddresses ? profile.emailAddresses[0].value : '';
    user.isAuthorized = true;
    user.lastLogin = new Date();
    
    await user.save();
    
    // Redirect to success page
    res.render('auth-success');
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).render('error', { 
      message: 'Failed to complete authentication' 
    });
  }
});

// Check authorization status
router.get('/status/:loginId', async (req, res) => {
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
      isAuthorized: user.isAuthorized,
      name: user.name || null,
      profilePicture: user.profilePicture || null
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check authorization status' 
    });
  }
});

module.exports = router;