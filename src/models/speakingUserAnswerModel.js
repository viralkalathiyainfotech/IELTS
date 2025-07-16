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
            audioPath: { type: String, required: true },
            transcript: { type: String, required: true },
            similarityScore: { type: Number, required: true }
        }
    ]
}, { timestamps: true });

export default mongoose.model("SpeakingUserAnswer", speakingUserAnswerSchema); 