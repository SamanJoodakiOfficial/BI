const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Questions
router.get('/questions', dashboardController.renderQuestions);

// Groups
router.get('/groups', dashboardController.renderGroups);

// SubGroups
router.get('/subGroups', dashboardController.renderSubGroups);

// Responses
router.get('/responses', dashboardController.renderResponses);

// Users
router.get('/users', dashboardController.renderUsers);

// Profile
router.get('/profile', dashboardController.renderProfile);

module.exports = router;