const User = require('../models/User');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

exports.renderRegister = async (req, res) => {
    res.render('./auth/register', { title: 'ثبت نام' });
};

exports.handleRegister = async (req, res) => {
    const { email, password, confirmPassword } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('./auth/register', { title: 'ثبت نام', errors: errors.array(), filled: req.body });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('./auth/register', { title: 'ثبت نام', error: 'نام کاربری قبلا ثبت نام شده است', filled: req.body });
        }

        if (password !== confirmPassword) {
            return res.render('./auth/register', { title: 'ثبت نام', error: 'کلمه عبور و تایید کلمه عبور مطابقت ندارند', filled: req.body });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            password: hashedPassword
        });
        await newUser.save();

        req.flash('success', `کاربر با ${email} با موفقیت ثبت نام شد`);
        res.redirect('/auth/login');
    } catch (error) {
        console.error(error.message);
        res.render('./auth/register', { title: 'ثبت نام', error: 'مشکلی در سرور رخ داده است. لطفاً دوباره تلاش کنید', filled: req.body });
    }
};

exports.renderLogin = async (req, res) => {
    res.render('./auth/login', { title: 'ورود کاربر', });
};

exports.handleLogin = async (req, res) => {
    const { email, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('./auth/login', { title: 'ورود کاربر', errors: errors.array(), filled: req.body });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.render('./auth/login', { title: 'ورود کاربر', error: 'نام کاربری در سیستم یافت نشد', filled: req.body });
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

        if (!isPasswordCorrect) {
            return res.render('./auth/login', { title: 'ورود کاربر', error: 'کلمه عبور صحیح نیست', filled: req.body });
        } else {
            req.session.userId = existingUser._id;
            res.redirect('/dashboard/questions');
        }

    } catch (error) {
        console.error(error.message);
        res.render('./auth/login', { title: 'ورود کاربر', error: 'مشکلی در سرور رخ داده است. لطفاً دوباره تلاش کنید.', filled: req.body });
    }
};

exports.handleLogout = async (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error('خطا در حذف نشست‌ها');
            return res.redirect('/dashboard/questions');
        }
        res.clearCookie('connect.sid');
        res.redirect('/auth/login');
    });
};