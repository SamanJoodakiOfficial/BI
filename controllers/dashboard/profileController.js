const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

const User = require('../../models/User');

const renderProfileForm = (res, title, errors = [], success = null) => {
    res.render('./dashboard/profile/editPersonalInformation', {
        title,
        errors,
        success,
    });
};

exports.renderEditProfile = async (req, res) => {
    const userId = req.session.userId;

    try {
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return renderProfileForm(res, 'ویرایش اطلاعات کاربری', [
                { msg: 'متأسفیم! کاربر موردنظر پیدا نشد.' },
            ]);
        }
        renderProfileForm(res, 'ویرایش اطلاعات کاربری');
    } catch (error) {
        console.error('Error fetching user profile:', error);
        req.flash('error', 'یک خطای غیرمنتظره رخ داده است. لطفاً دوباره تلاش کنید.');
        res.redirect('/dashboard/profile');
    }
};

exports.handleEditProfile = async (req, res) => {
    const { email, currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.session.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return renderProfileForm(res, 'ویرایش اطلاعات حساب کاربری', errors.array());
    }

    try {
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            req.flash('error', 'کاربر شناسایی نشد! لطفاً دوباره وارد شوید.');
            return res.redirect('/dashboard/profile');
        }

        if (email && (await User.findOne({ email, _id: { $ne: userId } }))) {
            return renderProfileForm(res, 'ویرایش اطلاعات حساب کاربری', [
                { msg: 'ایمیل وارد شده قبلاً ثبت شده است. لطفاً ایمیل دیگری امتحان کنید.' },
            ]);
        }

        if (email) currentUser.email = email;

        if (!(await bcrypt.compare(currentPassword, currentUser.password))) {
            return renderProfileForm(res, 'ویرایش اطلاعات حساب کاربری', [
                { msg: 'رمز عبور فعلی نادرست است. لطفاً دوباره تلاش کنید.' },
            ]);
        }

        if (newPassword) {
            if (newPassword !== confirmNewPassword) {
                return renderProfileForm(res, 'ویرایش اطلاعات حساب کاربری', [
                    { msg: 'رمز عبور جدید و تکرار آن مطابقت ندارند. لطفاً بررسی کنید.' },
                ]);
            }
            currentUser.password = await bcrypt.hash(newPassword, 10);
        }

        await currentUser.save();
        req.flash('success', 'اطلاعات حساب شما با موفقیت به‌روزرسانی شد!');
        res.redirect('/dashboard/profile');
    } catch (error) {
        console.error('Error updating profile:', error.message);
        req.flash('error', 'خطایی در پردازش درخواست شما رخ داد. لطفاً دوباره تلاش کنید.');
        res.redirect('/dashboard/profile');
    }
};
