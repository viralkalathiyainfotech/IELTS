import mongoose from "mongoose";

const listeningSectionSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    listeningTestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ListeningTest"
    },
    description: {
        type: String
    }
}, { timestamps: true })

export default mongoose.model("ListeningSection", listeningSectionSchema) 