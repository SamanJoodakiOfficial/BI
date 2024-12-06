const express = require('express');
const bigPictureController = require('../../controllers/dashboard/bigPictureController');

const router = express.Router();

router.get('/', bigPictureController.renderBigPicture);
router.post('/process-colors', bigPictureController.renderBigPicture);

module.exports = router;