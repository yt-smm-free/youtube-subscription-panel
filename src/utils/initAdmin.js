/**
 * Initialize Admin User
 * 
 * This script creates an admin user in the database using the credentials from the .env file.
 * Run this script after setting up the application to ensure the admin user exists.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function initializeAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: process.env.ADMIN_USERNAME });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create new admin user
    const admin = new Admin({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD
    });

    await admin.save();
    console.log('Admin user created successfully');

  } catch (error) {
    console.error('Error initializing admin user:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
initializeAdmin();