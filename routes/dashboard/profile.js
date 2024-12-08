const express = require('express');
const { body } = require('express-validator');

const profileController = require('../../controllers/dashboard/profileController');

const router = express.Router();

router.get('/', profileController.renderEditProfile);
router.post('/edit',
    body('email').trim().isEmail().withMessage('ایمیل نامعتبر است'),
    body("currentPassword").isLength({ min: 6, max: 20 }).withMessage("تعداد کاراکتر کلمه عبور می‌بایست بین 6 تا 20 کاراکتر باشد"),
    body("newPassword").isLength({ min: 6, max: 20 }).withMessage("تعداد کاراکتر کلمه عبور جدید می‌بایست بین 6 تا 20 کاراکتر باشد"),
    body("confirmNewPassword")
        .isLength({ min: 6, max: 20 }).withMessage("تعداد کاراکتر تایید کلمه عبور می‌بایست بین 6 تا 20 کاراکتر باشد")
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('تایید کلمه عبور جدید با کلمه عبور جدید مطابقت ندارد');
            }
            return true;
        }),
    profileController.handleEditProfile);

module.exports = router;
