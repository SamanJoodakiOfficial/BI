const { validationResult } = require('express-validator');
const fs = require('fs');

const Group = require('../../models/Group');
const SubGroup = require('../../models/SubGroup');
const Question = require('../../models/Question');
const Response = require('../../models/Response');
const { processFile, validateData, removeDuplicateTexts } = require('../../helpers/helperFunctions');

const {
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');

exports.renderQuestions = async (req, res) => {
    const userId = req.session.userId;

    try {
        const query = req.query.questionText;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        let questions;
        let totalQuestions;

        if (query) {
            questions = await Question.find({ text: new RegExp(query, 'i') })
                .populate('groupID', 'name')
                .populate('subGroupID', 'name')
                .populate('userID', 'name')
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec();
            totalQuestions = await Question.countDocuments({ name: new RegExp(query, 'i') });
        } else {
            questions = await Question.find({})
                .populate('groupID', 'name')
                .populate('subGroupID', 'name')
                .populate('userID', 'name')
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec();
            totalQuestions = await Question.countDocuments({});
        }

        if (questions.length >= 1) {
            for (let question of questions) {
                const responseCount = await Response.countDocuments({ questionID: question._id });

                question.responseCount = responseCount;

                const response = await Response.findOne({ userID: userId, questionID: question._id })
                    .populate('userID', 'email');

                if (response) {
                    question.userResponse = response;
                } else {
                    question.userResponse = null;
                }
            }
        }

        let text = '';
        if (questions.length <= 0) {
            text = 'متأسفیم! هیچ سوالی با شرایط شما پیدا نشد. لطفاً دوباره امتحان کنید.';
        }

        const totalPages = Math.ceil(totalQuestions / limit);

        res.render('./dashboard/question/questions', { title: 'بانک سوالات', questions, text, currentPage: page, query, limit, totalPages, totalQuestions });
    } catch (error) {
        console.error(error.message);
    }
};

exports.renderAddQuestion = async (req, res) => {
    try {
        const groups = await Group.find({});
        const subGroups = await SubGroup.find({});

        if (groups.length <= 0) {
            req.flash('error', 'ابتدا باید گروه‌ها را ایجاد کنید تا بتوانید سوالات اضافه کنید!');
            return res.redirect('/dashboard/groups');
        }

        if (subGroups.length <= 0) {
            req.flash('error', 'ابتدا باید زیرگروه‌ها را ایجاد کنید تا سوالات را اضافه کنید!');
            return res.redirect('/dashboard/subGroups');
        }

        res.render('./dashboard/question/addQuestion', { title: 'اضافه کردن سوال جدید', groups, subGroups });
    } catch (error) {
        console.error(error.message);
    }
};

exports.handleAddQuestion = async (req, res) => {
    const { subGroup, text, description } = req.body;
    const userId = req.session.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const groups = await Group.find({});
        const subGroups = await SubGroup.find({});
        return res.render('./dashboard/question/addQuestion', { title: 'اضافه کردن سوال جدید', errors: errors.array(), groups, subGroups });
    }

    try {
        const subgroup = await SubGroup.findOne({ _id: subGroup }).populate('groupID', '_id name');

        if (!subgroup || !subgroup.groupID) {
            req.flash('error', 'این زیرگروه فعلاً به گروهی متصل نیست.');
            return res.redirect('/dashboard/questions');
        }

        const code = uuidv4();
        const newQuestion = new Question({
            groupID: subgroup.groupID._id,
            subGroupID: subGroup,
            userID: userId,
            code: code ? code : code,
            text,
            description,
        });

        await newQuestion.save();

        req.flash('success', `سوال «${text}» با موفقیت ثبت شد!`);
        res.redirect('/dashboard/questions/add');
    } catch (error) {
        if (error.code === 11000) {
            req.flash('error', 'این سوال قبلاً ثبت شده است. لطفاً سوال جدیدی طراحی کنید.');
        } else {
            console.error(error.message);
            req.flash('error', 'خطای سرور. لطفاً کمی بعد دوباره تلاش کنید.');
        }
        res.redirect('/dashboard/questions/add');
    }
};

exports.renderUpdateQuestion = async (req, res) => {
    const questionId = req.params.questionId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const groups = await Group.find({});
        const subGroups = await SubGroup.find({});
        return res.render('./dashboard/question/addQuestion', { title: 'اضافه کردن سوال جدید', errors: errors.array(), groups, subGroups });
    }

    try {
        const question = await Question.findById(questionId);

        if (!question) {
            return res.render('./dashboard/question/questions', { title: 'بانک سوالات' });
        }

        const groups = await Group.find({});
        const subGroups = await SubGroup.find({});

        res.render('./dashboard/question/updateQuestion', { title: `ویرایش سوال ${question.text}`, groups, subGroups, question });
    } catch (error) {
        console.error(error.message);
    }
};

exports.handleUpdateQuestion = async (req, res) => {
    const { group, subGroup, text, description } = req.body;
    const userId = req.session.userId;
    const questionId = req.params.questionId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const groups = await Group.find({});
        const subGroups = await SubGroup.find({});
        const question = await Question.findById(questionId);
        return res.render('./dashboard/question/updateQuestion', { title: `ویرایش سوال ${question.text}`, errors: errors.array(), groups, subGroups, question });
    }

    try {
        const subgroup = await SubGroup.findOne({ _id: subGroup }).populate('groupID', '_id name');

        if (!subgroup || !subgroup.groupID) {
            req.flash('error', 'این زیرگروه فعلاً به گروهی متصل نیست.');
            return res.redirect('/dashboard/questions');
        }

        const code = uuidv4();
        const updatedQuestion = await Question.findByIdAndUpdate(questionId, {
            groupID: subgroup.groupID._id,
            subGroupID: subGroup,
            userID: userId,
            code: code ? code : code,
            text,
            description,
        }, { new: true });

        if (!updatedQuestion) {
            return res.redirect('/dashboard/questions');
        }

        req.flash('success', `سوال با شناسه «${updatedQuestion._id}» با موفقیت به‌روزرسانی شد!`);
        res.redirect('/dashboard/questions');
    } catch (error) {
        console.error(error.message);
    }
};

exports.handleDeleteQuestion = async (req, res) => {
    const questionId = req.params.questionId;

    try {
        const deletedQuestion = await Question.findByIdAndDelete(questionId);

        if (!deletedQuestion) {
            return res.render('./dashboard/question/questions', { title: 'بانک سوالات' });
        }
        req.flash('success', `سوال با شناسه «${deletedQuestion._id}» با موفقیت حذف شد.`);
        res.redirect('/dashboard/questions');
    } catch (error) {
        console.error(error.message);
    }
};

exports.handleImport = async (req, res) => {
    try {
        const userId = req.session.userId;
        const uploadedFiles = req.files || [];

        const validFileTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        if (!uploadedFiles.length) {
            req.flash('error', 'هیچ فایلی آپلود نشده است. لطفاً دوباره امتحان کنید.');
            return res.redirect('/dashboard/questions');
        }

        const totalData = [];
        const invalidFiles = [];
        const invalidData = [];
        const groupSubGroupMap = new Map();
        const duplicateQuestions = new Set();

        for (const file of uploadedFiles) {
            if (!validFileTypes.includes(file.mimetype)) {
                invalidFiles.push(file.originalname);
                continue;
            }

            try {
                const fileData = await processFile(file);

                fileData.forEach(row => {
                    if (row.groupID && row.subGroupID) {
                        groupSubGroupMap.set(`${row.groupID}:${row.subGroupID}`, null);
                    }
                });

                const validData = validateData(fileData, file.originalname, invalidData);
                totalData.push(...validData);
            } catch (err) {
                console.error(`خطا در پردازش فایل ${file.originalname}: ${err.message}`);
                invalidFiles.push(file.originalname);
            } finally {
                try {
                    await fs.promises.unlink(file.path);
                } catch (err) {
                    console.error(`خطا در حذف فایل ${file.path}: ${err.message}`);
                }
            }
        }

        if (groupSubGroupMap.size === 0) {
            req.flash('error', 'هیچ groupID یا subGroupID معتبری یافت نشد.');
            return res.redirect('/dashboard/questions');
        }
        for (const groupSubGroup of groupSubGroupMap.keys()) {
            const [groupID, subGroupID] = groupSubGroup.split(':');

            const group = await Group.findOneAndUpdate(
                { name: groupID },
                { $setOnInsert: { userID: userId, name: groupID } },
                { upsert: true, new: true }
            );

            const subGroup = await SubGroup.findOneAndUpdate(
                { name: subGroupID, groupID: group._id },
                { $setOnInsert: { userID: userId, groupID: group._id, name: subGroupID } },
                { upsert: true, new: true }
            );

            groupSubGroupMap.set(`${groupID}:${subGroupID}`, { groupID: group._id, subGroupID: subGroup._id });
        }

        totalData.forEach(question => {
            const ids = groupSubGroupMap.get(`${question.groupID}:${question.subGroupID}`);
            if (ids) {
                question.groupID = ids.groupID;
                question.subGroupID = ids.subGroupID;
            }
        });

        const existingQuestions = await Question.find({ text: { $in: totalData.map(q => q.text) } });
        const existingTexts = new Set(existingQuestions.map(q => q.text));
        const uniqueData = totalData.filter(q => !existingTexts.has(q.text));

        uniqueData.forEach(q => duplicateQuestions.add(q.text));

        const operations = uniqueData.map(question => ({
            insertOne: {
                document: {
                    groupID: question.groupID,
                    subGroupID: question.subGroupID,
                    userID: userId,
                    code: uuidv4(),
                    text: question.text,
                    description: question.description || '',
                }
            }
        }));

        if (operations.length > 0) {
            try {
                await Question.bulkWrite(operations, { ordered: false });
            } catch (err) {
                console.error('خطا در ذخیره داده‌ها:', err.message);
                req.flash('error', `خطا در ذخیره داده‌ها. ${err.message}`);
                return res.redirect('/dashboard/questions');
            }
        }

        req.flash('success', `تعداد ${uniqueData.length} سوال با موفقیت ذخیره شدند. سوالات نامعتبر: ${invalidData.length}. ${duplicateQuestions.size > 0 ? `تکراری‌ها: ${duplicateQuestions.size} سوال.` : ''}`);
        res.redirect('/dashboard/questions');
    } catch (error) {
        console.error('خطای کلی:', error.message);
        req.flash('error', 'خطای غیرمنتظره‌ای رخ داده است. لطفاً دوباره تلاش کنید.');
        res.redirect('/dashboard/questions');
    }
};
