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

// Generate a unique login link
router.get('/generate-link', (req, res) => {
  // Instead of generating a new UUID each time, use a fixed ID for the admin
  // This ensures the same link is generated each time
  const loginId = 'admin-generated-link-' + Date.now().toString().slice(-6);
  
  // Check if a user with this login ID already exists
  User.findOne({ loginId: { $regex: /^admin-generated-link-/ } })
    .then(existingUser => {
      if (existingUser) {
        // If a user already exists, return its login link
        const loginLink = `${req.protocol}://${req.get('host')}/auth/login/${existingUser.loginId}`;
        return res.json({ 
          success: true, 
          loginId: existingUser.loginId, 
          loginLink 
        });
      } else {
        // Create a new user with this login ID
        const newUser = new User({
          loginId: loginId,
          isAuthorized: false
        });
        
        return newUser.save()
          .then(() => {
            const loginLink = `${req.protocol}://${req.get('host')}/auth/login/${loginId}`;
            res.json({ 
              success: true, 
              loginId, 
              loginLink 
            });
          });
      }
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
      prompt: 'consent' , // Force to get refresh token
       include_granted_scopes: true  // Include previously granted scopes
    });
    
    // Render login page with auth URL
    res.render('login', { 
      authUrl,
      loginId,
      showNav: false
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('error', { 
      message: 'An error occurred during login' 
    });
  }
});

// Google OAuth callback - new route to handle Google's callback
router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;
  const { loginId } = req.session;
  
  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error);
    return res.status(400).render('error', { 
      message: `Authorization failed: ${error}`,
      showNav: false
    });
  }
});
// YouTube OAuth callback
router.get('/youtube/callback', async (req, res) => {
    console.log('OAuth callback received:');
  console.log('Query params:', req.query);
  console.log('Session:', req.session);
  console.log('Headers:', req.headers);

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
  console.log('Attempting to exchange code for tokens...');
  const tokenResponse = await oauth2Client.getToken(code);
  const tokens = tokenResponse.tokens;  // Store tokens in a variable that's accessible throughout the function
  
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
  
  // Update user with YouTube info
  const user = await User.findOne({ loginId });
  
  if (!user) {
    return res.status(404).render('error', { 
      message: 'User not found. Please try again.',
      showNav: false
    });
  }

  // Save the tokens and user info
  user.youtubeId = channel.id;
  user.accessToken = tokens.access_token;  // Use the tokens variable defined above
  user.refreshToken = tokens.refresh_token;
  user.tokenExpiry = new Date(tokens.expiry_date);
  user.name = channel.snippet.title;
  user.profilePicture = channel.snippet.thumbnails.default.url;
  user.email = profile.emailAddresses ? profile.emailAddresses[0].value : '';
  user.isAuthorized = true;
  user.lastLogin = new Date();
  
  await user.save();
  
  // Redirect to success page
  res.render('auth-success', { showNav: false });
  
} catch (error) {
  console.error('OAuth callback error:', error);
  res.status(500).render('error', { 
    message: 'Failed to complete authentication: ' + error.message,
    error: error,
    showNav: false
  });
}
} );

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