const { default: mongoose } = require('mongoose');
const Question = require('../../models/Question');
const Response = require('../../models/Response');
const { validationResult } = require('express-validator');

exports.renderAddResponse = async (req, res) => {
    const questionId = req.params.questionId;

    try {
        const question = await Question.findById(questionId).populate('groupID', 'name').populate('subGroupID', 'name').populate('userID', 'email');

        if (!question) {
            return res.render('./dashboard/question/questions', { title: 'بانک سوالات' });
        }

        res.render('./dashboard/response/addResponse', { title: `اضافه کردن پاسخ جدید برای سوال ${question._id}`, question });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/responses');
    }
};

exports.handleAddResponse = async (req, res) => {
    const { score, description, file } = req.body;
    const userId = req.session.userId;
    const questionId = req.params.questionId;

    const parsedScore = parseInt(score);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const question = await Question.findById(questionId).populate('groupID', 'name').populate('subGroupID', 'name').populate('userID', 'email');
        return res.render(`./dashboard/questions`, { title: `اضافه کردن پاسخ جدید برای سوال ${questionId}`, errors: errors.array(), question });
    }

    try {
        const newResponse = new Response({
            userID: userId,
            questionID: questionId,
            score: parsedScore,
            description,
            documents: file ? [file] : []
        });
        await newResponse.save();
        req.flash('success', `جواب ${score} برای سوال ${questionId} با موفقیت ثبت شد`);
        res.redirect('/dashboard/responses');
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/responses');
    }
};