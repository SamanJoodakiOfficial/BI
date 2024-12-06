const express = require('express');
const { body } = require('express-validator');

const profileController = require('../../controllers/dashboard/profileController');

const router = express.Router();

router.get('/', profileController.renderEditProfile);
router.post('/edit',
    body('email').trim().isEmail().withMessage('ایمیل نامعتبر است')
    , profileController.handleEditProfile);

module.exports = router;