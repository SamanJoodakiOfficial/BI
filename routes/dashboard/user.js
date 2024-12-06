const express = require('express');
const { body } = require('express-validator');

const userController = require('../../controllers/dashboard/userController');

const router = express.Router();

router.get('/', userController.renderUsers);
router.get('/add', userController.renderAddUser);
router.post('/add',
    body("email")
        .trim()
        .isEmail()
        .withMessage("ایمیل نامعتبر است"),
    body("password")
        .trim()
        .isLength({ min: 6, max: 20 })
        .withMessage("تعداد کاراکتر کلمه عبور می‌بایست بین 6 تا 20 کاراکتر باشد"),
    body("role")
        .trim()
        .notEmpty()
        .withMessage("نقش کاربر الزامی است")
        .isIn(['user', 'admin'])
        .withMessage("نقش معتبر نیست (فقط user یا admin قابل قبول است)"),
    userController.handleAddUser);
router.get('/edit/:uid', userController.renderUpdateUser);
router.post('/edit/:uid', userController.handleUpdateUser);
router.get('/delete/:uid', userController.handleDeleteUser);
module.exports = router;