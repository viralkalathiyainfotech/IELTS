import mongoose from "mongoose";

const writingUserAnswerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    writingSectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WritingSection",
        required: true
    },
    answers: [
        {
            questionId: { type: mongoose.Schema.Types.ObjectId, ref: "writingQuestion", required: true },
            userAnswer: { type: String, required: true },
            isCorrect: { type: Boolean, required: true },
            correctAnswer: { type: Array, required: true }
        }
    ]
}, { timestamps: true });

export default mongoose.model("WritingUserAnswer", writingUserAnswerSchema);