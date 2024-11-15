const express = require('express');
const profileController = require('../../controllers/dashboard/profileController');
const { body } = require('express-validator');

const router = express.Router();

router.get('/', profileController.renderEditProfile);
router.post('/editProfile',
    body('email').isEmail().withMessage('ایمیل نامعتبر است')
    , profileController.handleEditProfile);

module.exports = router;