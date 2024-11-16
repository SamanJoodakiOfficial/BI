const User = require('../../models/User');
const Question = require('../../models/Question');
const Response = require('../../models/Response');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

exports.renderUsers = async (req, res) => {
    try {
        const users = await User.find({});

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
            text = 'کاربری یافت نشد';
        }

        res.render('./dashboard/user/users', {
            title: 'مدیریت کاربران',
            users: userStats,
            text
        });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/users');
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
            req.flash('error', `کاربر با ایمیل ${email} در سیستم ثبت شده است`);
            return res.redirect('/dashboard/users/addUser');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const validRoles = ['user', 'admin'];

        if (!validRoles.includes(role)) {
            req.flash('error', `${role} در سیستم ثبت نشده است`);
            return res.redirect('/dashboard/users/addUser');
        }

        const newUser = new User({
            email,
            password: hashedPassword,
            role
        });
        await newUser.save();
        req.flash('success', `کاربر با ایمیل ${email} و به عنوان ${role} با موفقیت ثبت نام شد`);
        res.redirect('/dashboard/users/addUser');
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/users/addUser');
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
        res.redirect('/dashboard/users');
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
            req.flash('error', `کاربر با شناسه ${uid} در سیستم ثبت نشده است`);
            return res.redirect('/dashboard/users/addUser');
        }

        const validRoles = ['user', 'admin'];
        if (!validRoles.includes(role)) {
            req.flash('error', `${role} در سیستم ثبت نشده است`);
            return res.redirect(`/dashboard/users/updateUser/${uid}`);
        }

        if (
            currentUser._id.toString() === userId &&
            currentUser.role === 'admin' &&
            role !== 'admin'
        ) {
            req.flash('error', `شما ادمین هستید و نمی‌توانید نقش خود را تغییر دهید`);
            return res.redirect(`/dashboard/users/updateUser/${uid}`);
        }

        // فقط اگر رمز عبور وارد شده باشد، آن را به‌روزرسانی کنید
        if (password && password.trim() !== '') {
            currentUser.password = await bcrypt.hash(password, 10);
        }

        // به‌روزرسانی نقش
        currentUser.role = role;

        await currentUser.save();
        req.flash(
            'success',
            `کاربر با ایمیل ${currentUser.email} و به عنوان ${role} با موفقیت ویرایش شد`
        );
        res.redirect(`/dashboard/users/updateUser/${uid}`);
    } catch (error) {
        console.error(error.message);
        req.flash('error', `خطا در ویرایش کاربر`);
        res.redirect(`/dashboard/users/updateUser/${uid}`);
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
            req.flash('error', 'شما نمی‌توانید حساب خود را حذف کنید');
            return res.redirect('/dashboard/users');
        }

        const deletedUser = await User.findByIdAndDelete(uid);

        if (!deletedUser) {
            req.flash('error', `کاربری با شناسه ${uid} یافت نشد`);
            return res.redirect('/dashboard/users');
        }

        req.flash('success', `کاربر با شناسه ${uid} با موفقیت حذف شد`);
        res.redirect('/dashboard/users');
    } catch (error) {
        console.error('Error deleting user:', error.message);
        req.flash('error', 'خطا در حذف کاربر');
        res.redirect('/dashboard/users');
    }
};
