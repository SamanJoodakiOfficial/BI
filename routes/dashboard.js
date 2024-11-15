const express = require('express');

const router = express.Router();

// Groups
router.use('/groups', require('../middlewares/isAdmin'), require('./dashboard/group'));

// Sub Groups
router.use('/subGroups', require('../middlewares/isAdmin'), require('./dashboard/subGroup'));

// Questions
router.use('/questions', require('./dashboard/question'));

// Responses
router.use('/responses', require('../middlewares/isAdmin'), require('./dashboard/responseProtected'));

module.exports = router;