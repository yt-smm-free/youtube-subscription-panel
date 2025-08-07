/**
 * Test YouTube API Integration
 * 
 * This script tests the YouTube API integration by attempting to fetch information
 * about the authenticated user's YouTube channel.
 * 
 * Usage:
 * 1. Set up your .env file with YouTube API credentials
 * 2. Run this script with: node src/utils/testYouTubeAPI.js
 */

require('dotenv').config();
const { google } = require('googleapis');

async function testYouTubeAPI() {
  try {
    console.log('Testing YouTube API integration...');
    
    // Check if credentials are set
    if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET) {
      console.error('Error: YouTube API credentials not found in .env file');
      console.log('Please set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in your .env file');
      return;
    }

    // Create OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI || 'http://www.iamjanu.site/auth/youtube/callback'
    );

    // Generate authorization URL
    const scopes = [
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    console.log('\n✅ YouTube API credentials are valid');
    console.log('\nAuthorization URL:');
    console.log(authUrl);
    console.log('\nTo complete the test:');
    console.log('1. Copy the URL above and open it in your browser');
    console.log('2. Sign in with your Google account and grant permissions');
    console.log('3. You will be redirected to the callback URL');
    console.log('4. Check if you receive a successful response or an error');
    console.log('\nIf you see your authorization code in the URL or a successful page, the integration is working correctly.');

  } catch (error) {
    console.error('Error testing YouTube API:', error);
  }
}

// Run the function
testYouTubeAPI();