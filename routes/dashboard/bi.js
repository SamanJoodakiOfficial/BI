const express = require('express');
const biContaoller = require('../../controllers/dashboard/biContaoller');

const router = express.Router();

router.get('/', biContaoller.renderBI);

module.exports = router;