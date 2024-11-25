const Group = require('../../models/Group');
const Response = require('../../models/Response');
const moment = require('moment-jalaali');

exports.renderReports = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate
            ? moment(startDate, "jYYYY/jMM/jDD").startOf('day').toDate()
            : moment().startOf('month').toDate();

        const end = endDate
            ? moment(endDate, "jYYYY/jMM/jDD").endOf('day').toDate()
            : moment().endOf('day').toDate();

        const reports = await Group.aggregate([
            {
                $lookup: {
                    from: "subgroups",
                    localField: "_id",
                    foreignField: "groupID",
                    as: "subGroups",
                },
            },
            { $unwind: { path: "$subGroups", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "questions",
                    localField: "subGroups._id",
                    foreignField: "subGroupID",
                    as: "questions",
                },
            },
            {
                $lookup: {
                    from: "responses",
                    localField: "questions._id",
                    foreignField: "questionID",
                    as: "responses",
                },
            },
            {
                $addFields: {
                    questionsCount: { $size: "$questions" },
                    responsesYes: {
                        $size: {
                            $filter: {
                                input: "$responses",
                                as: "response",
                                cond: { $gte: ["$$response.score", 1] },
                            },
                        },
                    },
                    responsesNo: {
                        $size: {
                            $filter: {
                                input: "$responses",
                                as: "response",
                                cond: { $eq: ["$$response.score", 0] },
                            },
                        },
                    },
                    yesAverage: {
                        $cond: {
                            if: { $gt: [{ $size: "$responses" }, 0] },
                            then: { $avg: "$responses.score" },
                            else: 0,
                        },
                    },
                },
            },
            {
                $match: {
                    "questions.createdAt": { $gte: start, $lte: end },
                },
            },
            {
                $project: {
                    _id: 0,
                    groupName: "$name",
                    subGroupName: "$subGroups.name",
                    questionsCount: 1,
                    responsesYes: 1,
                    responsesNo: 1,
                    yesAverage: 1,
                },
            },
        ]);

        const monthlyComparison = await Response.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                },
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalYes: {
                        $sum: {
                            $cond: [{ $gte: ["$score", 1] }, 1, 0],
                        },
                    },
                    totalNo: {
                        $sum: {
                            $cond: [{ $eq: ["$score", 0] }, 1, 0],
                        },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const persianMonths = [
            "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
            "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
        ];

        const monthlyData = monthlyComparison.map((item) => {
            const monthIndex = moment().month(item._id - 1).jMonth();
            return {
                month: persianMonths[monthIndex],
                totalYes: item.totalYes || 0,
                totalNo: item.totalNo || 0,
            };
        });

        const formattedStartDate = moment(start).format("jYYYY/jMM/jDD");
        const formattedEndDate = moment(end).format("jYYYY/jMM/jDD");

        res.render("./dashboard/report/reports", {
            title: 'گزارشات',
            reports,
            monthlyComparison: monthlyData,
            startDate: startDate || formattedStartDate,
            endDate: endDate || formattedEndDate,
        });

    } catch (error) {
        console.error(error.message);
        res.redirect('/dashboard/reports');
    }
};
