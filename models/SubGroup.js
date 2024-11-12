const mongoose = require('mongoose');

const subGroupSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    groupID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: true
    },
    name: {
        type: String,
        require: true,
        unique: true
    }
}, { timestamps: true });

module.exports = mongoose.model("SubGroup", subGroupSchema);