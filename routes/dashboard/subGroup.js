const express = require('express');
const { body } = require('express-validator');

const subGroupController = require('../../controllers/dashboard/subGroupController');

const router = express.Router();

router.get('/', subGroupController.renderSubGroups);
router.get('/add', subGroupController.renderAddSubGroup);
router.post('/add',
    body("name").trim().notEmpty().withMessage("نام زیرگروه اجباری است")
    , subGroupController.handleAddSubGroup);

router.get('/edit/:subGroupId',
    subGroupController.renderUpdateSubGroup
);
router.post('/edit/:subGroupId',
    body("name").trim().notEmpty().withMessage("نام زیرگروه اجباری است"),
    subGroupController.handleUpdateSubGroup
);
router.get('/delete/:subGroupId', subGroupController.handleDeleteSubGroup);

module.exports = router;