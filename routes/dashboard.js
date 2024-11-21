const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
    res.redirect('/dashboard/bi');
});

// Business Intelligence
router.use('/bi', require('./dashboard/bi'));

// Big Picture
router.use('/bigPicture', require('./dashboard/bigPicture'));

// Groups
router.use('/groups', require('../middlewares/isAdmin'), require('./dashboard/group'));

// Sub Groups
router.use('/subGroups', require('../middlewares/isAdmin'), require('./dashboard/subGroup'));

// Questions
router.use('/questions', require('./dashboard/question'));

// Responses
router.use('/responses', require('../middlewares/isAdmin'), require('./dashboard/responseProtected'));

// Users
router.use('/users', require('../middlewares/isAdmin'), require('./dashboard/user'));

// Profile
router.use('/profile', require('./dashboard/profile'));

module.exports = router;