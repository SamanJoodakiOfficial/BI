const express = require('express');
const { body } = require('express-validator');

const groupController = require('../../controllers/dashboard/groupController');

const router = express.Router();

router.get('/', groupController.renderGroups);
router.get('/add', groupController.renderAddGroup);
router.post('/add',
    body("name").trim().notEmpty().withMessage("نام گروه اجباری است")
    , groupController.handleAddGroup);
router.get('/edit/:groupId',
    groupController.renderUpdateGroup
);
router.post('/edit/:groupId',
    body("name").trim().notEmpty().withMessage("نام گروه اجباری است"),
    groupController.handleUpdateGroup
);
router.get('/delete/:groupId', groupController.handleDeleteGroup);

module.exports = router;