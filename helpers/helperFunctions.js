require('dotenv').config();
const Group = require('../models/Group');
const SubGroup = require('../models/SubGroup');
const Question = require('../models/Question');
const xlsx = require('xlsx');

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

exports.generateBigPicture = async () => {
    const groups = await Group.find();
    const subGroups = await SubGroup.find();

    const questionsWithScores = await Question.aggregate([
        {
            $lookup: {
                from: 'responses',
                localField: '_id',
                foreignField: 'questionID',
                as: 'responses',
            },
        },
        {
            $project: {
                _id: 1,
                groupID: 1,
                subGroupID: 1,
                avgScore: { $avg: '$responses.score' },
            },
        },
    ]);

    return groups.map(group => ({
        groupName: group.name,
        subGroups: subGroups
            .filter(subGroup => subGroup.groupID.toString() === group._id.toString())
            .map(subGroup => {
                const relatedQuestions = questionsWithScores.filter(
                    q => q.subGroupID.toString() === subGroup._id.toString()
                );
                const avgScore =
                    relatedQuestions.length > 0
                        ? relatedQuestions.reduce((sum, q) => sum + (q.avgScore || 0), 0) /
                        relatedQuestions.length
                        : 0;

                return {
                    subGroupName: subGroup.name,
                    score: avgScore,
                };
            }),
    }));
};

exports.getColorForScore = (score) => {
    if (score <= 10) return '#ffcccc'; // قرمز روشن
    if (score <= 20) return '#ff9999';
    if (score <= 30) return '#ff6666';
    if (score <= 40) return '#ff3333';
    if (score <= 50) return '#ff0000';
    if (score <= 60) return '#ccffcc'; // سبز روشن
    if (score <= 70) return '#99ff99';
    if (score <= 80) return '#66ff66';
    if (score <= 90) return '#33ff33';
    if (score <= 100) return '#00ff00';
    return '#ffffff'; // سفید
};

exports.processFile = async (file) => {
    const validFileTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (file.mimetype === validFileTypes[0]) {
        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return xlsx.utils.sheet_to_json(worksheet);
    }

    throw new Error('فرمت فایل پشتیبانی نمی‌شود.');
};

exports.validateData = (fileData, fileName, invalidData) => {
    const validData = [];
    fileData.forEach((entry) => {
        if (entry.groupID && entry.subGroupID && entry.text) {
            validData.push(entry);
        } else {
            invalidData.push({ file: fileName, entry });
        }
    });
    return validData;
};
