const express = require('express');
const { body } = require('express-validator');

const questionController = require('../../controllers/dashboard/questionController');

const router = express.Router();

router.get('/', questionController.renderQuestions);
router.get('/addQuestion', questionController.renderAddQuestion);
router.post('/addQuestion',
    body("text").notEmpty().withMessage("متن سوال اجباری است")
    , questionController.handleAddQuestion);
router.get('/updateQuestion/:questionId', questionController.renderUpdateQuestion);
router.post('/updateQuestion/:questionId',
    body("text").notEmpty().withMessage("متن سوال اجباری است")
    , questionController.handleUpdateQuestion);
router.get('/deleteQuestion/:questionId', questionController.handleDeleteQuestion);
module.exports = router;