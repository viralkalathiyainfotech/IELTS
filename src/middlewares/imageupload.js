import multer from 'multer';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create different folders based on field name
        let uploadPath = 'public/images';

        if (file.fieldname === 'writing_title_image') {
            uploadPath = 'public/writing_title_image';
        } else if (file.fieldname === 'writing_question_image') {
            uploadPath = 'public/writing_question_image';
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    // Accept files with common image field names
    const allowedFieldNames = ['image', 'writing_title_image','writing_question_image'];

    if (allowedFieldNames.includes(file.fieldname)) {
        cb(null, true);
    } else {
        cb(new Error(`Please upload a file with one of these field names: ${allowedFieldNames.join(', ')}`));
    }
};

// Create multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

// Create upload handlers
const uploadHandlers = {
    single: (fieldName) => {
        return upload.single(fieldName);
    }
};

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
    console.log('Upload error:', err);

    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

const convertJfifToJpeg = async (req, res, next) => {
    try {
        if (!req.file) return next();

        const file = req.file;
        const ext = path.extname(file.originalname).toLowerCase();

        if (ext === '.jfif' || file.mimetype === 'image/jfif' || file.mimetype === 'application/octet-stream') {
            const inputPath = file.path;
            const outputPath = inputPath.replace('.jfif', '.jpg');

            await sharp(inputPath)
                .jpeg()
                .toFile(outputPath);

            // Update the file path in req.file
            file.path = outputPath;
            file.filename = path.basename(outputPath);

            // Delete the original JFIF file
            fs.unlinkSync(inputPath);
        }

        next();
    } catch (err) {
        console.error('Error in convertJfifToJpeg:', err);
        next(err);
    }
};

const readingStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const readingUploadDir = path.join(__dirname, '../../public/uploads/reading/');
        if (!fs.existsSync(readingUploadDir)) {
            fs.mkdirSync(readingUploadDir, { recursive: true });
        }
        cb(null, readingUploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const readingFileFilter = (req, file, cb) => {
    // Accept only audio files
    const allowedTypes = /mp3|wav|m4a/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only audio files are allowed!'), false);
    }
};

const readingUpload = multer({ storage: readingStorage, fileFilter: readingFileFilter });

const listeningAudioStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const listeningUploadDir = path.join(__dirname, '../../public/listeningAudio/');
        if (!fs.existsSync(listeningUploadDir)) {
            fs.mkdirSync(listeningUploadDir, { recursive: true });
        }
        cb(null, listeningUploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const listeningAudioFileFilter = (req, file, cb) => {
    // Accept only audio files
    const allowedTypes = /mp3|wav|m4a/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only audio files are allowed!'), false);
    }
};

const listeningAudioUpload = multer({ storage: listeningAudioStorage, fileFilter: listeningAudioFileFilter });

export { upload, uploadHandlers, handleMulterError, convertJfifToJpeg, readingUpload, listeningAudioUpload };
export default uploadHandlers;
