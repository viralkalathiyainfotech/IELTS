import mongoose from "mongoose";

const listeningaudioSchema = mongoose.Schema({
    listeningAudio: {
        type: String,
        required: true
    },
    listeningSectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ListeningSection",
        required: true
    }
}, { timestamps: true })

export default mongoose.model("ListeningAudio", listeningaudioSchema)