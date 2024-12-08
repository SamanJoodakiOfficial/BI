const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const Question = require('../../models/Question');
const Response = require('../../models/Response');

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
            text = 'هیچ پاسخی برای نمایش موجود نیست. لطفاً تلاش کنید که پاسخ‌های بیشتری ثبت کنید!';
        }

        const totalPages = Math.ceil(totalResponses / limit);

        res.render('./dashboard/response/responses', { title: 'مدیریت پاسخ‌ها', responses, text, currentPage: page, query, limit, totalPages, totalResponses });
    } catch (error) {
        console.error(error.message);
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

        if (!response || !response.questionID) {
            req.flash('error', `پاسخ با شناسه ${responseId} پیدا نشد یا این پاسخ مربوط به سوال خاصی نیست.`);
            return res.redirect('/dashboard/responses');
        }

        res.render('./dashboard/response/updateResponse', { title: 'ویرایش پاسخ', response });
    } catch (error) {
        console.error(error.message);
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
            req.flash('error', 'پاسخی با این شناسه یافت نشد. لطفاً دوباره امتحان کنید!');
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
            req.flash('error', 'شما نمی‌توانید بیش از 10 فایل به صورت همزمان آپلود کنید.');
            return res.redirect(`/dashboard/responses/edit/${responseId}`);
        }

        const updatedDocuments = [...response.documents, ...uploadedFiles];

        if (updatedDocuments.length > 10) {
            req.flash('error', 'حداکثر تعداد فایل‌ها برای یک پاسخ 10 فایل است. لطفاً فایل‌های اضافی را حذف کنید.');
            return res.redirect(`/dashboard/responses/edit/${responseId}`);
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
            req.flash('error', 'ویرایش پاسخ با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
            return res.redirect('/dashboard/responses');
        }

        req.flash('success', `پاسخ با شناسه ${updatedResponse._id} با موفقیت ویرایش شد. امتیاز جدید: ${parsedScore}`);
        res.redirect('/dashboard/responses');
    } catch (error) {
        console.error(error.message);
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
                errors: [{ msg: `شناسه سوال ${questionId} معتبر نمی‌باشد. لطفاً شناسه صحیح را وارد کنید.` }],
            });
        }

        const existingResponse = await Question.findById(questionId);

        if (!existingResponse) {
            req.flash('error', `سوالی با شناسه ${questionId} پیدا نشد. لطفاً شناسه صحیح را وارد کنید.`);
            return res.redirect('/dashboard/responses/addResponseByAdmin');
        }

        const newResponse = new Response({
            userID: userId,
            questionID: questionId,
            score: parsedScore,
            description,
            documents: uploadedFiles,
        });

        await newResponse.save();

        req.flash('success', `پاسخ جدید برای سوال ${questionId} با امتیاز ${score} با موفقیت ثبت شد.`);
        res.redirect('/dashboard/responses');
    } catch (error) {
        console.error(error.message);
    }
};

exports.handleDeleteResponse = async (req, res) => {
    const responseId = req.params.responseId;

    try {
        const deletedResponse = await Response.findByIdAndDelete(responseId);

        if (!deletedResponse) {
            return res.render('./dashboard/response/responses', { title: 'مدیریت پاسخ‌ها' });
        }

        req.flash('success', `پاسخ با شناسه ${deletedResponse._id} با موفقیت حذف شد. این پاسخ دیگر در دسترس نخواهد بود.`);
        res.redirect('/dashboard/responses');
    } catch (error) {
        console.error(error.message);
    }
};