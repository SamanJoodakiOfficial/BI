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

        res.render('./dashboard/bigPicture/bigPicture', { title: 'تصویر بزرگ - هوش مصنوعی', report, colorGuide });
    } catch (error) {
        console.error(error);
        res.redirect('/dashboard/bigPicture');
    }
};