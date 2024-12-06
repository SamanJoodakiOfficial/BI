const SubGroup = require('../../models/SubGroup');
const Group = require('../../models/Group');

const { validationResult } = require('express-validator');

exports.renderSubGroups = async (req, res) => {
    try {
        const query = req.query.subGroupName;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        let subGroups;
        let totalSubGroups;

        if (query) {
            subGroups = await SubGroup.find({ name: new RegExp(query, 'i') })
                .populate('groupID', 'name')
                .populate('userID', 'email')
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec();
            totalSubGroups = await SubGroup.countDocuments({ name: new RegExp(query, 'i') });
        } else {
            subGroups = await SubGroup.find({})
                .populate('groupID', 'name')
                .populate('userID', 'email')
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec();
            totalSubGroups = await SubGroup.countDocuments({});
        }

        let text = '';
        if (subGroups.length <= 0) {
            text = 'زیرگروهی یافت نشد';
        }

        const totalPages = Math.ceil(totalSubGroups / limit);

        res.render('./dashboard/subGroup/subGroups', { title: 'مدیریت زیرگروه‌ها', subGroups, text, currentPage: page, query, limit, totalPages, totalSubGroups });
    } catch (error) {
        console.error(error.message);
    }
};

exports.renderAddSubGroup = async (req, res) => {
    try {
        const groups = await Group.find({});

        if (groups.length <= 0) {
            req.flash('error', 'ابتدا باید گروه‌ها را اضافه کنید');
            return res.redirect('/dashboard/groups');
        }

        res.render('./dashboard/subGroup/addSubGroup', { title: 'اضافه کردن زیرگروه جدید', groups });
    } catch (error) {
        console.error(error.message);
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
            const groups = await Group.find({});
            const exisitingSubGroup = await Group.find({});

            req.flash('error', 'این زیرگروه قبلا ثبت شده است');
            return res.redirect('/dashboard/subGroups/add');
        }

        const newSubGroup = SubGroup({
            userID: userId,
            groupID: group,
            name
        });

        await newSubGroup.save();
        req.flash('success', `زیرگروه ${name} با موفقیت ثبت شد`);
        const groups = await Group.find({});
        res.redirect('/dashboard/subGroups/add');
    } catch (error) {
        console.error(error.message);
    }
};

exports.renderUpdateSubGroup = async (req, res) => {
    const subGroupId = req.params.subGroupId;

    try {
        const subGroup = await SubGroup.findById(subGroupId);

        if (!subGroup) {
            req.flash('error', `زیرگروه با شناسه ${subGroupId} یافت نشد.`);
            return res.redirect('/dashboard/subGroups');
        }

        const groups = await Group.find({});

        if (!groups.length) {
            req.flash('error', 'برای اضافه یا ویرایش کردن زیرگروه می‌بایست حداقل یک گروه وجود داشته باشد');
            return res.redirect('/dashboard/groups');
        }

        res.render('./dashboard/subGroup/updateSubGroup', { title: `ویرایش زیرگروه ${subGroup.name}`, groups, subGroup });
    } catch (error) {
        console.error(error.message);
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
        return res.render(`./dashboard/subGroup/updateSubGroup`, {
            title: `ویرایش زیرگروه ${name}`,
            errors: errors.array(),
            groups,
            subGroup,
        });
    }

    try {
        const existingSubGroup = await SubGroup.findOne({ name, _id: { $ne: subGroupId } });
        if (existingSubGroup) {
            const groups = await Group.find({});
            const subGroup = await SubGroup.findById(subGroupId);
            return res.render(`./dashboard/subGroup/updateSubGroup`, {
                title: `ویرایش زیرگروه ${name}`,
                errors: [{ msg: `زیرگروهی با نام ${name} قبلاً ثبت شده است.` }],
                groups,
                subGroup,
            });
        }

        const updatedSubGroup = await SubGroup.findByIdAndUpdate(
            subGroupId,
            {
                userID: userId,
                groupID: group,
                name,
            },
            { new: true }
        );

        if (!updatedSubGroup) {
            return res.render('./dashboard/subGroup/subGroups', { title: 'مدیریت زیرگروه‌ها' });
        }

        req.flash('success', `زیرگروه ${name} با موفقیت ویرایش شد`);
        res.redirect('/dashboard/subGroups');
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'خطایی در ویرایش زیرگروه رخ داد');
    }
};


exports.handleDeleteSubGroup = async (req, res) => {
    const subGroupId = req.params.subGroupId;

    try {
        const deletedSubGroup = await SubGroup.findByIdAndDelete(subGroupId);

        if (!deletedSubGroup) {
            req.flash('error', 'زیرگروه یافت نشد');
            res.redirect('/dashboard/subGroups');
        }

        req.flash('success', `زیرگروه ${deletedSubGroup.name} با موفقیت حذف شد`);
        res.redirect('/dashboard/subGroups');
    } catch (error) {
        console.error(error.message);
    }
};