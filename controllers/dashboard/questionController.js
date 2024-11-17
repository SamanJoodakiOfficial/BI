const Group = require('../../models/Group');
const SubGroup = require('../../models/SubGroup');
const Question = require('../../models/Question');
const Response = require('../../models/Response');
const { validationResult } = require('express-validator');
const {
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');

exports.renderQuestions = async (req, res) => {
    const userId = req.session.userId;

    try {
        const query = req.query.questionName;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        let questions;
        let totalQuestions;

        if (query) {
            questions = await Question.find({ name: new RegExp(query, 'i') })
                .populate('groupID', 'name')
                .populate('subGroupID', 'name')
                .populate('userID', 'name')
                .skip((page - 1) * limit)
                .limit(limit);
            totalQuestions = await Question.countDocuments({ name: new RegExp(query, 'i') });
        } else {
            questions = await Question.find({})
                .populate('groupID', 'name')
                .populate('subGroupID', 'name')
                .populate('userID', 'name')
                .skip((page - 1) * limit)
                .limit(limit);;
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
            text = 'گروهی یافت نشد';
        }

        const totalPages = Math.ceil(totalQuestions / limit);

        res.render('./dashboard/question/questions', { title: 'بانک سوالات', questions, text, currentPage: page, query, limit, totalPages, totalQuestions });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/questions');
    }
};

exports.renderAddQuestion = async (req, res) => {
    try {
        const groups = await Group.find({});
        const subGroups = await SubGroup.find({});

        if (groups.length <= 0) {
            req.flash('error', 'ابتدا باید گروه‌ها را اضافه کنید');
            return res.redirect('/dashboard/groups');
        }

        if (subGroups.length <= 0) {
            req.flash('error', 'ابتدا باید زیرگروه‌ها را اضافه کنید');
            return res.redirect('/dashboard/subGroups');
        }

        res.render('./dashboard/question/addQuestion', { title: 'اضافه کردن سوال جدید', groups, subGroups });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/questions');
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
        const subgroup = await SubGroup.findOne({ _id: subGroup }).populate('groupID', '_id');

        if (!subGroup) {
            req.flash('error', 'گروه و زیرگروه تطابق ندارند');
            return res.redirect('/dashboard/questions');
        }
        const code = uuidv4();
        const newQuestion = new Question({
            groupID: subgroup.groupID._id,
            subGroupID: subGroup,
            userID: userId,
            code,
            text,
            description,
        });

        await newQuestion.save();
        req.flash('success', `سوال ${text} با موفقیت ثبت شد`);
        res.redirect('/dashboard/questions/addQuestion');
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/questions/addQuestion');
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
        res.redirect('/dashboard/questions');
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
        const subgroup = await SubGroup.findOne({ _id: subGroup }).populate('groupID', '_id');

        if (!subGroup) {
            req.flash('error', 'گروه و زیرگروه تطابق ندارند');
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

        req.flash('success', `سوال با شناسه ${updatedQuestion._id} با موفقیت ویرایش شد`);
        res.redirect('/dashboard/questions');
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/questions');
    }
};

exports.handleDeleteQuestion = async (req, res) => {
    const questionId = req.params.questionId;

    try {
        const deletedQuestion = await Question.findByIdAndDelete(questionId);

        if (!deletedQuestion) {
            return res.render('./dashboard/question/questions', { title: 'بانک سوالات' });
        }
        req.flash('success', `سوال با شناسه ${deletedQuestion._id} با موفقیت حذف شد`);
        res.redirect('/dashboard/questions');
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/questions');
    }
};