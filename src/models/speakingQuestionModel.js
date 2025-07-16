import mongoose from "mongoose";

const speakingQuestionSchema = mongoose.Schema({
    speakingTopicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SpeakingSection",
        required: true
    },
    questionText: {
        type: String,
        required: true
    },
    answer: {
        type: Array,
        required: true
    },
    position: Number,
    timePerQuestion: {
        type: Number,
        required: true
    }
}, { timestamps: true })

export default mongoose.model("SpeakingQuestion", speakingQuestionSchema)