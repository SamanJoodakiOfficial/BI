const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    groupID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },
    subGroupID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubGroup",
        required: true
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    text: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);