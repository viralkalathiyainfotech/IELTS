import mongoose from "mongoose";
import { ThrowError } from "../utils/ErrorUtils.js";
import ReadingTest from "../models/readingTestModel.js";
import { sendBadRequestResponse, sendSuccessResponse } from "../utils/ResponseUtils.js";

export const addReadingTest = async (req, res) => {
    try {
        const { title, total_question } = req.body

        if (!title || !total_question) {
            return sendBadRequestResponse(res, "Title and total_question are Required!!!")
        }

        const existingReadingTest = await ReadingTest.findOne({ title })
        if (existingReadingTest) {
            return sendBadRequestResponse(res, "Title already exists for this Test...")
        }

        const newReadingTest = await ReadingTest.create({
            title,
            total_question
        })

        return sendSuccessResponse(res, "ReadingTest created Successfully...", newReadingTest)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getAllReadingTest = async (req, res) => {
    try {
        const readingTest = await ReadingTest.find({})

        if (!readingTest || readingTest.length === 0) {
            return sendBadRequestResponse(res, "No any ReadingTest found!!!")
        }

        return sendSuccessResponse(res, "ReadingTest fetched Successfully...", readingTest)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const getReadingTestById = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid ReadingTest Id")
        }

        const readingTest = await ReadingTest.findById(id)

        if (!readingTest) {
            return sendBadRequestResponse(res, "ReadingTest not found")
        }

        return sendSuccessResponse(res, "ReadingTest fetched Successfully...", readingTest)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const updateReadingTest = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {


            return sendBadRequestResponse(res, "Invalid ReadingTest Id")
        }
        let readingTest = await ReadingTest.findById(id)
        if (!readingTest) {
            return sendBadRequestResponse(res, "ReadingTest not found")
        }
        readingTest = await ReadingTest.findByIdAndUpdate(id, { ...req.body }, { new: true })

        return sendSuccessResponse(res, "ReadingTest Updated Successfully...", readingTest)

    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}

export const deleteReadingTest = async (req, res) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendBadRequestResponse(res, "Invalid ReadingTest Id")
        }

        let readingTest = await ReadingTest.findById(id)
        if (!readingTest) {
            return sendBadRequestResponse(res, "ReadingTest not found")
        }
        readingTest = await ReadingTest.findByIdAndDelete(id)

        return sendSuccessResponse(res, "ReadingTest Deleted Successfully...", readingTest)
    } catch (error) {
        return ThrowError(res, 500, error.message)
    }
}