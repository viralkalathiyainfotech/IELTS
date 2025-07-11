import mongoose from "mongoose";

const listeningTestSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    total_question: {
        type: Number
    }
}, { timestamps: true })

export default mongoose.model("ListeningTest", listeningTestSchema) 