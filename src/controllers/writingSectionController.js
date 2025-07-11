import mongoose from "mongoose";
import { ThrowError } from "../utils/ErrorUtils.js";
import WritingSection from "../models/writingSectionModel.js";
import WritingTest from "../models/writingTestModel.js"
import fs from 'fs';
import path from "path";
import { sendBadRequestResponse, sendCreatedResponse, sendErrorResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";


export const addWritingSection = async (req, res) => {
    try {
        const { writingTestId, title } = req.body

        if (!writingTestId || !title) {
            if (req.file) fs.unlinkSync(path.resolve(req.file.path))
            return sendBadRequestResponse(res, "title and writingTest Id are required")
        }

        if (!mongoose.Types.ObjectId.isValid(writingTestId)) {
            if (req.file) fs.unlinkSync(path.resolve(req.file.path));
            return sendBadRequestResponse(res, "Invalid writingTestId ID");
        }

        const writingTest = await WritingTest.findById(writingTestId);
        if (!writingTest) {
            if (req.file) fs.unlinkSync(path.resolve(req.file.path));
            return sendErrorResponse(res, 404, "WritingTest not found");
        }

        const existingWritingSection = await WritingSection.findOne({ title, writingTestId });
        if (existingWritingSection) {
            if (req.file) {
                try {
                    fs.unlinkSync(path.resolve(req.file.path));
                } catch (err) {
                    console.error("Failed to delete uploaded file:", req.file.path, err);
                }
            }
            return sendBadRequestResponse(res, "This title is already assigned to this test");
        }

        let writing_title_image = null;
        if (req.file) {
            writing_title_image = `/public/writing_title_image/${path.basename(req.file.path)}`;
        }

        const newWritingSection = await WritingSection.create({
            title,
            writingTestId,
            writing_title_image
        });

        return sendCreatedResponse(res, "WritingSection added successfully", newWritingSection);

    } catch (error) {
        if (req.file) fs.unlinkSync(path.resolve(req.file.path));
        return ThrowError(res, 500, error.message)
    }
}

// Get all WritingSection
export const getAllWritingSection = async (req, res) => {
    try {
        const writingSection = await WritingSection.find().populate('writingTestId').sort({ createdAt: -1 });
        // const writingSection = await WritingSection.find().populate('WritingTestId', 'title').sort({ createdAt: -1 });

        if (!writingSection || writingSection.length === 0) {
            return sendSuccessResponse(res, "No writingSection found", []);
        }

        return sendSuccessResponse(res, "WritingSection fetched successfully", writingSection);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get writingSection by ID
export const getWritingSectionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid WritingSection ID");
        }

        const writingSection = await WritingSection.findById(id).populate('writingTestId', 'title');
        if (!writingSection) {
            return sendErrorResponse(res, 404, "WritingSection not found");
        }

        return sendSuccessResponse(res, "WritingSection retrieved successfully", writingSection);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Update writingSection (Admin only)
export const updateWritingSection = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, writingTestId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            if (req.file) fs.unlinkSync(path.resolve(req.file.path));
            return sendBadRequestResponse(res, "Invalid WritingSection ID");
        }

        const existingWritingSection = await WritingSection.findById(id);
        if (!existingWritingSection) {
            if (req.file) fs.unlinkSync(path.resolve(req.file.path));
            return sendErrorResponse(res, 404, "WritingSection not found");
        }

        if (writingTestId) {
            if (!mongoose.Types.ObjectId.isValid(writingTestId)) {
                if (req.file) fs.unlinkSync(path.resolve(req.file.path));
                return sendBadRequestResponse(res, "Invalid WritingTest ID format");
            }
            const writingTest = await WritingTest.findById(writingTestId);
            if (!writingTest) {
                if (req.file) fs.unlinkSync(path.resolve(req.file.path));
                return sendErrorResponse(res, 404, "WritingTest not found");
            }
            existingWritingSection.writingTestId = writingTestId;
        }

        if (req.file) {
            const newImagePath = `/public/writing_title_image/${path.basename(req.file.path)}`;
            if (existingWritingSection.writing_title_image) {
                const oldImagePath = path.join(process.cwd(), existingWritingSection.writing_title_image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            existingWritingSection.writing_title_image = newImagePath;
        }

        if (title) existingWritingSection.title = title;

        await existingWritingSection.save();

        return sendSuccessResponse(res, "WritingSection updated successfully", existingWritingSection);
    } catch (error) {
        if (req.file) fs.unlinkSync(path.resolve(req.file.path));
        return ThrowError(res, 500, error.message);
    }
};

// Delete WritingSection (Admin only)
export const deleteWritingSection = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid WritingSection ID");
        }

        const writingSection = await WritingSection.findByIdAndDelete(id);
        if (!writingSection) {
            return sendErrorResponse(res, 404, "WritingSection not found");
        }

        if (writingSection.writing_title_image) {
            const imagePath = path.join(process.cwd(), writingSection.writing_title_image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        return sendSuccessResponse(res, "WritingSection deleted successfully");
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

