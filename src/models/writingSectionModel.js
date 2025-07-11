import mongoose from "mongoose";

const writingSectionSchema = mongoose.Schema({
    writingTestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WritingTest",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    writing_title_image: {
        type: String
    },
    totalTime: { // <-- add this
        type: Number, // in minutes
        default: 0
    }
}, { timestamps: true })

export default mongoose.model("WritingSection", writingSectionSchema)