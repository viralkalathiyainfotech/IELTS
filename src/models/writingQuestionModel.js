import mongoose from "mongoose";

const writingQuestionSchema = mongoose.Schema({
    writingSectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WritingSection",
        required: true
    },
    writing_question_image: {
        type: String
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

export default mongoose.model("writingQuestion", writingQuestionSchema)