require('dotenv').config();
const { generateBigPicture, getColorForScore } = require('../../helpers/helperFunctions');

exports.renderBigPicture = async (req, res) => {
    try {
        const { colors, numberOfRanges } = req.body;
        const report = await generateBigPicture();

        const colorRanges = colors ? colors.split(',') : null;
        const rangeCount = numberOfRanges || 2;

        if (colorRanges && colorRanges.length != rangeCount) {
            req.flash('error', `تعداد طیف‌ها ${rangeCount} مطابقت با تعداد کد‌های رنگ ها ندارد ${colorRanges}.`);
            return res.redirect('/dashboard/bigPicture');
        }

        report.forEach(group => {
            group.subGroups.forEach(subGroup => {
                if (colorRanges) {
                    const rangeSize = 100 / rangeCount;
                    const colorIndex = Math.floor(subGroup.score / rangeSize);
                    subGroup.color = colorRanges[Math.min(colorIndex, rangeCount - 1)];
                } else {
                    subGroup.color = getColorForScore(subGroup.score);
                }
            });
        });

        const openaiApiKey = process.env.OPENAI_API_KEY;

        res.render('./dashboard/bigPicture/bigPicture', { title: 'تصویر بزرگ - هوش مصنوعی', report, openaiApiKey });
    } catch (error) {
        console.error(error.message);
        res.status(400).send({ error: error.message }); // ارسال خطا به کاربر
    }
};
