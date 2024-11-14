const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Groups
router.use('/groups', require('../middlewares/isAdmin'), require('./dashboard/group'));

// Sub Groups
router.use('/subGroups', require('../middlewares/isAdmin'), require('./dashboard/subGroup'));

module.exports = router;