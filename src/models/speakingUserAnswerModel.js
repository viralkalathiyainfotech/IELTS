import mongoose from "mongoose";

const speakingUserAnswerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    speakingTopicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SpeakingTopic",
        required: true
    },
    answers: [
        {
            questionId: { type: mongoose.Schema.Types.ObjectId, ref: "SpeakingQuestion", required: true },
            transcript: { type: String, required: false },
            correctAnswer: { type: String },
            similarityPercentage: { type: Number, required: false },
            isCorrect: { type: Boolean, default: false },
            audioPath: { type: String, required: true }
        }
    ]
}, { timestamps: true });

export default mongoose.model("SpeakingUserAnswer", speakingUserAnswerSchema); 