const Question = require('../../models/Question');
const Response = require('../../models/Response');
const { validationResult } = require('express-validator');

exports.renderResponses = async (req, res) => {
    try {
        const responses = await Response.find({})
            .populate('userID', 'email')
            .populate({
                path: 'questionID',
                populate: [
                    { path: 'groupID', select: 'name' },
                    { path: 'subGroupID', select: 'name' },
                    { path: 'userID', select: 'email' }
                ]
            });

        let text = '';
        if (responses.length <= 0) {
            text = 'پاسخی یافت نشد';
        }

        res.render('./dashboard/response/responses', { title: 'مدیریت پاسخ‌ها', responses, text });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/responses');
    }
};

exports.renderUpdateResponse = async (req, res) => {
    const responseId = req.params.responseId;
    try {
        const response = await Response.findById(responseId)
            .populate('userID', 'email')
            .populate({
                path: 'questionID',
                populate: [
                    { path: 'groupID', select: 'name' },
                    { path: 'subGroupID', select: 'name' },
                    { path: 'userID', select: 'email' }
                ]
            });

        if (!response) {
            return res.render('./dashboard/response/responses', { title: 'مدیریت پاسخ‌ها' });
        }

        res.render('./dashboard/response/updateResponse', { title: 'ویرایش پاسخ', response });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/responses');
    }
};

exports.handleUpdateResponse = async (req, res) => {
    const { score, description, file } = req.body;
    const userId = req.session.userId;
    const responseId = req.params.responseId;

    const parsedScore = parseInt(score);

    try {
        const response = await Response.findById(responseId)
            .populate('userID', 'email')
            .populate({
                path: 'questionID',
                populate: [
                    { path: 'groupID', select: 'name' },
                    { path: 'subGroupID', select: 'name' },
                    { path: 'userID', select: 'email' }
                ]
            });
        if (!response) {
            req.flash('error', 'پاسخی با این شناسه یافت نشد');
            return res.redirect('/dashboard/responses');
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('./dashboard/response/updateResponse', {
                title: `اضافه کردن پاسخ جدید برای سوال ${response.questionID._id}`,
                errors: errors.array(),
                question: response.questionID,
                response
            });
        }

        const updatedDocuments = file ? [file] : response.documents;

        const updatedResponse = await Response.findByIdAndUpdate(
            responseId,
            {
                userID: userId,
                questionID: response.questionID,
                score: parsedScore,
                description,
                documents: updatedDocuments
            },
            { new: true }
        );

        if (!updatedResponse) {
            req.flash('error', 'ویرایش پاسخ با شکست مواجه شد');
            return res.redirect('/dashboard/responses');
        }

        req.flash('success', `پاسخ با شناسه ${updatedResponse._id} با موفقیت ویرایش شد.`);
        res.redirect('/dashboard/responses');
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'خطای سرور رخ داد.');
        res.redirect('/dashboard/questions');
    }
};

exports.renderAddResponseByAdmin = async (req, res) => {
    res.render('./dashboard/response/addResponseByAdmin', { title: 'اضافه کردن پاسخ توسط ادمین' });
};

exports.handleDeleteResponse = async (req, res) => {
    const responseId = req.params.responseId;

    try {
        const deletedResponse = await Response.findByIdAndDelete(responseId);

        if (!deletedResponse) {
            return res.render('./dashboard/response/responses', { title: 'مدیریت پاسخ‌ها' });
        }

        req.flash('success', `پاسخ با شناسه ${deletedResponse._id} با موفقیت حذف شد`);
        res.redirect('/dashboard/responses');
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/responses');
    }
};