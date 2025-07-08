import mongoose from "mongoose";

const premiumSchema = mongoose.Schema({
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: Array,
    },
    duration: {
        type: String,
        enum: ["15 days", "1 month", "6 month"],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

export default mongoose.model("Premium", premiumSchema)