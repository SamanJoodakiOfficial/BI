const PersianDate = require('persian-date');
const jalaali = require('jalaali-js');
const moment = require('moment-timezone');
moment.tz.setDefault("Asia/Tehran");
const Group = require('../../models/Group');
const Response = require('../../models/Response');

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
            {
                $unwind: {
                    path: "$subGroups",
                    preserveNullAndEmptyArrays: true
                }
            },
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
                $lookup: {
                    from: "questions",
                    localField: "questionID",
                    foreignField: "_id",
                    as: "questions",
                },
            },
            {
                $unwind: {
                    path: "$questions",
                    preserveNullAndEmptyArrays: true,
                }
            },
            {
                $lookup: {
                    from: "subgroups",
                    localField: "questions.subGroupID",
                    foreignField: "_id",
                    as: "subgroups",
                }
            },
            {
                $unwind: {
                    path: "$subgroups",
                    preserveNullAndEmptyArrays: true,
                }
            },
            {
                $lookup: {
                    from: "groups",
                    localField: "subgroups.groupID",
                    foreignField: "_id",
                    as: "groups",
                }
            },
            {
                $unwind: {
                    path: "$groups",
                    preserveNullAndEmptyArrays: true,
                }
            },
            {
                $group: {
                    _id: {
                        groupId: "$groups._id",
                        groupName: "$groups.name",
                        subGroupId: "$subgroups._id",
                        subGroupName: "$subgroups.name",
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" },
                    },
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
                    averageYesScore: {
                        $avg: "$score",
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    groupId: "$_id.groupId",
                    groupName: "$_id.groupName",
                    subGroupId: "$_id.subGroupId",
                    subGroupName: "$_id.subGroupName",
                    year: "$_id.year",
                    month: "$_id.month",
                    totalYes: 1,
                    totalNo: 1,
                    averageYesScore: 1,
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);

        const persianMonths = [
            "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
            "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
        ];

        const monthlyData = monthlyComparison.map((item) => {
            const currentYear = item._id.year;
            const currentMonth = item._id.month;

            const { jy: persianYear, jm: persianMonth } = jalaali.toJalaali(currentYear, currentMonth, 1);

            return {
                year: persianYear,
                month: persianMonths[persianMonth] || "ماه نامشخص",
                groupName: item._id.groupName,
                subGroupName: item._id.subGroupName,
                totalYes: item.totalYes || 0,
                totalNo: item.totalNo || 0,
                averageYesScore: item.averageYesScore || 0,
            };
        });

        const formattedStartDate = new PersianDate(start).format("YYYY/MM/DD");
        const formattedEndDate = new PersianDate(end).format("YYYY/MM/DD");

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
