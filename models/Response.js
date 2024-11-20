const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    questionID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true
    },
    score: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    description: {
        type: String
    },
    documents: [{
        type: String,
        max: 10
    }]
}, { timestamps: true });

module.exports = mongoose.model("Response", responseSchema);