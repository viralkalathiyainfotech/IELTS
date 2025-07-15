import mongoose from "mongoose";

const listeningUserAnswerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    listeningSectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "listeningSection",
        required: true
    },
    answers: [
        {
            questionId: { type: mongoose.Schema.Types.ObjectId, ref: "listeningQuestion", required: true },
            userAnswer: { type: String, required: true },
            isCorrect: { type: Boolean, required: true },
            correctAnswer: { type: Array, required: true }
        }
    ]
}, { timestamps: true });

export default mongoose.model("ListeningUserAnswer", listeningUserAnswerSchema);