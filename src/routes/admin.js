const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const bcrypt = require('bcryptjs');
const youtubeUtils = require('../utils/youtube'); // Import the YouTube utilities

// Middleware to check if admin is authenticated
const isAdminAuthenticated = (req, res, next) => {
  if (req.session.isAdminAuthenticated) {
    return next();
  }
  res.redirect('/abc/xxx/login');
};

// Admin login page
router.get('/login', (req, res) => {
  res.render('admin/login', { showNav: false });
});

// Admin login process
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if admin exists in database
    let admin = await Admin.findOne({ username });
    
    // If admin doesn't exist in DB but matches env credentials, create admin
    if (!admin && 
        username === process.env.ADMIN_USERNAME && 
        password === process.env.ADMIN_PASSWORD) {
      
      admin = new Admin({
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD
      });
      
      await admin.save();
      
      // Set session
      req.session.isAdminAuthenticated = true;
      req.session.adminId = admin._id;
      
      // Update last login
      admin.lastLogin = new Date();
      await admin.save();
      
      return res.redirect('/abc/xxx/dashboard');
    }
    
    // If admin exists, check password
    if (admin) {
      const isMatch = await admin.comparePassword(password);
      
      if (isMatch) {
        // Set session
        req.session.isAdminAuthenticated = true;
        req.session.adminId = admin._id;
        
        // Update last login
        admin.lastLogin = new Date();
        await admin.save();
        
        return res.redirect('/abc/xxx/dashboard');
      }
    }
    
    // Invalid credentials
    res.render('admin/login', { 
      error: 'Invalid username or password',
      showNav: false
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).render('error', { 
      message: 'An error occurred during login',
      showNav: false
    });
  }
});

// Admin dashboard
router.get('/dashboard', isAdminAuthenticated, async (req, res) => {
  try {
    // Get stats
    const totalUsers = await User.countDocuments();
    const authorizedUsers = await User.countDocuments({ isAuthorized: true });
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).limit(5);
    
    res.render('admin/dashboard', {
      totalUsers,
      authorizedUsers,
      campaigns,
      showNav: true
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { 
      message: 'Failed to load dashboard',
      showNav: false
    });
  }
});

// List all users
router.get('/users', isAdminAuthenticated, async (req, res) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Get search parameters
    const search = req.query.search || '';
    
    // Build query
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { youtubeId: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Get users with pagination
    const users = await User.find(query)
      .sort({ lastLogin: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    
    res.render('admin/users', {
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      search,
      showNav: true
    });
  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).render('error', { 
      message: 'Failed to load users list',
      showNav: false
    });
  }
});

// User details
router.get('/users/:id', isAdminAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).render('error', { 
        message: 'User not found',
        showNav: true
      });
    }
    
    res.render('admin/user-details', {
      user,
      showNav: true
    });
  } catch (error) {
    console.error('User details error:', error);
    res.status(500).render('error', { 
      message: 'Failed to load user details',
      showNav: false
    });
  }
});

// Campaigns list
router.get('/campaigns', isAdminAuthenticated, async (req, res) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get campaigns with pagination
    const campaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const totalCampaigns = await Campaign.countDocuments();
    
    res.render('admin/campaigns', {
      campaigns,
      currentPage: page,
      totalPages: Math.ceil(totalCampaigns / limit),
      totalCampaigns,
      showNav: true
    });
  } catch (error) {
    console.error('Campaigns list error:', error);
    res.status(500).render('error', { 
      message: 'Failed to load campaigns list',
      showNav: false
    });
  }
});

// Admin logout
router.get('/logout', (req, res) => {
  // Clear admin session
  req.session.isAdminAuthenticated = false;
  req.session.adminId = null;
  
  res.redirect('/abc/xxx/login');
});

module.exports = router;