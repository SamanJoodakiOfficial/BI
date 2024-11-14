const User = require("../models/User");

const isAdmin = async (req, res, next) => {
    const userId = req.session.userId;

    try {
        const existingUser = await User.findById(userId);

        if (!existingUser) {
            return res.render('./dashboard/question/questions', { title: 'بانک سوالات' });
        }

        if (existingUser.role !== "admin") {
            return res.render('./dashboard/question/questions', { title: 'بانک سوالات' });
        }
        next();
    } catch (error) {
        console.log('خطا در دریافت کاربر');
        res.redirect('/dashboard/questions');
    }
};

module.exports = isAdmin;