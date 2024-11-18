const express = require('express');
const bigPictureController = require('../../controllers/dashboard/bigPictureController');

const router = express.Router();

router.get('/', bigPictureController.renderBigPicture);

module.exports = router;