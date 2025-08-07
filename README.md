# YouTube Subscription Panel

A Social Media Marketing (SMM) panel that allows you to boost YouTube channels by managing real user subscriptions through OAuth permissions.

## Features

- **Real Subscribers**: Uses real YouTube accounts with proper OAuth permissions
- **Admin Dashboard**: Manage campaigns and track subscription progress
- **User Authentication**: Secure OAuth flow for YouTube permissions
- **Batch Processing**: Subscribe multiple users to a channel at once
- **Hacker-Style UI**: Cool green-themed interface with terminal aesthetics

## Requirements

- Node.js (v14+)
- MongoDB
- YouTube API credentials

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/youtube-subscription-panel.git
cd youtube-subscription-panel
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on the `.env.example`:
```bash
cp .env.example .env
```

4. Edit the `.env` file with your configuration:
```
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/youtube-subscription-panel

# Session Configuration
SESSION_SECRET=your_session_secret_here

# YouTube API Configuration
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:3000/auth/youtube/callback

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin_password_here
```

5. Start the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## YouTube API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the YouTube Data API v3
4. Create OAuth 2.0 credentials
   - Set the application type to "Web application"
   - Add authorized redirect URIs: `http://localhost:3000/auth/youtube/callback`
   - For production, add your domain's callback URL
5. Copy the Client ID and Client Secret to your `.env` file

## Usage

### Admin Access

1. Access the admin panel at `/admin/login`
2. Log in with the credentials set in your `.env` file
3. From the dashboard, you can:
   - Generate login links for users
   - Create subscription campaigns
   - Monitor user authorizations
   - Execute campaigns to subscribe users to channels

### User Flow

1. Admin generates a unique login link for a user
2. User clicks the link and authorizes the application with YouTube
3. The user's account is now ready to be used for subscriptions
4. When an admin executes a campaign, all authorized users will subscribe to the specified channel

## Security Considerations

- All user tokens are stored securely in the database
- The application only requests the minimum required permissions
- Users can revoke access at any time through their Google account settings
- Admin access is protected with secure authentication

## Environment Variables

| Variable | Description |
|----------|-------------|
| PORT | The port the server will run on |
| NODE_ENV | Environment mode (development/production) |
| MONGODB_URI | MongoDB connection string |
| SESSION_SECRET | Secret for session encryption |
| YOUTUBE_CLIENT_ID | YouTube API Client ID |
| YOUTUBE_CLIENT_SECRET | YouTube API Client Secret |
| YOUTUBE_REDIRECT_URI | OAuth callback URL |
| ADMIN_USERNAME | Admin login username |
| ADMIN_PASSWORD | Admin login password |

## License

This project is licensed under the MIT License - see the LICENSE file for details.