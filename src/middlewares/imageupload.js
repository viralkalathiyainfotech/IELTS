import multer from "multer";
import path from "path";
import sharp from "sharp";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

// 🔹 AWS S3 Client (v3)
const s3Client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: String(process.env.S3_ACCESS_KEY).trim(),
        secretAccessKey: String(process.env.S3_SECRET_KEY).trim(),
    },
});

// 🔹 Folder Mapping in S3
export const getS3Folder = (fieldname) => {
    switch (fieldname) {
        case "image": return "images";
        case "writing_title_image": return "writing_title_images";
        case "writing_question_image": return "writing_question_images";
        case "listening_audio": return "listening_audios";
        case "speaking_audio": return "speaking_audios";
        default: return "others";
    }
};

// 🔹 Multer Storage (memory storage for buffer)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const isImage = file.mimetype.startsWith("image/");
        const isAudio = file.mimetype.startsWith("audio/");
        const isOctet = file.mimetype === "application/octet-stream";
        const ext = path.extname(file.originalname).toLowerCase();

        const imageFields = ["image", "writing_title_image", "writing_question_image"];
        const audioFields = ["listening_audio", "speaking_audio"];

        if (imageFields.includes(file.fieldname)) {
            return (isImage || isOctet || ext === ".jfif") ? cb(null, true) : cb(new Error("Invalid image file"));
        }
        if (audioFields.includes(file.fieldname)) {
            return isAudio ? cb(null, true) : cb(new Error("Invalid audio file"));
        }
        return cb(new Error(`Invalid field name: ${file.fieldname}`));
    },
});

// 🔹 Convert JFIF / unsupported formats to JPEG
export const convertJfifToJpeg = async (req, res, next) => {
    if (!req.file) return next();

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext === ".jfif") {
        try {
            const buffer = await sharp(req.file.buffer).jpeg().toBuffer();
            req.file.buffer = buffer;
            req.file.originalname = req.file.originalname.replace(/\.jfif$/i, ".jpg");
        } catch (err) {
            console.warn("JFIF conversion failed, using original buffer:", err.message);
        }
    }
    next();
};

// 🔹 Upload buffer to S3 (v3)
export const uploadToS3 = async (buffer, filename, folder, mimetype = "application/octet-stream") => {
    const Key = `${folder}/${Date.now()}_${filename}`;
    await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key,
        Body: buffer,
        ContentType: mimetype,
    }));
    return {
        Location: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${Key}`,
    };
};

// 🔹 Delete file from S3 (v3)
export const deleteFromS3 = async (fileUrl) => {
    const key = fileUrl.split(".amazonaws.com/")[1];
    if (!key) return;
    await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
    }));
};

// 🔹 Export multer fields
export const uploadMedia = upload.fields([
    { name: "image", maxCount: 1 },
    { name: "writing_title_image", maxCount: 1 },
    { name: "writing_question_image", maxCount: 1 },
    { name: "listening_audio", maxCount: 1 },
    { name: "speaking_audio", maxCount: 1 },
]);

export default upload;
