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
console.log('OAuth2 Client Configuration:');
console.log('Client ID:', process.env.YOUTUBE_CLIENT_ID);
console.log('Client Secret:', process.env.YOUTUBE_CLIENT_SECRET ? 'Configured (starts with: ' + process.env.YOUTUBE_CLIENT_SECRET.substring(0, 8) + '...)' : 'Missing');
console.log('Redirect URI:', process.env.YOUTUBE_REDIRECT_URI);

// YouTube API scope for managing subscriptions
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

// Direct Google login for users (new route)
router.get('/google/login', (req, res) => {
  // Generate OAuth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force to get refresh token
    include_granted_scopes: true  // Include previously granted scopes
  });
  
  // Redirect to Google OAuth
  res.redirect(authUrl);
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;
  
  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return res.status(400).render('error', { 
      message: `Authorization failed: ${error}`,
      showNav: false
    });
  }
  
  if (!code) {
    return res.status(400).render('error', { 
      message: 'Authorization code is missing' 
    });
  }
  
  try {
    // Exchange code for tokens
    console.log('Attempting to exchange code for tokens...');
    const tokenResponse = await oauth2Client.getToken(code);
    const tokens = tokenResponse.tokens;
    
    console.log('Tokens received successfully');
    console.log('Token info:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    });
    
    // Set credentials with the tokens
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
    const youtubeId = channel.id;
    
    // Check if user already exists
    let user = await User.findOne({ youtubeId });
    
    if (!user) {
      // Create a new user
      const loginId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      
      user = new User({
        loginId,
        youtubeId,
        isAuthorized: true
      });
    }
    
    // Update user with YouTube info
    user.accessToken = tokens.access_token;
    user.refreshToken = tokens.refresh_token;
    user.tokenExpiry = new Date(tokens.expiry_date);
    user.name = channel.snippet.title;
    user.profilePicture = channel.snippet.thumbnails.default.url;
    user.email = profile.emailAddresses ? profile.emailAddresses[0].value : '';
    user.isAuthorized = true;
    user.lastLogin = new Date();
    
    await user.save();
    
    // Set session
    req.session.userId = user._id;
    req.session.isAuthenticated = true;
    
    // Redirect to subscriber panel
    res.redirect('/user/subscriber-panel');
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).render('error', { 
      message: 'Failed to complete authentication: ' + error.message,
      error: error,
      showNav: false
    });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  // Clear session
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

// Legacy routes for backward compatibility

// Generate a master login link that can be used by multiple users
router.get('/generate-link', (req, res) => {
  // Generate a simple, memorable master link ID
  const masterLinkId = 'master-link-' + Date.now().toString().slice(-6);
  
  // Create a special user record to represent the master link
  const masterUser = new User({
    loginId: masterLinkId,
    isMasterLink: true,  // Flag to identify this as a master link
    isAuthorized: false
  });
  
  masterUser.save()
    .then(() => {
      const loginLink = `${req.protocol}://${req.get('host')}/auth/login/${masterLinkId}`;
      res.json({ 
        success: true, 
        loginId: masterLinkId, 
        loginLink,
        isMasterLink: true
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

// Handle login with unique ID or master link (legacy route)
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
    
    // Check if this is a master link
    if (user.isMasterLink) {
      // For master links, we'll create a temporary session ID
      // This will be used to create a new user after OAuth
      const tempSessionId = 'temp-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 8);
      
      // Store both the master link ID and temp session ID
      req.session.masterLinkId = loginId;
      req.session.tempSessionId = tempSessionId;
      req.session.isMasterLink = true;
    } else {
      // For regular links, just store the login ID
      req.session.loginId = loginId;
      req.session.isMasterLink = false;
    }
    
    // Generate OAuth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Force to get refresh token
      include_granted_scopes: true  // Include previously granted scopes
    });
    
    // Render login page with auth URL
    res.render('login', { 
      authUrl,
      loginId,
      isMasterLink: user.isMasterLink,
      showNav: false
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('error', { 
      message: 'An error occurred during login' 
    });
  }
});

// YouTube OAuth callback (legacy route)
router.get('/youtube/callback', async (req, res) => {
  console.log('OAuth callback received:');
  console.log('Query params:', req.query);
  console.log('Session:', req.session);
  console.log('Headers:', req.headers);

  const { code } = req.query;
  const { loginId, masterLinkId, tempSessionId, isMasterLink } = req.session;
  
  if (!code) {
    return res.status(400).render('error', { 
      message: 'Authorization code is missing' 
    });
  }
  
  // Check if we have either a regular loginId or a master link setup
  if (!loginId && !(masterLinkId && tempSessionId)) {
    return res.status(400).render('error', { 
      message: 'Session expired. Please try again.' 
    });
  }
  
  try {
    // Exchange code for tokens
    console.log('Attempting to exchange code for tokens...');
    const tokenResponse = await oauth2Client.getToken(code);
    const tokens = tokenResponse.tokens;
    
    console.log('Tokens received successfully');
    console.log('Token info:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    });
    
    // Set credentials with the tokens
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
    const youtubeId = channel.id;
    
    let user;
    
    // Handle differently based on whether this is a master link or regular link
    if (isMasterLink) {
      // For master links, check if a user with this YouTube ID already exists
      const existingUser = await User.findOne({ youtubeId });
      
      if (existingUser) {
        // If user already exists, just update their tokens and login time
        user = existingUser;
      } else {
        // Create a new user with a unique login ID based on the temp session
        const newLoginId = `user-${tempSessionId}`;
        
        user = new User({
          loginId: newLoginId,
          masterLinkId: masterLinkId, // Link back to the master link
          isAuthorized: true // Auto-authorize users from master links
        });
      }
    } else {
      // For regular links, find the user with the login ID
      user = await User.findOne({ loginId });
      
      if (!user) {
        return res.status(404).render('error', { 
          message: 'User not found. Please try again.',
          showNav: false
        });
      }
    }
    
    // Update user with YouTube info
    user.youtubeId = youtubeId;
    user.accessToken = tokens.access_token;
    user.refreshToken = tokens.refresh_token;
    user.tokenExpiry = new Date(tokens.expiry_date);
    user.name = channel.snippet.title;
    user.profilePicture = channel.snippet.thumbnails.default.url;
    user.email = profile.emailAddresses ? profile.emailAddresses[0].value : '';
    user.isAuthorized = true;
    user.lastLogin = new Date();
    
    await user.save();
    
    // Set session
    req.session.userId = user._id;
    req.session.isAuthenticated = true;
    
    // Redirect to subscriber panel
    res.redirect('/user/subscriber-panel');
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).render('error', { 
      message: 'Failed to complete authentication: ' + error.message,
      error: error,
      showNav: false
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