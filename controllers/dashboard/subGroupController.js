const SubGroup = require('../../models/SubGroup');
const Group = require('../../models/Group');

const { validationResult } = require('express-validator');

exports.renderSubGroups = async (req, res) => {
    try {
        const subGroups = await SubGroup.find({}).populate('groupID', 'name').populate('userID', 'email');
        let text = '';
        if (subGroups.length <= 0) { text = 'زیرگروهی یافت نشد'; };

        res.render('./dashboard/subGroup/subGroups', { title: 'مدیریت زیرگروه‌ها', subGroups, text });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/subGroups');
    }
};

exports.renderAddSubGroup = async (req, res) => {
    try {
        const groups = await Group.find({});

        if (groups.length <= 0) {
            return res.render('./dashboard/group/groups', { title: 'مدیریت گروه‌ها' });
        }

        res.render('./dashboard/subGroup/addSubGroup', { title: 'اضافه کردن زیرگروه جدید', groups });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/subGroups');
    }
};

exports.handleAddSubGroup = async (req, res) => {
    const { group, name } = req.body;
    const userId = req.session.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const groups = await Group.find({});
        return res.render('./dashboard/subGroup/addSubGroup', { title: 'اضافه کردن گروه جدید', errors: errors.array(), groups });
    }

    try {
        const existingGroup = await Group.findById(group);
        if (!existingGroup) {
            const groups = await Group.find({});
            return res.render('./dashboard/subGroup/addSubGroup', { title: 'اضافه کردن زیرگروه', error: `گروه ${group} یافت نشد`, groups });
        }

        const exisitingSubGroup = await SubGroup.findOne({ name });
        if (exisitingSubGroup) {
            const exisitingSubGroup = await Group.find({});
            return res.render('./dashboard/subGroup/addSubGroup', { title: 'اضافه کردن زیرگروه', error: `زیرگروه ${name} قبلا ثبت شده است`, exisitingSubGroup });
        }

        const newSubGroup = SubGroup({
            userID: userId,
            groupID: group,
            name
        });

        await newSubGroup.save();
        req.flash('success', `زیرگروه ${name} با موفقیت ثبت شد`);
        const groups = await Group.find({});
        res.redirect('/dashboard/subGroups/addSubGroup');
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/subGroups/addSubGroup');
    }
};

exports.renderUpdateSubGroup = async (req, res) => {
    const subGroupId = req.params.subGroupId;

    try {
        const subGroup = await SubGroup.findById(subGroupId);

        if (!subGroup) {
            return res.render('./dashboard/subGroup/subGroups', { title: 'مدیریت زیرگروه', subGroup });
        }

        const groups = await Group.find({});
        res.render('./dashboard/subGroup/updateSubGroup', { title: `ویرایش زیرگروه ${subGroup.name}`, groups, subGroup });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/subGroups');
    }
};


exports.handleUpdateSubGroup = async (req, res) => {
    const { group, name } = req.body;
    const userId = req.session.userId;
    const subGroupId = req.params.subGroupId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const groups = await Group.find({});
        const subGroup = await SubGroup.findById(subGroupId);
        return res.render(`./dashboard/subGroup/updateSubGroup`, { title: `ویرایش زیرگروه ${name}`, errors: errors.array(), groups, subGroup });
    }

    try {
        const updatedSubGroup = await SubGroup.findByIdAndUpdate(subGroupId, {
            userID: userId,
            groupID: group,
            name
        }, { new: true });

        if (!updatedSubGroup) {
            return res.render('./dashboard/subGroup/subGroups', { title: 'مدیریت زیرگروه‌ها' });
        }

        req.flash('success', `زیرگروه ${name} با موفقیت ویرایش شد`);
        res.redirect('/dashboard/subGroups');
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/subGroups');
    }
};

exports.handleDeleteSubGroup = async (req, res) => {
    const subGroupId = req.params.subGroupId;

    try {
        const deletedSubGroup = await SubGroup.findByIdAndDelete(subGroupId);

        if (!deletedSubGroup) {
            return res.render('./dashboard/subGroup/subGroups', { title: 'مدیریت زیرگروه‌ها' });
        }

        req.flash('success', `زیرگروه ${deletedSubGroup.name} با موفقیت حذف شد`);
        res.redirect('/dashboard/subGroups');
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/subGroups');
    }
};
