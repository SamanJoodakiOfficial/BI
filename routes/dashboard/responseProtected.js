const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');

const responseProtected = require('../../controllers/dashboard/responseProtectedController');
const upload = require('../../middlewares/multer');

const router = express.Router();

router.get('/', responseProtected.renderResponses);
router.get('/edit/:responseId', responseProtected.renderUpdateResponse);
router.post('/edit/:responseId',
    upload.array('files', 10),
    (err, req, res, next) => {
        if (err instanceof multer.MulterError) {
            req.flash('error', `خطا در آپلود فایل: ${err.message}`);
            return res.redirect('/dashboard/responses');
        } else if (err) {
            return res.redirect('/dashboard/responses');
        }
        next();
    },
    body("score").trim().notEmpty().withMessage("جواب نمی‌تواند خالی باشد").isInt({ min: 0, max: 100 }).withMessage("جواب می‌بایست بین 0 تا 100 باشد")
    , responseProtected.handleUpdateResponse);
router.get('/addResponseByAdmin', responseProtected.renderAddResponseByAdmin);
router.post('/addResponseByAdmin',
    upload.array('files', 10),
    (err, req, res, next) => {
        if (err instanceof multer.MulterError) {
            req.flash('error', `خطا در آپلود فایل: ${err.message}`);
            return res.redirect('/dashboard/responses');
        } else if (err) {
            return res.redirect('/dashboard/responses');
        }
        next();
    },
    body("questionId").trim().notEmpty().withMessage("آیدی سوال نمی‌توانید خالی باشد"),
    body("score").trim().notEmpty().withMessage("جواب نمی‌تواند خالی باشد").isInt({ min: 0, max: 100 }).withMessage("جواب می‌بایست بین 0 تا 100 باشد")
    , responseProtected.handleAddResponseByAdmin);
router.get('/delete/:responseId', responseProtected.handleDeleteResponse);

module.exports = router;