const Group = require('../../models/Group');
const User = require('../../models/User');
const { validationResult } = require('express-validator');

exports.renderGroups = async (req, res) => {
    try {
        const groups = await Group.find({}).populate('userID', 'email');
        let text = '';
        if (groups.length <= 0) {
            text = 'گروهی یافت نشد';
        }

        res.render('./dashboard/group/groups', { title: 'مدیریت گروه‌ها', groups, text });
    } catch (error) {
        console.error(error.message);
    }
};

exports.renderAddGroup = async (req, res) => {
    res.render('./dashboard/group/addGroup', { title: 'اضافه کردن گروه جدید' });
};

exports.handleAddGroup = async (req, res) => {
    const { name } = req.body;
    const userId = req.session.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('./dashboard/group/addGroup', { title: 'اضافه کردن گروه جدید', errors: errors.array() });
    }

    try {
        const existingGroup = await Group.findOne({ name });

        if (existingGroup) {
            return res.render('./dashboard/group/addGroup', { title: 'اضافه کردن گروه جدید', error: `گروه ${name} وجود دارد` });
        }

        const newGroup = new Group({ userID: userId, name });

        await newGroup.save();
        req.flash('success', `گروه ${name} با موفقیت ثبت شد`);
        res.redirect('/dashboard/groups/addGroup');
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/groups/addGroup');
    }
};

exports.renderUpdateGroup = async (req, res) => {
    const groupId = req.params.groupId;

    try {
        const existingGroup = await Group.findById(groupId);

        if (!existingGroup) {
            return res.render("./dashboard/group/groups", { title: "مدیریت گروه‌ها" });
        }

        res.render('./dashboard/group/updateGroup', { title: `ویرایش گروه ${existingGroup.name}`, group: existingGroup });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/groups');
    }
};

exports.handleUpdateGroup = async (req, res) => {
    const { name } = req.body;
    const userId = req.session.userId;
    const groupId = req.params.groupId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const existingGroup = await Group.findById(groupId);
        return res.render(`./dashboard/group/updateGroup`, {
            title: `ویرایش گروه ${existingGroup ? existingGroup.name : ''}`,
            group: existingGroup,
            errors: errors.array()
        });
    }

    try {
        const updatedGroup = await Group.findByIdAndUpdate(groupId, { userId, name }, { new: true });

        if (!updatedGroup) {
            return res.render('./dashboard/group/groups', { title: "مدیریت گروه‌ها" });
        }

        req.flash('success', `گروه ${name} با موفقیت ویرایش شد`);
        res.redirect('/dashboard/groups');
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/groups');
    }
};


exports.handleDeleteGroup = async (req, res) => {
    const groupId = req.params.groupId;

    try {
        const deletedGroup = await Group.findByIdAndDelete(groupId);

        if (!deletedGroup) {
            return res.render('./dashboard/group/groups', { title: "مدیریت گروه‌ها" });
        }

        req.flash('success', `گروه ${deletedGroup.name} با موفقیت حذف شد`);
        res.redirect('/dashboard/groups');
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/groups');
    }
};