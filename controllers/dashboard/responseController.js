const Question = require('../../models/Question');
const Response = require('../../models/Response');
const { validationResult } = require('express-validator');

exports.renderAddResponse = async (req, res) => {
    const questionId = req.params.questionId;

    try {
        const question = await Question.findById(questionId).populate('subGroupID', 'name').populate('userID', 'email');

        if (!question) {
            return res.render('./dashboard/question/questions', { title: 'بانک سوالات' });
        }

        res.render('./dashboard/response/addResponse', { title: `اضافه کردن پاسخ جدید برای سوال ${question._id}`, question });
    } catch (error) {
        console.error(error.message);
    }
};

exports.handleAddResponse = async (req, res) => {
    const { score, description } = req.body;
    const userId = req.session.userId;
    const questionId = req.params.questionId;

    const uploadedFiles = req.files ? req.files.map(file => file.filename) : [];

    const parsedScore = parseInt(score);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const question = await Question.findById(questionId)
            .populate('subGroupID', 'name')
            .populate('userID', 'email');
        return res.render(`./dashboard/response/addResponse`, {
            title: `اضافه کردن پاسخ جدید برای سوال ${questionId}`,
            errors: errors.array(),
            question,
        });
    }

    try {
        const existingResponse = await Response.findOne({ userID: userId, questionID: questionId });

        if (existingResponse) {
            existingResponse.score = parsedScore ?? existingResponse.score;
            existingResponse.description = description || existingResponse.description;

            if (uploadedFiles.length > 0) {
                existingResponse.documents = existingResponse.documents.concat(uploadedFiles);
            }

            if (uploadedFiles.length > 10) {
                req.flash('error', 'شما نمی‌توانید بیش از 10 فایل  به صورت یکجا آپلود کنید');
                return res.redirect('/dashboard/questions');
            }

            if (existingResponse && existingResponse.documents.length > 10) {
                req.flash('error', 'شما نمی‌توانید بیش از 10 فایل برای یک پاسخ آپلود کنید');
                return res.redirect('/dashboard/questions');
            }

            await existingResponse.save();
            req.flash('success', `جواب ${parsedScore} برای سوال ${questionId} با موفقیت بروزرسانی شد`);
            return res.redirect('/dashboard/questions');
        } else {
            const newResponse = new Response({
                userID: userId,
                questionID: questionId,
                score: parsedScore,
                description,
                documents: uploadedFiles,
            });
            await newResponse.save();
            req.flash('success', `جواب ${parsedScore} برای سوال ${questionId} با موفقیت ثبت شد`);
            return res.redirect('/dashboard/questions');
        }
    } catch (error) {
        console.error(error.message);
    }
};
