import mongoose from "mongoose";

const privacyPolicySchema = mongoose.Schema({
    title: {
        type: String
    },
    description: {
        type: Array
    }
}, { timestamps: true })

export default mongoose.model("PrivacyPolicy", privacyPolicySchema)