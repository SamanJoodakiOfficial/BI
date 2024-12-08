const { validationResult } = require('express-validator');

const Question = require('../../models/Question');
const Response = require('../../models/Response');

exports.renderAddResponse = async (req, res) => {
    const questionId = req.params.questionId;

    try {
        const question = await Question.findById(questionId).populate('subGroupID', 'name').populate('userID', 'email');

        if (!question) {
            req.flash('error', 'سوال موردنظر یافت نشد. لطفاً دوباره تلاش کنید!');
            return res.render('./dashboard/question/questions', { title: 'بانک سوالات' });
        }

        res.render('./dashboard/response/addResponse', {
            title: `اضافه کردن پاسخ جدید برای سوال شماره ${question._id}`,
            question,
        });
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'خطایی در بارگذاری سوال رخ داد. لطفاً بعداً دوباره تلاش کنید.');
        res.redirect('/dashboard/questions');
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
        req.flash('error', 'لطفاً تمامی فیلدها را به درستی تکمیل کنید.');
        return res.render(`./dashboard/response/addResponse`, {
            title: `اضافه کردن پاسخ جدید برای سوال شماره ${questionId}`,
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
                req.flash('error', 'تعداد فایل‌های انتخابی بیش از حد مجاز است (حداکثر 10 فایل).');
                return res.redirect(`/dashboard/response/add/${questionId}`);
            }

            if (existingResponse && existingResponse.documents.length > 10) {
                req.flash('error', 'مجموع تعداد فایل‌های آپلودی برای این پاسخ بیش از حد مجاز است (حداکثر 10 فایل).');
                return res.redirect(`/dashboard/response/add/${questionId}`);
            }

            await existingResponse.save();
            req.flash('success', `پاسخ شما با نمره ${parsedScore} با موفقیت به‌روزرسانی شد!`);
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
            req.flash('success', `پاسخ جدید با نمره ${parsedScore} برای سوال شماره ${questionId} ثبت شد!`);
            return res.redirect('/dashboard/questions');
        }
    } catch (error) {
        console.error(error.message);
        req.flash('error', 'خطایی در ذخیره پاسخ رخ داد. لطفاً بعداً دوباره تلاش کنید.');
        res.redirect('/dashboard/questions');
    }
};