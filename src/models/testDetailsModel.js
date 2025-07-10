import mongoose from "mongoose";

const testDetailsSchema = mongoose.Schema({
    module_type: {
        type: String,
        enum: ["Reading", "Listening", "Speaking", "Writing"]
    },
    description: {
        type: String
    },
    title: {
        type: String
    },
    rules: {
        type: [String]
    }
}, { timestamps: true })

export default mongoose.model("TestDetails", testDetailsSchema) 