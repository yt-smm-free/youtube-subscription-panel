#!/bin/bash

# YouTube Subscription Panel - Setup Script
# This script helps with the initial setup of the application

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}  YouTube Subscription Panel Setup     ${NC}"
echo -e "${BLUE}=======================================${NC}"

# Check if Node.js is installed
echo -e "\n${YELLOW}Checking Node.js installation...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js is installed (${NODE_VERSION})${NC}"
else
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo -e "${YELLOW}Please install Node.js v14 or higher from https://nodejs.org/${NC}"
    exit 1
fi

# Check if npm is installed
echo -e "\n${YELLOW}Checking npm installation...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm is installed (${NPM_VERSION})${NC}"
else
    echo -e "${RED}✗ npm is not installed${NC}"
    echo -e "${YELLOW}Please install npm from https://www.npmjs.com/get-npm${NC}"
    exit 1
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

# Check if .env file exists
echo -e "\n${YELLOW}Checking .env file...${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
else
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ .env file created${NC}"
        echo -e "${YELLOW}Please edit the .env file with your configuration${NC}"
    else
        echo -e "${RED}✗ .env.example file not found${NC}"
        echo -e "${YELLOW}Creating a basic .env file...${NC}"
        cat > .env << EOF
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/youtube-subscription-panel

# Session Configuration
SESSION_SECRET=change_this_to_a_random_string

# YouTube API Configuration
YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here
YOUTUBE_REDIRECT_URI=http://localhost:3000/auth/youtube/callback

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin_password_here
EOF
        echo -e "${GREEN}✓ Basic .env file created${NC}"
        echo -e "${YELLOW}Please edit the .env file with your configuration${NC}"
    fi
fi

# Check MongoDB connection
echo -e "\n${YELLOW}Would you like to test the MongoDB connection? (y/n)${NC}"
read -r TEST_MONGO
if [[ $TEST_MONGO =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Testing MongoDB connection...${NC}"
    # Extract MongoDB URI from .env file
    MONGODB_URI=$(grep MONGODB_URI .env | cut -d '=' -f2)
    
    # Simple MongoDB connection test using Node.js
    node -e "
    const mongoose = require('mongoose');
    mongoose.connect('$MONGODB_URI')
        .then(() => {
            console.log('${GREEN}✓ MongoDB connection successful${NC}');
            mongoose.connection.close();
        })
        .catch(err => {
            console.error('${RED}✗ MongoDB connection failed${NC}', err);
            process.exit(1);
        });
    "
fi

# Initialize admin user
echo -e "\n${YELLOW}Would you like to initialize the admin user? (y/n)${NC}"
read -r INIT_ADMIN
if [[ $INIT_ADMIN =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Initializing admin user...${NC}"
    npm run init-admin
fi

# Test YouTube API
echo -e "\n${YELLOW}Would you like to test the YouTube API integration? (y/n)${NC}"
read -r TEST_YOUTUBE
if [[ $TEST_YOUTUBE =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Testing YouTube API integration...${NC}"
    npm run test-youtube-api
fi

# Setup complete
echo -e "\n${GREEN}=======================================${NC}"
echo -e "${GREEN}  Setup Complete!                      ${NC}"
echo -e "${GREEN}=======================================${NC}"
echo -e "\n${BLUE}To start the application in development mode:${NC}"
echo -e "  npm run dev"
echo -e "\n${BLUE}To start the application in production mode:${NC}"
echo -e "  npm start"
echo -e "\n${YELLOW}Make sure to update your .env file with the correct configuration before starting the application.${NC}"
echo -e "${YELLOW}For more information, refer to the README.md and DEPLOYMENT.md files.${NC}\n"