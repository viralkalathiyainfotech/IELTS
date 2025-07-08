import mongoose from "mongoose";


const aboutSchema = mongoose.Schema({
    title: {
        type: String
    },
    description: {
        type: Array
    },
}, { timestamps: true })

export default mongoose.model("About", aboutSchema)