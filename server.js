const dotenv = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const path = require('path');
const flash = require('connect-flash');

const User = require('./models/User');

const { redirectToDashboardIfLoggedIn } = require('./middlewares/redirectToDashboardIfLoggedIn');

const app = express();
const port = process.env.PORT || 5000;

// Express configuration
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', './views');

// Template engine
app.set('view engine', 'ejs');

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.DATABASE_URI,
        collectionName: 'sessions',
        ttl: 1000 * 60 * 60 * 24 * 30, // 30 Days
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true
    },
}));

// Flash session configuration
app.use(flash());
app.use((req, res, next) => {
    res.locals.successMessage = req.flash('success');
    res.locals.errorMessage = req.flash('error');
    next();
});

// Database connection
mongoose.connect(process.env.DATABASE_URI)
    .then(() => {
        console.log('[*] Connected to database');
        app.listen(port, () => {
            console.log(`[*] Server is running on port ${port}`);
        });
    }).catch((error) => {
        console.error('[-] Failed to connect to database');
        console.error(error.message);
        process.exit(1);
    });

// Auth routes
app.use('/auth', require('./routes/auth'));

// Get user information
app.use(async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            res.locals.user = user;
        } catch (error) {
            console.error('خطا در خواندن کاربر فعال', error.message);
        }
    }
    next();
});

// Dashboard routes
app.use('/dashboard', redirectToDashboardIfLoggedIn, require('./routes/dashboard'));

// 404 - Page not found
app.use((req, res) => {
    // Template required
    res.send('<p style="color: red">404 - Page not found!</p>');
});
