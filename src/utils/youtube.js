const { google } = require('googleapis');

// Create OAuth2 client
const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );
};

// Get YouTube API client with user credentials
const getYouTubeClient = (accessToken, refreshToken) => {
  const oauth2Client = createOAuth2Client();
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });
  
  return google.youtube({
    version: 'v3',
    auth: oauth2Client
  });
};

// Extract channel ID from YouTube URL
const extractChannelId = async (url, accessToken, refreshToken) => {
  // Initialize YouTube client
  const youtube = getYouTubeClient(accessToken, refreshToken);
  
  // Handle different URL formats
  if (url.includes('/channel/')) {
    // Direct channel URL format: https://www.youtube.com/channel/UC...
    return url.split('/channel/')[1].split('?')[0].split('/')[0];
  } else if (url.includes('/c/') || url.includes('/user/')) {
    // Custom URL format: https://www.youtube.com/c/ChannelName or /user/Username
    let customIdentifier;
    
    if (url.includes('/c/')) {
      customIdentifier = url.split('/c/')[1].split('?')[0].split('/')[0];
    } else {
      customIdentifier = url.split('/user/')[1].split('?')[0].split('/')[0];
    }
    
    try {
      // Search for the channel
      const response = await youtube.search.list({
        part: 'snippet',
        q: customIdentifier,
        type: 'channel',
        maxResults: 1
      });
      
      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].id.channelId;
      }
      
      throw new Error('Channel not found');
    } catch (error) {
      console.error('Error finding channel ID:', error);
      throw new Error('Failed to extract channel ID from custom URL');
    }
  } else if (url.includes('youtube.com/@')) {
    // Handle @username format
    const username = url.split('youtube.com/@')[1].split('?')[0].split('/')[0];
    
    try {
      // Search for the channel
      const response = await youtube.search.list({
        part: 'snippet',
        q: username,
        type: 'channel',
        maxResults: 1
      });
      
      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].id.channelId;
      }
      
      throw new Error('Channel not found');
    } catch (error) {
      console.error('Error finding channel ID:', error);
      throw new Error('Failed to extract channel ID from username');
    }
  }
  
  throw new Error('Unsupported YouTube URL format');
};

// Get channel info by ID
const getChannelInfo = async (channelId, accessToken, refreshToken) => {
  try {
    const youtube = getYouTubeClient(accessToken, refreshToken);
    
    const response = await youtube.channels.list({
      part: 'snippet,statistics',
      id: channelId
    });
    
    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Channel not found');
    }
    
    const channel = response.data.items[0];
    
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnails: channel.snippet.thumbnails,
      subscriberCount: channel.statistics.subscriberCount,
      videoCount: channel.statistics.videoCount,
      viewCount: channel.statistics.viewCount
    };
  } catch (error) {
    console.error('Error getting channel info:', error);
    throw new Error('Failed to get channel information');
  }
};

// Subscribe to a channel
const subscribeToChannel = async (channelId, accessToken, refreshToken) => {
  try {
    const youtube = getYouTubeClient(accessToken, refreshToken);
    
    const response = await youtube.subscriptions.insert({
      part: 'snippet',
      requestBody: {
        snippet: {
          resourceId: {
            kind: 'youtube#channel',
            channelId: channelId
          }
        }
      }
    });
    
    return {
      success: true,
      subscriptionId: response.data.id
    };
  } catch (error) {
    console.error('Subscription error:', error);
    throw new Error(`Failed to subscribe to channel: ${error.message}`);
  }
};

// Check if user is already subscribed to a channel
const isSubscribed = async (channelId, accessToken, refreshToken) => {
  try {
    const youtube = getYouTubeClient(accessToken, refreshToken);
    
    // List user's subscriptions
    const response = await youtube.subscriptions.list({
      part: 'snippet',
      mine: true,
      forChannelId: channelId,
      maxResults: 1
    });
    
    return response.data.items && response.data.items.length > 0;
  } catch (error) {
    console.error('Subscription check error:', error);
    throw new Error('Failed to check subscription status');
  }
};

module.exports = {
  createOAuth2Client,
  getYouTubeClient,
  extractChannelId,
  getChannelInfo,
  subscribeToChannel,
  isSubscribed
};