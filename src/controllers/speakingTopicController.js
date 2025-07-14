import mongoose from "mongoose";
import { ThrowError } from "../utils/ErrorUtils.js";
import SpeakingTopic from "../models/speakingTopicModel.js";
import SpeakingTest from "../models/speakingTestModel.js"
import fs from 'fs';
import path from "path";
import { sendBadRequestResponse, sendCreatedResponse, sendErrorResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";


export const addSpeakingTopic = async (req, res) => {
    try {
        const { speakingTestId, topic } = req.body

        if (!speakingTestId || !topic) {
            if (req.file) fs.unlinkSync(path.resolve(req.file.path))
            return sendBadRequestResponse(res, "topic and writingTest Id are required")
        }

        if (!mongoose.Types.ObjectId.isValid(speakingTestId)) {
            if (req.file) fs.unlinkSync(path.resolve(req.file.path));
            return sendBadRequestResponse(res, "Invalid speakingTestId ID");
        }

        const speakingTest = await SpeakingTest.findById(speakingTestId);
        if (!speakingTest) {
            if (req.file) fs.unlinkSync(path.resolve(req.file.path));
            return sendErrorResponse(res, 404, "SpeakingTest not found");
        }

        const existingSpekingTopic = await SpeakingTopic.findOne({ topic, speakingTestId });
        if (existingSpekingTopic) {
            if (req.file) {
                try {
                    fs.unlinkSync(path.resolve(req.file.path));
                } catch (err) {
                    console.error("Failed to delete uploaded file:", req.file.path, err);
                }
            }
            return sendBadRequestResponse(res, "This topic is already assigned to this test");
        }

        const newSpeakingTopic = await SpeakingTopic.create({
            topic,
            speakingTestId,
        });

        return sendCreatedResponse(res, "WritingSection added successfully", newSpeakingTopic);

    } catch (error) {
        if (req.file) fs.unlinkSync(path.resolve(req.file.path));
        return ThrowError(res, 500, error.message)
    }
}

// Get all SpeakingTopic
export const getAllSpeakingTopic = async (req, res) => {
    try {
        const speakingTopic = await SpeakingTopic.find().populate('speakingTestId').sort({ createdAt: -1 });
        // const speakingTopic = await SpeakingTopic.find().populate('speakingTestId', 'topic').sort({ createdAt: -1 });

        if (!speakingTopic || speakingTopic.length === 0) {
            return sendSuccessResponse(res, "No speakingTopic found", []);
        }

        return sendSuccessResponse(res, "SpeakingTopic fetched successfully", speakingTopic);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get SpeakingTopic by ID
export const getSpeakingTopicById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid SpeakingTopic ID");
        }

        const speakingTopic = await SpeakingTopic.findById(id).populate('speakingTestId', 'topic');
        if (!speakingTopic) {
            return sendErrorResponse(res, 404, "SpeakingTopic not found");
        }

        return sendSuccessResponse(res, "SpeakingTopic retrieved successfully", speakingTopic);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Update SpeakingTopic (Admin only)
export const updateSpeakingTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const { topic, speakingTestId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            if (req.file) fs.unlinkSync(path.resolve(req.file.path));
            return sendBadRequestResponse(res, "Invalid SpeakingTopic ID");
        }

        const existingSpeakingTopic = await SpeakingTopic.findById(id);
        if (!existingSpeakingTopic) {
            if (req.file) fs.unlinkSync(path.resolve(req.file.path));
            return sendErrorResponse(res, 404, "SpeakingTopic not found");
        }

        if (speakingTestId) {
            if (!mongoose.Types.ObjectId.isValid(speakingTestId)) {
                return sendBadRequestResponse(res, "Invalid WritingTest ID format");
            }
            const speakingTest = await SpeakingTest.findById(speakingTestId);
            if (!speakingTest) {
                return sendErrorResponse(res, 404, "SpeakingTest not found");
            }
            existingSpeakingTopic.speakingTestId = speakingTestId;
        }

        if (topic) existingSpeakingTopic.topic = topic;

        await existingSpeakingTopic.save();

        return sendSuccessResponse(res, "SpeakingTopic updated successfully", existingSpeakingTopic);
    } catch (error) {
        if (req.file) fs.unlinkSync(path.resolve(req.file.path));
        return ThrowError(res, 500, error.message);
    }
};

// Delete SpeakingTopic (Admin only)
export const deleteSpeakingTopic = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid SpeakingTopic ID");
        }

        const speakingTopic = await SpeakingTopic.findByIdAndDelete(id);
        if (!speakingTopic) {
            return sendErrorResponse(res, 404, "SpeakingTopic not found");
        }

        return sendSuccessResponse(res, "SpeakingTopic deleted successfully");
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

