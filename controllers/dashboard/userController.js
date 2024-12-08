const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const User = require('../../models/User');
const Question = require('../../models/Question');
const Response = require('../../models/Response');

exports.renderUsers = async (req, res) => {
    try {
        const query = req.query.userEmail;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        let users;
        let totalUsers;

        if (query) {
            users = await User.find({ email: new RegExp(query, 'i') })
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec();
            totalUsers = await User.countDocuments({ email: new RegExp(query, 'i') });
        } else {
            users = await User.find({})
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec();
            totalUsers = await User.countDocuments({});
        }

        const userStats = await Promise.all(users.map(async (user) => {
            const questionCount = await Question.countDocuments({ userID: user._id });
            const responseCount = await Response.countDocuments({ userID: user._id });

            return {
                ...user.toObject(),
                questionCount,
                responseCount,
            };
        }));

        let text = '';
        if (users.length <= 0) {
            text = 'متاسفانه هیچ کاربری با مشخصات وارد شده پیدا نشد. لطفاً دوباره تلاش کنید!';
        }

        const totalPages = Math.ceil(totalUsers / limit);

        res.render('./dashboard/user/users', { title: 'مدیریت کاربران', users: userStats, text, currentPage: page, query, limit, totalPages, totalUsers });
    } catch (error) {
        console.error(error.message);
    }
};

exports.renderAddUser = async (req, res) => {
    res.render('./dashboard/user/addUser', { title: 'کاربر جدید' });
};

exports.handleAddUser = async (req, res) => {
    const { email, password, role } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('./dashboard/user/addUser', { title: 'کاربر جدید', errors: errors.array() });
    }

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            req.flash('error', `کاربر با ایمیل ${email} قبلاً در سیستم ثبت شده است. لطفاً ایمیل دیگری وارد کنید.`);
            return res.redirect('/dashboard/users/add');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const validRoles = ['user', 'admin'];

        if (!validRoles.includes(role)) {
            req.flash('error', `نقش ${role} نامعتبر است. لطفاً یکی از نقش‌های معتبر (کاربر یا ادمین) را انتخاب کنید.`);
            return res.redirect('/dashboard/users/add');
        }

        const newUser = new User({
            email,
            password: hashedPassword,
            role
        });
        await newUser.save();
        req.flash('success', `با موفقیت کاربر با ایمیل ${email} به عنوان ${role} اضافه شد. خوش آمدید!`);
        res.redirect('/dashboard/users/add');
    } catch (error) {
        console.error(error.message);
    }
};

exports.renderUpdateUser = async (req, res) => {
    const uid = req.params.uid;

    try {
        const selectedUser = await User.findById(uid);

        if (!selectedUser) {
            req.flash('error', `کاربر با شناسه ${uid} یافت نشد`);
            return res.redirect('/dashboard/users');
        }

        res.render('./dashboard/user/updateUser', { title: `ویرایش کاربر با شناسه ${uid}`, selectedUser });
    } catch (error) {
        console.error(error.message);
    }
};

exports.handleUpdateUser = async (req, res) => {
    const { password, role } = req.body;
    const uid = req.params.uid;
    const userId = req.session.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const selectedUser = await User.findById(uid);
        return res.render('./dashboard/user/updateUser', {
            title: `ویرایش کاربر با شناسه ${uid}`,
            errors: errors.array(),
            selectedUser,
        });
    }

    try {
        const currentUser = await User.findById(uid);
        if (!currentUser) {
            req.flash('error', `کاربر با شناسه ${uid} در سیستم یافت نشد. لطفاً مجدداً بررسی کنید.`);
            return res.redirect('/dashboard/users/add');
        }

        const validRoles = ['user', 'admin'];
        if (!validRoles.includes(role)) {
            req.flash('error', `نقش جدید ${role} نامعتبر است. تنها دو نقش معتبر "کاربر" و "ادمین" هستند.`);
            return res.redirect(`/dashboard/users/edit/${uid}`);
        }

        if (
            currentUser._id.toString() === userId &&
            currentUser.role === 'admin' &&
            role !== 'admin'
        ) {
            req.flash('error', `شما نمی‌توانید نقش خود را تغییر دهید. ادمین‌ها نمی‌توانند به نقش غیر ادمین تغییر پیدا کنند.`);
            return res.redirect(`/dashboard/users/edit/${uid}`);
        }

        if (password && password.trim() !== '') {
            currentUser.password = await bcrypt.hash(password, 10);
        }

        currentUser.role = role;

        await currentUser.save();
        req.flash('success', `اطلاعات کاربر با ایمیل ${currentUser.email} و به عنوان ${role} با موفقیت به روزرسانی شد.`);
        res.redirect(`/dashboard/users/edit/${uid}`);
    } catch (error) {
        console.error(error.message);
        req.flash('error', `خطا در ویرایش کاربر`);
    }
};

exports.handleDeleteUser = async (req, res) => {
    const uid = req.params.uid;
    const userId = req.session.userId;

    try {
        const existingUser = await User.findById(userId);

        if (!existingUser) {
            req.flash('error', 'کاربر جاری یافت نشد');
            return res.redirect('/dashboard/users');
        }

        if (existingUser._id.toString() === uid) {
            req.flash('error', 'شما نمی‌توانید حساب خود را حذف کنید. برای حذف حساب دیگران از پنل مدیریت استفاده کنید.');
            return res.redirect('/dashboard/users');
        }

        const deletedUser = await User.findByIdAndDelete(uid);

        if (!deletedUser) {
            req.flash('error', `کاربر با شناسه ${uid} در سیستم یافت نشد. ممکن است قبلاً حذف شده باشد.`);
            return res.redirect('/dashboard/users');
        }

        req.flash('success', `کاربر با شناسه ${uid} به طور کامل از سیستم حذف شد. عملیات با موفقیت انجام شد.`);
        res.redirect('/dashboard/users');
    } catch (error) {
        console.error('Error deleting user:', error.message);
        req.flash('error', 'خطا در حذف کاربر');
    }
};
