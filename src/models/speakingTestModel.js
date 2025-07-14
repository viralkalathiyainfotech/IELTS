import mongoose from "mongoose";

const spekingTestSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
}, { timestamps: true })

export default mongoose.model("SpeakingTest", spekingTestSchema) 