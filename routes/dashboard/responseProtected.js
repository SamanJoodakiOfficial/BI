const express = require('express');
const { body } = require('express-validator');
const responseProtected = require('../../controllers/dashboard/responseProtectedController');

const router = express.Router();

router.get('/', responseProtected.renderResponses);
router.get('/updateResponse/:responseId', responseProtected.renderUpdateResponse);
router.post('/updateResponse/:responseId',
    body("score").notEmpty().withMessage("جواب نمی‌تواند خالی باشد").isInt({ min: 0, max: 100 }).withMessage("جواب می‌بایست بین 0 تا 100 باشد")
    , responseProtected.handleUpdateResponse);
router.get('/addResponseByAdmin', responseProtected.renderAddResponseByAdmin);
router.post('/addResponseByAdmin',
    body("questionId").notEmpty().withMessage("آیدی سوال نمی‌توانید خالی باشد"),
    body("score").notEmpty().withMessage("جواب نمی‌تواند خالی باشد").isInt({ min: 0, max: 100 }).withMessage("جواب می‌بایست بین 0 تا 100 باشد")
    , responseProtected.handleAddResponseByAdmin);
router.get('/deleteResponse/:responseId', responseProtected.handleDeleteResponse);

module.exports = router;