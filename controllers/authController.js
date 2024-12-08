const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

const User = require('../models/User');

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
            return res.render('./auth/register', {
                title: 'ثبت نام',
                error: 'این ایمیل قبلاً ثبت شده است. لطفاً از ایمیل دیگری استفاده کنید!',
                filled: req.body
            });
        }

        if (password !== confirmPassword) {
            return res.render('./auth/register', {
                title: 'ثبت نام',
                error: 'رمز عبور و تکرار آن مطابقت ندارند. لطفاً دوباره بررسی کنید!',
                filled: req.body
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            password: hashedPassword
        });
        await newUser.save();

        req.flash('success', `کاربر ${email} با موفقیت ثبت شد. به دنیای ما خوش آمدید!`);
        res.redirect('/auth/login');
    } catch (error) {
        console.error(error.message);
        res.render('./auth/register', {
            title: 'ثبت نام',
            error: 'متأسفانه مشکلی پیش آمد. لطفاً چند لحظه دیگر دوباره تلاش کنید.',
            filled: req.body
        });
    }
};

exports.renderLogin = async (req, res) => {
    res.render('./auth/login', { title: 'ورود کاربر' });
};

exports.handleLogin = async (req, res) => {
    const { email, password } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('./auth/login', {
            title: 'ورود کاربر',
            errors: errors.array(),
            filled: req.body
        });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.render('./auth/login', {
                title: 'ورود کاربر',
                error: 'کاربری با این ایمیل پیدا نشد. مطمئن شوید که ایمیل خود را درست وارد کرده‌اید!',
                filled: req.body
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

        if (!isPasswordCorrect) {
            return res.render('./auth/login', {
                title: 'ورود کاربر',
                error: 'رمز عبور اشتباه است. لطفاً دوباره تلاش کنید!',
                filled: req.body
            });
        } else {
            req.session.userId = existingUser._id;
            res.redirect('/dashboard/questions');
        }

    } catch (error) {
        console.error(error.message);
        res.render('./auth/login', {
            title: 'ورود کاربر',
            error: 'مشکلی پیش آمد. لطفاً کمی صبر کنید و دوباره تلاش کنید.',
            filled: req.body
        });
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
