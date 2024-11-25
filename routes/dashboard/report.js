const express = require('express');
const reportController = require('../../controllers/dashboard/reportController');
const router = express.Router();

router.get('/', reportController.renderReports);

module.exports = router;