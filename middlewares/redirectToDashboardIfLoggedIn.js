const User = require('../models/User');

exports.redirectToDashboardIfLoggedIn = async (req, res, next) => {
    try {
        if (req.path === '/auth/login') {
            return next();
        }

        const userId = req.session.userId;

        if (!userId) {
            return res.redirect('/auth/login');
        }

        const user = await User.findById(userId);

        if (!user) {
            res.clearCookie('connect.sid');
            return req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                    return next(err);
                }
                return res.redirect('/auth/login');
            });
        }

        next();
    } catch (error) {
        console.error(error.message);
    }
};
