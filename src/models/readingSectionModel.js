import mongoose from "mongoose";

const readingSectionSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    readingTestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ReadingTest"
    },
    description: {
        type: String
    }
}, { timestamps: true })

export default mongoose.model("ReadingSection", readingSectionSchema) 