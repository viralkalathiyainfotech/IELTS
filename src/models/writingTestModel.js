import mongoose from "mongoose";

const writingTestSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
}, { timestamps: true })

export default mongoose.model("WritingTest", writingTestSchema) 