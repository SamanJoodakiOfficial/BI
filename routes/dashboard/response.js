const express = require('express');
const { body } = require('express-validator');

const responseController = require('../../controllers/dashboard/responseController');

const router = express.Router({ mergeParams: true });

router.get('/addResponse', responseController.renderAddResponse);
router.post('/addResponse',
    body("score").notEmpty().withMessage("جواب نمی‌تواند خالی باشد").isInt({ min: 0, max: 100 }).withMessage("جواب می‌بایست بین 0 تا 100 باشد")
    , responseController.handleAddResponse);

module.exports = router;