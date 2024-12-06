require('dotenv').config();
const { generateBigPicture, getColorForScore } = require('../../helpers/helperFunctions');

exports.renderBigPicture = async (req, res) => {
    try {
        const { colors, numberOfRanges } = req.body;
        const report = await generateBigPicture();

        const colorRanges = colors
            ? colors.split(',')
            : null;

        const rangeCount = numberOfRanges || 5;

        report.forEach(group => {
            group.subGroups.forEach(subGroup => {
                if (colorRanges) {
                    const colorIndex = Math.floor((subGroup.score / 100) * (rangeCount - 1));
                    subGroup.color = colorRanges[colorIndex];
                } else {
                    subGroup.color = getColorForScore(subGroup.score);
                }
            });
        });

        const openaiApiKey = process.env.OPENAI_API_KEY;

        res.render('./dashboard/bigPicture/bigPicture', { title: 'تصویر بزرگ - هوش مصنوعی', report, openaiApiKey });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/bigPicture');
    }
};
