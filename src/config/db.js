
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async () =>{
    try {
        await mongoose.connect(process.env.MONGO_DB_URL || "mongodb+srv://darshan1kalathiyainfotech:IELTS%40123@ielts.ddd5mmh.mongodb.net/");
        console.log("DB Is Connected...");
    } catch (error) {
        console.error("DB Is Not Connected...",error);
        process.exit(1);
    }
};

