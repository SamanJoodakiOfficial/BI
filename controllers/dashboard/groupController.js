const { validationResult } = require('express-validator');

const Group = require('../../models/Group');

exports.renderGroups = async (req, res) => {
    try {
        const query = req.query.groupName;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        let groups;
        let totalGroups;

        if (query) {
            groups = await Group.find({ name: new RegExp(query, 'i') })
                .populate('userID', 'email')
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec();
            totalGroups = await Group.countDocuments({ name: new RegExp(query, 'i') });
        } else {
            groups = await Group.find({})
                .populate('userID', 'email')
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec();
            totalGroups = await Group.countDocuments({});
        }

        let text = '';
        if (groups.length <= 0) {
            text = 'هیچ گروهی پیدا نشد. شاید بهتر است یک گروه جدید بسازید!';
        }

        const totalPages = Math.ceil(totalGroups / limit);

        res.render('./dashboard/group/groups', { 
            title: 'مدیریت گروه‌ها', 
            groups, 
            text, 
            currentPage: page, 
            query, 
            limit, 
            totalPages, 
            totalGroups 
        });
    } catch (error) {
        console.error('خطا در بارگذاری گروه‌ها:', error.message);
    }
};

exports.renderAddGroup = async (req, res) => {
    res.render('./dashboard/group/addGroup', { title: 'ایجاد گروه جدید' });
};

exports.handleAddGroup = async (req, res) => {
    const { name } = req.body;
    const userId = req.session.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('./dashboard/group/addGroup', { 
            title: 'ایجاد گروه جدید', 
            errors: errors.array() 
        });
    }

    try {
        const existingGroup = await Group.findOne({ name });

        if (existingGroup) {
            req.flash('error', `گروه "${name}" قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید!`);
            return res.redirect('/dashboard/groups/add');
        }

        const newGroup = new Group({ userID: userId, name });

        await newGroup.save();
        req.flash('success', `گروه "${name}" با موفقیت ایجاد شد. اکنون می‌توانید به مدیریت آن بپردازید!`);
        res.redirect('/dashboard/groups/add');
    } catch (error) {
        console.error('خطا در ایجاد گروه:', error.message);
    }
};

exports.renderUpdateGroup = async (req, res) => {
    const groupId = req.params.groupId;

    try {
        const existingGroup = await Group.findById(groupId);

        if (!existingGroup) {
            req.flash('error', `گروهی با شناسه "${groupId}" پیدا نشد. شاید حذف شده باشد!`);
            return res.redirect('/dashboard/groups');
        }

        res.render('./dashboard/group/updateGroup', { 
            title: `ویرایش گروه "${existingGroup.name}"`, 
            group: existingGroup 
        });
    } catch (error) {
        console.error('خطا در بارگذاری گروه:', error.message);
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
            title: `ویرایش گروه "${existingGroup ? existingGroup.name : ''}"`,
            group: existingGroup,
            errors: errors.array(),
        });
    }

    try {
        const existingGroup = await Group.findOne({ name, _id: { $ne: groupId } });
        if (existingGroup) {
            const group = await Group.findById(groupId);
            return res.render(`./dashboard/group/updateGroup`, {
                title: `ویرایش گروه "${group ? group.name : ''}"`,
                group,
                errors: [{ msg: `گروهی با نام "${name}" قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید!` }],
            });
        }

        const updatedGroup = await Group.findByIdAndUpdate(
            groupId,
            { userId, name },
            { new: true }
        );

        if (!updatedGroup) {
            req.flash('error', 'گروه مورد نظر پیدا نشد. شاید حذف شده باشد!');
            return res.redirect('/dashboard/groups');
        }

        req.flash('success', `گروه "${name}" با موفقیت ویرایش شد. به مدیریت عالی ادامه دهید!`);
        res.redirect('/dashboard/groups');
    } catch (error) {
        console.error('خطا در ویرایش گروه:', error.message);
        req.flash('error', 'مشکلی پیش آمد. لطفاً دوباره تلاش کنید.');
    }
};

exports.handleDeleteGroup = async (req, res) => {
    const groupId = req.params.groupId;

    try {
        const deletedGroup = await Group.findByIdAndDelete(groupId);

        if (!deletedGroup) {
            req.flash('error', 'گروه مورد نظر پیدا نشد. شاید قبلاً حذف شده باشد!');
            return res.redirect('/dashboard/groups');
        }

        req.flash('success', `گروه "${deletedGroup.name}" با موفقیت حذف شد. امیدواریم تصمیم خوبی بوده باشد!`);
        res.redirect('/dashboard/groups');
    } catch (error) {
        console.error('خطا در حذف گروه:', error.message);
    }
};
