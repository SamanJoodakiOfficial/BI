const mongoose = require('mongoose');
const Question = require('../../models/Question');
const Response = require('../../models/Response');
const { validationResult } = require('express-validator');

exports.renderResponses = async (req, res) => {
    try {
        const query = parseFloat(req.query.responseScore);
        const page = parseFloat(req.query.page) || 1;
        const limit = parseFloat(req.query.limit) || 10;

        let responses;
        let totalResponses;

        if (query) {
            responses = await Response.find({ score: query })
                .populate('userID', 'email')
                .populate({
                    path: 'questionID',
                    populate: [
                        { path: 'groupID', select: 'name' },
                        { path: 'subGroupID', select: 'name' },
                        { path: 'userID', select: 'email' }
                    ]
                })
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec();
            totalResponses = await Response.countDocuments({ score: query });
        } else {
            responses = await Response.find({})
                .populate('userID', 'email')
                .populate({
                    path: 'questionID',
                    populate: [
                        { path: 'groupID', select: 'name' },
                        { path: 'subGroupID', select: 'name' },
                        { path: 'userID', select: 'email' }
                    ]
                })
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec();
            totalResponses = await Response.countDocuments({});
        }

        let text = '';
        if (responses.length <= 0) {
            text = 'پاسخی یافت نشد';
        }

        const totalPages = Math.ceil(totalResponses / limit);

        res.render('./dashboard/response/responses', { title: 'مدیریت پاسخ‌ها', responses, text, currentPage: page, query, limit, totalPages, totalResponses });
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
    const { score, description } = req.body;
    const userId = req.session.userId;
    const responseId = req.params.responseId;

    const uploadedFiles = req.files ? req.files.map(file => file.filename) : [];
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
                title: `ویرایش پاسخ برای سوال ${response.questionID._id}`,
                errors: errors.array(),
                question: response.questionID,
                response,
            });
        }

        if (uploadedFiles.length > 10) {
            req.flash('error', 'شما نمی‌توانید بیش از 10 فایل به صورت یکجا آپلود کنید');
            return res.redirect(`/dashboard/responses/updateResponse/${responseId}`);
        }

        const updatedDocuments = [...response.documents, ...uploadedFiles];

        if (updatedDocuments.length > 10) {
            req.flash('error', 'شما نمی‌توانید بیش از 10 فایل برای یک پاسخ آپلود کنید');
            return res.redirect(`/dashboard/responses/updateResponse/${responseId}`);
        }

        const updatedResponse = await Response.findByIdAndUpdate(
            responseId,
            {
                userID: userId,
                questionID: response.questionID._id,
                score: parsedScore,
                description,
                documents: updatedDocuments,
            },
            { new: true }
        );

        if (!updatedResponse) {
            req.flash('error', 'ویرایش پاسخ با شکست مواجه شد');
            return res.redirect('/dashboard/responses');
        }

        req.flash('success', `پاسخ ${parsedScore} با شناسه ${updatedResponse._id} با موفقیت ویرایش شد.`);
        res.redirect('/dashboard/responses');
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'خطای سرور رخ داد.');
        res.redirect('/dashboard/responses');
    }
};

exports.renderAddResponseByAdmin = async (req, res) => {
    res.render('./dashboard/response/addResponseByAdmin', { title: 'اضافه کردن پاسخ توسط ادمین' });
};

exports.handleAddResponseByAdmin = async (req, res) => {
    const { questionId, score, description } = req.body;
    const userId = req.session.userId;

    const uploadedFiles = req.files ? req.files.map(file => file.filename) : [];
    const parsedScore = parseInt(score);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render(`./dashboard/response/addResponseByAdmin`, {
            title: `اضافه کردن پاسخ جدید برای سوال ${questionId}`,
            errors: errors.array(),
        });
    }

    try {
        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            return res.render(`./dashboard/response/addResponseByAdmin`, {
                title: `اضافه کردن پاسخ جدید برای سوال ${questionId}`,
                errors: [{ msg: `شناسه سوال ${questionId} نامعتبر است` }],
            });
        }

        const newResponse = new Response({
            userID: userId,
            questionID: questionId,
            score: parsedScore,
            description,
            documents: uploadedFiles,
        });

        await newResponse.save();

        req.flash('success', `جواب ${score} برای سوال ${questionId} با موفقیت ثبت شد`);
        res.redirect('/dashboard/responses');
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'خطایی در ثبت پاسخ رخ داد.');
        res.redirect('/dashboard/responses');
    }
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