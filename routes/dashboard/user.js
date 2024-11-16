const express = require('express');
const userController = require('../../controllers/dashboard/userController');
const { body } = require('express-validator');

const router = express.Router();

router.get('/', userController.renderUsers);
router.get('/addUser', userController.renderAddUser);
router.post('/addUser',
    body("email")
        .isEmail()
        .withMessage("ایمیل نامعتبر است"),
    body("password")
        .isLength({ min: 6, max: 20 })
        .withMessage("تعداد کاراکتر کلمه عبور می‌بایست بین 6 تا 20 کاراکتر باشد"),
    body("role")
        .notEmpty()
        .withMessage("نقش کاربر الزامی است")
        .isIn(['user', 'admin'])
        .withMessage("نقش معتبر نیست (فقط user یا admin قابل قبول است)"),
    userController.handleAddUser);
router.get('/updateUser/:uid', userController.renderUpdateUser);
router.post('/updateUser/:uid', userController.handleUpdateUser);
router.get('/deleteUser/:uid', userController.handleDeleteUser);
module.exports = router;