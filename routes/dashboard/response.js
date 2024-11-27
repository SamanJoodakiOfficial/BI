const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const upload = require('../../middlewares/multer');

const responseController = require('../../controllers/dashboard/responseController');

const router = express.Router({ mergeParams: true });

router.get('/addResponse', responseController.renderAddResponse);
router.post('/addResponse',
    upload.array('files', 10),
    (err, req, res, next) => {
        if (err instanceof multer.MulterError) {
            req.flash('error', `خطا در آپلود فایل: ${err.message}`);
            return res.redirect('/dashboard/questions');
        } else if (err) {
            return res.redirect('/dashboard/questions');
        }
        next();
    },
    body("score").trim().notEmpty().withMessage("جواب نمی‌تواند خالی باشد").isInt({ min: 0, max: 100 }).withMessage("جواب می‌بایست بین 0 تا 100 باشد")
    , responseController.handleAddResponse);

module.exports = router;