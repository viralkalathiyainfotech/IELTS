import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    readingSectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ReadingSection",
        required: true
    },
    questionText: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["mcq", "true-false", "fill-blank"],
        required: true
    },
    options: [String], // Only for MCQ
    answer: {
        type: String,
        required: true
    },
    position: Number
}, { timestamps: true });

export default mongoose.model("Question", questionSchema); 