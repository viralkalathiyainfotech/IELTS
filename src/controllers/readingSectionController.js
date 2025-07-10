import mongoose from "mongoose";
import { ThrowError } from "../utils/ErrorUtils.js";
import ReadingSection from "../models/readingSectionModel.js";
import ReadingTest from "../models/readingTestModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";

export const addReadingSection = async (req, res) => {
    try {
        const { title, readingTestId, description } = req.body;

        if (!title || !readingTestId || !description) {
            return sendBadRequestResponse(res, "Title, ReadingTestId and description are Required!!!");
        }

        if (!mongoose.Types.ObjectId.isValid(readingTestId)) {
            return sendBadRequestResponse(res, "Invalid ReadingTest Id");
        }

        const readingTest = await ReadingTest.findById(readingTestId);
        if (!readingTest) {
            return sendBadRequestResponse(res, "ReadingTest not found with this Id");
        }

        const existingReadingSection = await ReadingSection.findOne({ title, readingTestId, description });
        if (existingReadingSection) {
            return sendBadRequestResponse(res, "Title already exists for this Test...");
        }

        const newReadingSection = await ReadingSection.create({
            title,
            readingTestId,
            description
        });

        return sendSuccessResponse(res, "ReadingSection created Successfully...", newReadingSection);

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
}

export const getAllReadingSection = async (req, res) => {
    try {
        const readingSection = await ReadingSection.find({})

        if (!readingSection || readingSection.length === 0) {
            return sendBadRequestResponse(res, "No any ReadingSection found!!!")
        }

        return sendSuccessResponse(res, "ReadingSection fetched Successfully...", readingSection)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getReadingSectionById = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid ReadingSection Id")
        }

        const readingSection = await ReadingSection.findById(id)

        if (!readingSection) {
            return sendBadRequestResponse(res, "ReadingSection not found")
        }

        return sendSuccessResponse(res, "ReadingSection fetched Successfully...", readingSection)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const updateReadingSection = async (req, res) => {
    try {
        const { id } = req.params;
        const { readingTestId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid ReadingSection Id");
        }

        if (readingTestId && !mongoose.Types.ObjectId.isValid(readingTestId)) {
            return sendBadRequestResponse(res, "Invalid ReadingTest Id");
        }
        if (readingTestId) {
            const readingTest = await ReadingTest.findById(readingTestId);
            if (!readingTest) {
                return sendBadRequestResponse(res, "ReadingTest not found with this Id");
            }
        }

        let readingSection = await ReadingSection.findById(id);
        if (!readingSection) {
            return sendBadRequestResponse(res, "ReadingSection not found");
        }

        // Prevent duplicate title in the same test
        if (req.body.title && readingSection.title !== req.body.title) {
            const duplicate = await ReadingSection.findOne({
                title: req.body.title,
                readingTestId: readingTestId || readingSection.readingTestId,
                _id: { $ne: id }
            });
            if (duplicate) {
                return sendBadRequestResponse(res, "Title already exists for this Test...");
            }
        }

        readingSection = await ReadingSection.findByIdAndUpdate(id, { ...req.body }, { new: true });

        return sendSuccessResponse(res, "ReadingSection Updated Successfully...", readingSection);

    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
}

export const deleteReadingSection = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid ReadingSection Id")
        }

        let readingSection = await ReadingSection.findById(id)
        if (!readingSection) {
            return sendBadRequestResponse(res, "ReadingSection not found")
        }
        readingSection = await ReadingSection.findByIdAndDelete(id)

        return sendSuccessResponse(res, "ReadingSection Deleted Successfully...", readingSection)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getSectionsByReadingTest = async (req, res) => {
    try {
        const { readingTestId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(readingTestId)) {
            return sendBadRequestResponse(res, "Invalid ReadingTest Id");
        }
        const sections = await ReadingSection.find({ readingTestId });
        if (!sections || sections.length === 0) {
            return sendBadRequestResponse(res, "No sections found for this ReadingTest");
        }
        return sendSuccessResponse(res, "Sections fetched successfully for this ReadingTest", sections);
    } catch (error) {
        return ThrowError(res, 500, error.message);
    }
};