const dotenv = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

// Express configuration
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.set(express.static(__dirname + '/public'));
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
    },
}));

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


// 404 - Page not found
app.use((req, res) => {
    // Template required
    res.send('<p style="color: red">404 - Page not found!</p>');
});