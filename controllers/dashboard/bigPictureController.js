require('dotenv').config();
const { generateBigPicture, getColorForScore, getScoreColorGuide } = require('../../helpers/helperFunctions');

exports.renderBigPicture = async (req, res) => {
    try {
        const report = await generateBigPicture();

        report.forEach(group => {
            group.subGroups.forEach(subGroup => {
                subGroup.color = getColorForScore(subGroup.score);
            });
        });

        const colorGuide = getScoreColorGuide();
        const openaiApiKey = process.env.OPENAI_API_KEY;

        res.render('./dashboard/bigPicture/bigPicture', { title: 'تصویر بزرگ - هوش مصنوعی', report, colorGuide, openaiApiKey });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/bigPicture');
    }
};
