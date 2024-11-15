const express = require('express');
const { body } = require('express-validator');

const questionController = require('../../controllers/dashboard/questionController');

const router = express.Router();

router.get('/', questionController.renderQuestions);
router.get('/addQuestion', require('../../middlewares/isAdmin'), questionController.renderAddQuestion);
router.post('/addQuestion', require('../../middlewares/isAdmin'),
    body("text").notEmpty().withMessage("متن سوال اجباری است")
    , questionController.handleAddQuestion);
router.get('/updateQuestion/:questionId', require('../../middlewares/isAdmin'), questionController.renderUpdateQuestion);
router.post('/updateQuestion/:questionId', require('../../middlewares/isAdmin'),
    body("text").notEmpty().withMessage("متن سوال اجباری است")
    , questionController.handleUpdateQuestion);
router.get('/deleteQuestion/:questionId', require('../../middlewares/isAdmin'), questionController.handleDeleteQuestion);

router.use('/:questionId/responses', require('./response'));

module.exports = router;