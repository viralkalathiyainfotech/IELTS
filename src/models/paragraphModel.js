import mongoose from "mongoose";

const paragraphSchema = mongoose.Schema({
    readingSectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ReadingSection"
    },
    heading: {
        type: String
    },
    description: {
        type: String
    },
    paragraph: {
        type: Array
    },
    position: {
        type: Number
    }
}, { timestamps: true })

export default mongoose.model("Paragraph", paragraphSchema)