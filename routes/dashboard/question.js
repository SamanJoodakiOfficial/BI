const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');

const upload = require('../../middlewares/multer');
const questionController = require('../../controllers/dashboard/questionController');

const router = express.Router();

router.get('/', questionController.renderQuestions);
router.get('/add', require('../../middlewares/isAdmin'), questionController.renderAddQuestion);
router.post('/add', require('../../middlewares/isAdmin'),
    body("text").trim().notEmpty().withMessage("متن سوال اجباری است")
    , questionController.handleAddQuestion);
router.get('/edit/:questionId', require('../../middlewares/isAdmin'), questionController.renderUpdateQuestion);
router.post('/edit/:questionId', require('../../middlewares/isAdmin'),
    body("text").trim().notEmpty().withMessage("متن سوال اجباری است")
    , questionController.handleUpdateQuestion);
router.get('/delete/:questionId', require('../../middlewares/isAdmin'), questionController.handleDeleteQuestion);
router.post('/import', require('../../middlewares/isAdmin'),
    upload.array('import'),
    (err, req, res, next) => {
        if (err instanceof multer.MulterError) {
            req.flash('error', `خطا در آپلود فایل: ${err.message}`);
            return res.redirect('/dashboard/questions');
        } else if (err) {
            return res.redirect('/dashboard/questions');
        }
        next();
    }
    , questionController.handleImport);

router.use('/:questionId/responses', require('./response'));

module.exports = router;