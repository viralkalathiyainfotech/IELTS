import mongoose from "mongoose";
import { ThrowError } from "../utils/ErrorUtils.js";
import Paragraph from "../models/paragraphModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";

// Add Paragraph
export const addParagraph = async (req, res) => {
    try {
        const { readingSectionId, heading, description, paragraph, position } = req.body;

        if (!readingSectionId || !heading || !paragraph) {
            return sendBadRequestResponse(res, "readingSectionId, heading and paragraph are required!");
        }
        if (!mongoose.Types.ObjectId.isValid(readingSectionId)) {
            return sendBadRequestResponse(res, "Invalid ReadingSection Id");
        }

        // Optionally: check if Paragraph with same heading exists in this section
        const existingParagraph = await Paragraph.findOne({ heading, readingSectionId });
        if (existingParagraph) {
            return sendBadRequestResponse(res, "Heading already exists for this Section...");
        }

        const newParagraph = await Paragraph.create({
            readingSectionId,
            heading,
            description,
            paragraph,
            position
        });
        return sendSuccessResponse(res, "Paragraph created Successfully...", newParagraph);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get all Paragraphs
export const getAllParagraphs = async (req, res) => {
    try {
        const paragraphs = await Paragraph.find({});
        if (!paragraphs || paragraphs.length === 0) {
            return sendBadRequestResponse(res, "No Paragraphs found!");
        }
        return sendSuccessResponse(res, "Paragraphs fetched Successfully...", paragraphs);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Get Paragraph by Id
export const getParagraphById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Paragraph Id");
        }
        const paragraph = await Paragraph.findById(id);
        if (!paragraph) {
            return sendBadRequestResponse(res, "Paragraph not found");
        }
        return sendSuccessResponse(res, "Paragraph fetched Successfully...", paragraph);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Update Paragraph
export const updateParagraph = async (req, res) => {
    try {
        const { id } = req.params;
        const { readingSectionId } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Paragraph Id");
        }
        if (readingSectionId && !mongoose.Types.ObjectId.isValid(readingSectionId)) {
            return sendBadRequestResponse(res, "Invalid ReadingSection Id");
        }
        let paragraph = await Paragraph.findById(id);
        if (!paragraph) {
            return sendBadRequestResponse(res, "Paragraph not found");
        }
        // Prevent duplicate heading in the same section
        if (req.body.heading && paragraph.heading !== req.body.heading) {
            const duplicate = await Paragraph.findOne({
                heading: req.body.heading,
                readingSectionId: readingSectionId || paragraph.readingSectionId,
                _id: { $ne: id }
            });
            if (duplicate) {
                return sendBadRequestResponse(res, "Heading already exists for this Section...");
            }
        }
        paragraph = await Paragraph.findByIdAndUpdate(id, { ...req.body }, { new: true });
        return sendSuccessResponse(res, "Paragraph Updated Successfully...", paragraph);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

// Delete Paragraph
export const deleteParagraph = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid Paragraph Id");
        }
        let paragraph = await Paragraph.findById(id);
        if (!paragraph) {
            return sendBadRequestResponse(res, "Paragraph not found");
        }
        paragraph = await Paragraph.findByIdAndDelete(id);
        return sendSuccessResponse(res, "Paragraph Deleted Successfully...", paragraph);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};

export const getParagraphsBySection = async (req, res) => {
    try {
        const { readingSectionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(readingSectionId)) {
            return sendBadRequestResponse(res, "Invalid ReadingSection Id");
        }

        const paragraphs = await Paragraph.find({ readingSectionId });

        if (!paragraphs || paragraphs.length === 0) {
            return sendBadRequestResponse(res, "No Paragraphs found for this Section!");
        }

        return sendSuccessResponse(res, "Paragraphs fetched Successfully...", paragraphs);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};