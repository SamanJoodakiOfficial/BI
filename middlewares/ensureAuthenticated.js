exports.ensureAuthenticated = async (req, res, next) => {
    if (req.session.userId) {
        return res.redirect('/dashboard/bi');
    }
    next();
};