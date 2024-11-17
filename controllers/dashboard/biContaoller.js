const { generateReport } = require('../../helpers/helperFunctions');

exports.renderBI = async (req, res) => {
    try {

        const report = await generateReport();

        console.log(report);
        res.render('./dashboard/bi/bi', { title: 'داشبورد هوش تجاری', report });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/bi/bi');
    }
};