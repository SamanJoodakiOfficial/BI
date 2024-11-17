const Group = require('../models/Group');
const SubGroup = require('../models/SubGroup');
const Question = require('../models/Question');
const Response = require('../models/Response');


exports.generateReport = async () => {
    const report = await Question.aggregate([
        {
            $lookup: {
                from: 'responses',
                localField: '_id',
                foreignField: 'questionID',
                as: 'responses'
            }
        },
        {
            $lookup: {
                from: 'groups',
                localField: 'groupID',
                foreignField: '_id',
                as: 'group'
            }
        },
        {
            $lookup: {
                from: 'subgroups',
                localField: 'subGroupID',
                foreignField: '_id',
                as: 'subGroup'
            }
        },
        { $unwind: '$group' },
        { $unwind: '$subGroup' },
        {
            $group: {
                _id: {
                    groupName: '$group.name',
                    subGroupName: '$subGroup.name'
                },
                totalQuestions: { $sum: 1 },
                totalYes: {
                    $sum: {
                        $size: {
                            $filter: {
                                input: '$responses',
                                as: 'response',
                                cond: { $gt: ['$$response.score', 0] }
                            }
                        }
                    }
                },
                totalNo: {
                    $sum: {
                        $size: {
                            $filter: {
                                input: '$responses',
                                as: 'response',
                                cond: { $eq: ['$$response.score', 0] }
                            }
                        }
                    }
                },
                yesScores: {
                    $push: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$responses',
                                    as: 'response',
                                    cond: { $gt: ['$$response.score', 0] }
                                }
                            },
                            as: 'response',
                            in: '$$response.score'
                        }
                    }
                }
            }
        }
    ]);

    report.forEach(group => {
        const flattenedYesScores = group.yesScores.flat();
        group.avgYesScore = flattenedYesScores.length
            ? flattenedYesScores.reduce((sum, score) => sum + score, 0) / flattenedYesScores.length
            : null;
    });

    return report;
}; 