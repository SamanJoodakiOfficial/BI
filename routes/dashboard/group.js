const express = require('express');
const { body } = require('express-validator');

const groupController = require('../../controllers/dashboard/groupController');

const router = express.Router();

router.get('/', groupController.renderGroups);
router.get('/addGroup', groupController.renderAddGroup);
router.post('/addGroup',
    body("name").notEmpty().withMessage("نام گروه اجباری است")
    , groupController.handleAddGroup);
router.get('/updateGroup/:groupId',
    groupController.renderUpdateGroup
);
router.post('/updateGroup/:groupId',
    body("name").notEmpty().withMessage("نام گروه اجباری است"),
    groupController.handleUpdateGroup
);
router.get('/deleteGroup/:groupId', groupController.handleDeleteGroup);

module.exports = router;