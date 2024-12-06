const express = require('express');

const router = express.Router();

// Base Route
router.get('/', (req, res) => {
    res.redirect('/dashboard/bi');
});

// Public Routes
router.use('/bi', require('./dashboard/bi'));
router.use('/bigPicture', require('./dashboard/bigPicture'));
router.use('/reports', require('./dashboard/report'));
router.use('/questions', require('./dashboard/question'));
router.use('/profile', require('./dashboard/profile'));

// Admin Routes
router.use('/groups', require('../middlewares/isAdmin'), require('./dashboard/group'));
router.use('/subGroups', require('../middlewares/isAdmin'), require('./dashboard/subGroup'));
router.use('/responses', require('../middlewares/isAdmin'), require('./dashboard/responseProtected'));
router.use('/users', require('../middlewares/isAdmin'), require('./dashboard/user'));

module.exports = router;