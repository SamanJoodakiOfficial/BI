const Group = require('../../models/Group');
const SubGroup = require('../../models/SubGroup');
const Question = require('../../models/Question');
const Response = require('../../models/Response');
const User = require('../../models/User');
const { generateReport } = require('../../helpers/helperFunctions');

exports.renderBI = async (req, res) => {
    try {
        const totalGroups = await Group.countDocuments({});
        const totalSubGroups = await SubGroup.countDocuments({});
        const totalQuestions = await Question.countDocuments({});
        const totalResponses = await Response.countDocuments({});
        const totalUsers = await User.countDocuments({});
        let report = await generateReport();

        const statistics = {
            groups: totalGroups,
            subGroups: totalSubGroups,
            questions: totalQuestions,
            responses: totalResponses,
            users: totalUsers
        };

        report = report.sort();

        res.render('./dashboard/bi/bi', { title: 'داشبورد هوش تجاری', report, statistics });
    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/bi');
    }
};