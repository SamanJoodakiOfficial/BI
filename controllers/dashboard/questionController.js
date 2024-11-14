const Group = require('../../models/Group');
const SubGroup = require('../../models/SubGroup');
const Question = require('../../models/Question');
const { validationResult } = require('express-validator');
const {
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');

exports.renderQuestions = async (req, res) => {
    try {
        const questions = await Question.find({}).populate('groupID', 'name').populate('subGroupID', 'name').populate('userID', 'name');

        let text = '';
        if (questions.length <= 0) {
            text = 'سوالی یافت نشد';
        }

        res.render('./dashboard/question/questions', { title: 'بانک سوالات', questions, text });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/questions');
    }
};

exports.renderAddQuestion = async (req, res) => {
    try {
        const groups = await Group.find({});
        const subGroups = await SubGroup.find({});

        if (groups.length <= 0 || subGroups.length <= 0) {
            return res.render('./dashboard/group/groups', { title: 'بانک سوالات' });
        }

        res.render('./dashboard/question/addQuestion', { title: 'اضافه کردن سوال جدید', groups, subGroups });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/questions');
    }
};

exports.handleAddQuestion = async (req, res) => {
    const { group, subGroup, text, description, status } = req.body;
    const userId = req.session.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const groups = await Group.find({});
        const subGroups = await SubGroup.find({});
        return res.render('./dashboard/question/addQuestion', { title: 'اضافه کردن سوال جدید', errors: errors.array(), groups, subGroups });
    }

    try {
        const code = uuidv4();
        const newQuestion = Question({
            groupID: group,
            subGroupID: subGroup,
            userID: userId,
            code,
            text,
            description,
            status
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
    const { group, subGroup, text, description, status } = req.body;
    const userId = req.session.userId;
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
    const { group, subGroup, text, description, status } = req.body;
    const userId = req.session.userId;
    const questionId = req.params.questionId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const groups = await Group.find({});
        const subGroups = await SubGroup.find({});
        return res.render('./dashboard/question/updateQuestion', { title: `ویرایش سوال ${question.text}`, errors: errors.array(), groups, subGroups });
    }

    try {
        const code = uuidv4();
        const updatedQuestion = await Question.findByIdAndUpdate(questionId, {
            groupID: group,
            subGroupID: subGroup,
            userID: userId,
            code,
            text,
            description,
            status
        }, { new: true });

        if (!updatedQuestion) {
            return res.render('./dashboard/question/questions', { title: "بانک سوالات" });
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