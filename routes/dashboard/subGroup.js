const express = require('express');
const { body } = require('express-validator');

const subGroupController = require('../../controllers/dashboard/subGroupController');

const router = express.Router();

router.get('/', subGroupController.renderSubGroups);
router.get('/addSubGroup', subGroupController.renderAddSubGroup);
router.post('/addSubGroup',
    body("name").notEmpty().withMessage("نام زیرگروه اجباری است")
    , subGroupController.handleAddSubGroup);

router.get('/updateSubGroup/:subGroupId',
    subGroupController.renderUpdateSubGroup
);
router.post('/updateSubGroup/:subGroupId',
    body("name").notEmpty().withMessage("نام زیرگروه اجباری است"),
    subGroupController.handleUpdateSubGroup
);
router.get('/deleteSubGroup/:subGroupId', subGroupController.handleDeleteSubGroup);

module.exports = router;