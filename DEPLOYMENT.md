# Deployment Guide for YouTube Subscription Panel

This guide provides instructions for deploying the YouTube Subscription Panel to various environments.

## Prerequisites

- Node.js (v14+)
- MongoDB (local or cloud-based like MongoDB Atlas)
- YouTube API credentials
- Domain name (for production deployment)

## Local Deployment

1. Clone the repository:
```bash
git clone https://github.com/yourusername/youtube-subscription-panel.git
cd youtube-subscription-panel
```

2. Install dependencies:
```bash
npm install
```

3. Create and configure the `.env` file:
```bash
cp .env.example .env
# Edit the .env file with your configuration
```

4. Start the application:
```bash
npm start
```

5. Access the application at `http://localhost:3000`

## Production Deployment

### Option 1: Traditional VPS/Dedicated Server

1. SSH into your server:
```bash
ssh user@your-server-ip
```

2. Install Node.js and MongoDB:
```bash
# For Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

3. Clone the repository:
```bash
git clone https://github.com/yourusername/youtube-subscription-panel.git
cd youtube-subscription-panel
```

4. Install dependencies:
```bash
npm install
```

5. Create and configure the `.env` file:
```bash
cp .env.example .env
# Edit the .env file with your production configuration
```

6. Install PM2 for process management:
```bash
npm install -g pm2
```

7. Start the application with PM2:
```bash
pm2 start src/server.js --name youtube-subscription-panel
pm2 save
pm2 startup
```

8. Set up Nginx as a reverse proxy:
```bash
sudo apt-get install -y nginx
```

9. Create an Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/youtube-subscription-panel
```

10. Add the following configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

11. Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/youtube-subscription-panel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

12. Set up SSL with Let's Encrypt:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Option 2: Docker Deployment

1. Create a `Dockerfile` in the project root:
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

2. Create a `docker-compose.yml` file:
```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGODB_URI=mongodb://mongo:27017/youtube-subscription-panel
      - SESSION_SECRET=your_session_secret_here
      - YOUTUBE_CLIENT_ID=your_client_id_here
      - YOUTUBE_CLIENT_SECRET=your_client_secret_here
      - YOUTUBE_REDIRECT_URI=https://yourdomain.com/auth/youtube/callback
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=admin_password_here
    depends_on:
      - mongo
    restart: always

  mongo:
    image: mongo
    volumes:
      - mongo-data:/data/db
    restart: always

volumes:
  mongo-data:
```

3. Build and start the containers:
```bash
docker-compose up -d
```

### Option 3: Cloud Platforms

#### Heroku

1. Install the Heroku CLI:
```bash
npm install -g heroku
```

2. Login to Heroku:
```bash
heroku login
```

3. Create a new Heroku app:
```bash
heroku create youtube-subscription-panel
```

4. Add MongoDB add-on:
```bash
heroku addons:create mongolab
```

5. Set environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your_session_secret_here
heroku config:set YOUTUBE_CLIENT_ID=your_client_id_here
heroku config:set YOUTUBE_CLIENT_SECRET=your_client_secret_here
heroku config:set YOUTUBE_REDIRECT_URI=https://your-app-name.herokuapp.com/auth/youtube/callback
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=admin_password_here
```

6. Deploy the application:
```bash
git push heroku main
```

#### AWS Elastic Beanstalk

1. Install the AWS CLI and EB CLI:
```bash
pip install awscli
pip install awsebcli
```

2. Configure AWS credentials:
```bash
aws configure
```

3. Initialize EB application:
```bash
eb init
```

4. Create an environment:
```bash
eb create youtube-subscription-panel-env
```

5. Set environment variables:
```bash
eb setenv NODE_ENV=production SESSION_SECRET=your_session_secret_here YOUTUBE_CLIENT_ID=your_client_id_here YOUTUBE_CLIENT_SECRET=your_client_secret_here YOUTUBE_REDIRECT_URI=https://yourdomain.com/auth/youtube/callback ADMIN_USERNAME=admin ADMIN_PASSWORD=admin_password_here
```

6. Deploy the application:
```bash
eb deploy
```

## YouTube API Configuration for Production

When deploying to production, you need to update your YouTube API configuration:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Credentials"
4. Edit your OAuth 2.0 Client ID
5. Add your production domain to the authorized JavaScript origins
6. Add your production callback URL to the authorized redirect URIs:
   - `https://yourdomain.com/auth/youtube/callback`
7. Save the changes

## Security Recommendations for Production

1. Use strong, unique passwords for the admin account
2. Set up proper firewall rules to restrict access
3. Enable HTTPS with a valid SSL certificate
4. Regularly update dependencies with `npm audit fix`
5. Set up monitoring and logging
6. Implement rate limiting for API endpoints
7. Use environment variables for all sensitive information
8. Regularly backup your MongoDB database

## Troubleshooting

### Application won't start
- Check if MongoDB is running
- Verify that all environment variables are set correctly
- Check the logs for any error messages

### OAuth errors
- Verify that the redirect URI in your Google Cloud Console matches exactly with your application's callback URL
- Check if the YouTube API is enabled for your project
- Ensure your API credentials are correct

### Subscription failures
- Check if user tokens are valid and not expired
- Verify that users have granted the necessary permissions
- Check for any YouTube API quota limitations

## Maintenance

1. Regularly update dependencies:
```bash
npm update
npm audit fix
```

2. Monitor application logs:
```bash
# If using PM2
pm2 logs youtube-subscription-panel

# If using Docker
docker-compose logs -f app
```

3. Backup your MongoDB database:
```bash
# Local MongoDB
mongodump --db youtube-subscription-panel --out /path/to/backup/directory

# Docker MongoDB
docker exec -it youtube-subscription-panel_mongo_1 mongodump --db youtube-subscription-panel --out /data/backup
```