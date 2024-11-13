const express = require('express');
const { body } = require('express-validator');

const { ensureAuthenticated } = require('../middlewares/ensureAuthenticated');
const authController = require('../controllers/authController');

const router = express.Router();

// Register
router.get('/register', ensureAuthenticated, authController.renderRegister);
router.post('/register',
    body("email").isEmail().withMessage("ایمیل نامعتبر است"),
    body("password").isLength({ min: 6, max: 20 }).withMessage("تعداد کاراکتر کلمه عبور می‌بایست بین 6 تا 20 کاراکتر باشد"),
    body("confirmPassword").isLength({ min: 6, max: 20 }).withMessage("تعداد کاراکتر تایید کلمه عبور می‌بایست بین 6 تا 20 کاراکتر باشد، و باید مطابق کلمه عبور باشد")
    , authController.handleRegister);

// Login
router.get('/login', ensureAuthenticated, authController.renderLogin);
router.post('/login',
    body("email").isEmail().withMessage("ایمیل نامعتبر است"),
    body("password").isLength({ min: 6, max: 20 }).withMessage("تعداد کاراکتر کلمه عبور می‌بایست بین 6 تا 20 کاراکتر باشد"), authController.handleLogin);

// Logout
router.get('/logout', ensureAuthenticated, authController.handleLogout);

module.exports = router;