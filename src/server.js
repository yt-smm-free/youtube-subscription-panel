const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts'); // Add this line

// Load environment variables
dotenv.config();

// Import routes (will create these later)
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB with all options
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('production'));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://i.ytimg.com", "https://yt3.ggpht.com"],
      connectSrc: ["'self'", "https://www.googleapis.com"],
      frameSrc: ["'self'", "https://accounts.google.com"]
    }
  }
}));

// Updated CORS configuration to allow both www and non-www domains
app.use(cors({
  origin: [
    'https://www.iamjanu.site',
    'https://iamjanu.site'
  ],
  credentials: true
}));

// Session configuration with fixed cookie settings
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    httpOnly: true, // Prevents JavaScript from reading the cookie
    sameSite: 'lax', // Helps prevent CSRF attacks
    secure: process.env.NODE_ENV === 'production', // Enable for HTTPS in production
    maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
  }
}));

// Set up EJS with layouts
app.use(expressLayouts); // Add this line
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout'); // Add this line

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);

// Home route
app.get('/', (req, res) => {
  res.render('index');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(500).render('error', { 
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message,
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Trust proxy setting for running behind a proxy (like render.com)
app.set('trust proxy', 1);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;