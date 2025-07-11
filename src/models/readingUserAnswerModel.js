import mongoose from "mongoose";

const readingUserAnswerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    readingSectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ReadingSection",
        required: true
    },
    answers: [
        {
            questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
            userAnswer: { type: String, required: true },
            isCorrect: { type: Boolean, required: true },
            correctAnswer: { type: String, required: true }
        }
    ]
}, { timestamps: true });

export default mongoose.model("ReadingUserAnswer", readingUserAnswerSchema);