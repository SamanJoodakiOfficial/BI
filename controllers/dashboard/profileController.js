const User = require('../../models/User');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

exports.renderEditProfile = async (req, res) => {
    const userId = req.session.userId;

    try {
        const currentUser = await User.findById(userId);

        if (!currentUser) {
            return res.render('./dashboard/profile/editPersonalInformation', { title: 'ویرایش اطلاعات کاربری' });
        }

        res.render('./dashboard/profile/editPersonalInformation', { title: 'ویرایش اطلاعات کاربری' });
    } catch (error) {
        console.error(error);
        res.redirect('/dashboard/profile');
    }
};

exports.handleEditProfile = async (req, res) => {
    const { email, currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.session.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('./dashboard/profile/editPersonalInformation', {
            title: 'ویرایش کاربر',
            errors: errors.array()
        });
    }

    try {
        const currentUser = await User.findById(userId);

        if (!currentUser) {
            req.flash('error', 'کاربر یافت نشد');
            return res.redirect('/dashboard/profile');
        }

        // بررسی وجود ایمیل تکراری
        const searchUser = await User.findOne({ email, _id: { $ne: userId } });
        if (searchUser) {
            return res.render('./dashboard/profile/editPersonalInformation', {
                title: 'ویرایش اطلاعات کاربری',
                errors: [{ msg: 'کاربری با این ایمیل از قبل وجود دارد' }]
            });
        }

        if (email) {
            currentUser.email = email;
        }

        const isPasswordCorrect = await bcrypt.compare(currentPassword, currentUser.password);
        if (!isPasswordCorrect) {
            return res.render('./dashboard/profile/editPersonalInformation', {
                title: 'ویرایش اطلاعات کاربری',
                errors: [{ msg: 'رمز عبور فعلی اشتباه است' }]
            });
        }

        if (newPassword) {
            if (newPassword !== confirmNewPassword) {
                return res.render('./dashboard/profile/editPersonalInformation', {
                    title: 'ویرایش اطلاعات کاربری',
                    errors: [{ msg: 'رمز عبور جدید و تکرار آن مطابقت ندارند' }]
                });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            currentUser.password = hashedPassword;
        }

        await currentUser.save();
        req.flash('success', 'حساب شما با موفقیت بروزرسانی شد');
        res.redirect('/dashboard/profile');
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'خطایی رخ داد، لطفاً دوباره تلاش کنید');
        res.redirect('/dashboard/profile');
    }
};