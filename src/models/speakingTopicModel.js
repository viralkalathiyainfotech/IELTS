import mongoose from "mongoose";

const speakingTopicSchema = mongoose.Schema({
    speakingTestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SpeakingTest",
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    totalTime: { // <-- add this
        type: Number, // in minutes
        default: 0
    }
}, { timestamps: true })

export default mongoose.model("SpeakingTopic", speakingTopicSchema)